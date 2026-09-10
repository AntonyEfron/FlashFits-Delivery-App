// config/socketConfig.js — Robust rider socket with reconnection, heartbeat, and error handling
import { io as socketIO } from "socket.io-client";
import mitt from "mitt";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { playOrderAlert, forceStopAlert } from "../utils/alertManager";

let socket = null;
let currentRiderId = null;
let currentOrderId = null;
let heartbeatInterval = null;
let pendingOrderPayload = null; // Buffer for orderAssigned events (race condition fix)
let registeredRiderIdOnCurrentSocket = null;

export const emitter = mitt();

/**
 * Connect the rider socket with robust reconnection.
 * Emits 'connectionStatus' via mitt: { connected: boolean, reconnecting: boolean }
 */
export const connectRiderSocket = (riderId) => {
  if (riderId) {
    currentRiderId = riderId;
  }

  if (socket) {
    if (socket.connected) {
      // Only emit registerRider if this rider has NOT already registered on this active socket
      if (currentRiderId && registeredRiderIdOnCurrentSocket !== currentRiderId) {
        registeredRiderIdOnCurrentSocket = currentRiderId;
        socket.emit("registerRider", { riderId: currentRiderId });
      }
      return socket;
    } else {
      registeredRiderIdOnCurrentSocket = null;
      console.log("⚠️ Rider socket exists but disconnected, reconnecting...");
      if (currentRiderId) {
        socket.io.opts.query = { riderId: currentRiderId, role: "deliveryRider" };
      }
      socket.connect();
      return socket;
    }
  }

  const role = "deliveryRider";
  const backendUrl =
    Constants.expoConfig?.extra?.BACKEND_URL ||
    Constants.manifest?.extra?.BACKEND_URL ||
    "http://192.168.29.230:5000";
  socket = socketIO(backendUrl, {
    transports: ["websocket", "polling"],
    query: { riderId: currentRiderId, role },
    // Robust reconnection settings
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.5,
    timeout: 15000,
  });

  // ── Connection lifecycle ──
  socket.on("connect", async () => {
    console.log("✅ Rider connected to socket:", socket.id);
    emitter.emit("connectionStatus", { connected: true, reconnecting: false });

    let activeRiderId = currentRiderId;
    if (!activeRiderId) {
      activeRiderId = await SecureStore.getItemAsync("deliveryRiderId");
    }
    if (activeRiderId) {
      currentRiderId = activeRiderId;
      registeredRiderIdOnCurrentSocket = activeRiderId;
      console.log("Registering rider on connect:", activeRiderId);
      socket.emit("registerRider", { riderId: activeRiderId });
    }

    // Re-join the order room on connection/reconnection
    const savedOrderId = await SecureStore.getItemAsync("currentOrderId");
    if (savedOrderId) {
      currentOrderId = savedOrderId;
      console.log("Re-joining saved order:", savedOrderId);
      socket.emit("joinOrderRoom", savedOrderId);
    }

    // Start heartbeat ping
    startHeartbeat();
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Rider disconnected from socket. Reason:", reason);
    registeredRiderIdOnCurrentSocket = null;
    emitter.emit("connectionStatus", { connected: false, reconnecting: reason !== "io client disconnect" });
    stopHeartbeat();
  });

  socket.on("connect_error", (error) => {
    console.error("🔴 Socket connection error:", error.message);
    emitter.emit("connectionStatus", { connected: false, reconnecting: true });
  });

  socket.io.on("reconnect_attempt", (attempt) => {
    console.log(`🔄 Reconnection attempt #${attempt}`);
    emitter.emit("connectionStatus", { connected: false, reconnecting: true });
  });

  socket.io.on("reconnect", (attempt) => {
    console.log(`✅ Reconnected after ${attempt} attempt(s)`);
    // connectionStatus will be emitted by the 'connect' handler
  });

  socket.io.on("reconnect_failed", () => {
    console.error("🔴 All reconnection attempts failed");
    emitter.emit("connectionStatus", { connected: false, reconnecting: false });
  });

  // ── Order events ──
  socket.on("orderAssigned", async ({ orderId, orderPayload }) => {
    console.log("📦 Order assigned:", orderId);

    // Guard: Never alert or process if order is already completed or cancelled
    if (
      orderPayload?.orderStatus === "completed" ||
      orderPayload?.orderStatus === "cancelled" ||
      orderPayload?.deliveryRiderStatus === "completed" ||
      orderPayload?.deliveryRiderStatus === "cancelled"
    ) {
      console.log("⚠️ Ignoring orderAssigned for completed/cancelled order:", orderId);
      currentOrderId = null;
      pendingOrderPayload = null;
      forceStopAlert();
      await SecureStore.deleteItemAsync("currentOrderId").catch(() => { });
      return;
    }

    // Inspect active order and step in SecureStore
    let storedActiveOrder = null;
    let storedStepNum = 0;
    try {
      const storedOrderStr = await SecureStore.getItemAsync("acceptOrder");
      if (storedOrderStr) {
        storedActiveOrder = JSON.parse(storedOrderStr);
      }
      const storedStepStr = await SecureStore.getItemAsync("orderStep");
      if (storedStepStr) {
        const raw = typeof storedStepStr === "string" && storedStepStr.startsWith('"')
          ? JSON.parse(storedStepStr)
          : storedStepStr;
        storedStepNum = parseInt(raw, 10) || 0;
      }
    } catch (err) {
      console.warn("Error reading SecureStore in orderAssigned handler:", err);
    }

    const orderIdStr = String(orderId || "").trim();
    const isCurrentOrder =
      (currentOrderId && String(currentOrderId).trim() === orderIdStr) ||
      (storedActiveOrder?.orderId && String(storedActiveOrder.orderId).trim() === orderIdStr) ||
      (storedActiveOrder?._id && String(storedActiveOrder._id).trim() === orderIdStr);

    const isAlreadyAccepted =
      (orderPayload?.deliveryRiderStatus && !["queued", "unassigned"].includes(orderPayload.deliveryRiderStatus)) ||
      (storedStepNum > 0 && isCurrentOrder);

    // If this is the SAME order the rider is already fulfilling:
    if (isCurrentOrder && (isAlreadyAccepted || storedStepNum > 0)) {
      console.log(`ℹ️ Order ${orderIdStr} is already actively in progress (step: ${storedStepNum}), suppressing duplicate alert`);
      currentOrderId = orderIdStr;
      await SecureStore.setItemAsync("currentOrderId", orderIdStr);
      forceStopAlert(); // Strict silence: no siren
      socket.emit("joinOrderRoom", orderIdStr);
      emitter.emit("orderUpdate", orderPayload);
      return;
    }

    // If rider is already fulfilling ANOTHER active order:
    if (!isCurrentOrder && storedActiveOrder && storedStepNum > 0 && storedStepNum < 9) {
      console.log(`⚠️ Rider is already busy fulfilling order ${storedActiveOrder.orderId} at step ${storedStepNum}. Ignoring offer ${orderIdStr}`);
      return;
    }

    if (isAlreadyAccepted) {
      console.log("ℹ️ Order is already accepted/in-progress, routing as update instead of new alert:", orderIdStr);
      currentOrderId = orderIdStr;
      await SecureStore.setItemAsync("currentOrderId", orderIdStr);
      forceStopAlert();
      socket.emit("joinOrderRoom", orderIdStr);
      emitter.emit("orderUpdate", orderPayload);
      return;
    }

    currentOrderId = orderIdStr;
    await SecureStore.setItemAsync("currentOrderId", orderIdStr);

    // Buffer the payload so Home screen can consume it on mount
    // (fixes race condition when app cold-starts and listener isn't ready)
    pendingOrderPayload = orderPayload;

    emitter.emit("orderAssigned", orderPayload);

    // Trigger aggressive vibration and alert sound ONLY for fresh unaccepted offers
    playOrderAlert();

    socket.emit("joinOrderRoom", orderIdStr);
    console.log("Joined order room:", orderIdStr);
  });

  socket.on("orderUpdate", async (order) => {
    // Merge with stored order data to preserve locally-stored fields
    // (shopName, cutomerAddress, customerLocation etc. which backend doesn't send)
    try {
      const storedStr = await SecureStore.getItemAsync("acceptOrder");
      if (storedStr) {
        const storedOrder = JSON.parse(storedStr);
        const mergedOrder = { ...storedOrder, ...order };
        // Preserve fields that backend doesn't send
        if (!order.shopName && storedOrder.shopName) mergedOrder.shopName = storedOrder.shopName;
        if (!order.pickupLocation && storedOrder.pickupLocation) mergedOrder.pickupLocation = storedOrder.pickupLocation;
        if (!order.pickupLocationCorrdinates && storedOrder.pickupLocationCorrdinates) mergedOrder.pickupLocationCorrdinates = storedOrder.pickupLocationCorrdinates;
        if (!order.merchantId && storedOrder.merchantId) mergedOrder.merchantId = storedOrder.merchantId;
        if (!order.pickupAddress && storedOrder.pickupAddress) mergedOrder.pickupAddress = storedOrder.pickupAddress;
        if (!order.cutomerAddress && storedOrder.cutomerAddress) mergedOrder.cutomerAddress = storedOrder.cutomerAddress;
        if (!order.customerLocation && storedOrder.customerLocation) mergedOrder.customerLocation = storedOrder.customerLocation;
        if (!order.deliveryAmount && storedOrder.deliveryAmount) mergedOrder.deliveryAmount = storedOrder.deliveryAmount;
        if (!order.deliveryCharge && storedOrder.deliveryCharge) mergedOrder.deliveryCharge = storedOrder.deliveryCharge;
        if (!order.originalDeliveryCharge && storedOrder.originalDeliveryCharge) mergedOrder.originalDeliveryCharge = storedOrder.originalDeliveryCharge;
        if (!order.returnCharge && storedOrder.returnCharge) mergedOrder.returnCharge = storedOrder.returnCharge;
        if (!order.originalReturnCharge && storedOrder.originalReturnCharge) mergedOrder.originalReturnCharge = storedOrder.originalReturnCharge;
        if (!order.tip && storedOrder.tip) mergedOrder.tip = storedOrder.tip;
        if (!order.deliveryTip && storedOrder.deliveryTip) mergedOrder.deliveryTip = storedOrder.deliveryTip;
        if (!order.finalBilling && storedOrder.finalBilling) mergedOrder.finalBilling = storedOrder.finalBilling;

        // Persist merged order back to SecureStore for resume
        await SecureStore.setItemAsync("acceptOrder", JSON.stringify(mergedOrder));
        emitter.emit("orderUpdate", mergedOrder);
        return;
      }
    } catch (err) {
      console.error("Error merging order update:", err);
    }

    // Fallback: emit raw order
    emitter.emit("orderUpdate", order);
  });

  return socket;
};

/**
 * Send rider's current location to the backend.
 */
export const sendRiderLocation = (riderId, lat, lng) => {
  if (!socket || !socket.connected) return;
  socket.emit("updateLocation", { riderId, lat, lng, orderIdIfAny: currentOrderId });
};

/**
 * Disconnect the rider socket cleanly.
 * riderId is optional — pulled from socket data if not provided.
 */
export const disconnectRiderSocket = (riderId) => {
  if (socket) {
    if (riderId) {
      socket.emit("riderOffline", { riderId });
    }
    stopHeartbeat();
    socket.removeAllListeners();
    socket.io.removeAllListeners();
    socket.disconnect();
    console.log("🧹 Rider socket fully disconnected");
    socket = null;
    currentRiderId = null;
  }
};

export const getSocket = () => socket;

export const joinOrderRoom = (orderId) => {
  if (socket && socket.connected) {
    console.log("✅ Emitting joinOrderRoom event for order:", orderId);
    socket.emit("joinOrderRoom", orderId);
  } else {
    console.error("❌ Cannot join order room: Socket not connected");
  }
};

export const clearCurrentOrder = async () => {
  currentOrderId = null;
  pendingOrderPayload = null;
  try {
    await SecureStore.deleteItemAsync("currentOrderId");
    await SecureStore.deleteItemAsync("acceptOrder");
    await SecureStore.deleteItemAsync("orderStep");
    await SecureStore.deleteItemAsync("status");
    await SecureStore.deleteItemAsync("startTime");
  } catch (e) {
    console.error("Error clearing current order from SecureStore:", e);
  }
  emitter.emit("orderSynced");
};

/**
 * Consume any buffered order assignment.
 * Returns the payload and clears it, or null if no pending order.
 * Called by Home screen on mount to catch orders that arrived
 * before the listener was attached (race condition fix).
 */
export const consumePendingOrder = () => {
  const payload = pendingOrderPayload;
  pendingOrderPayload = null;
  if (
    payload?.orderStatus === "completed" ||
    payload?.orderStatus === "cancelled" ||
    payload?.deliveryRiderStatus === "completed" ||
    payload?.deliveryRiderStatus === "cancelled"
  ) {
    return null;
  }
  return payload;
};

// ── Heartbeat — keeps the connection alive and rider status fresh ──
function startHeartbeat() {
  stopHeartbeat();
  heartbeatInterval = setInterval(async () => {
    if (socket && socket.connected) {
      const activeId = currentRiderId || (await SecureStore.getItemAsync("deliveryRiderId"));
      socket.emit("ping", { riderId: activeId });
    }
  }, 30000); // ping every 30 seconds
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}