// config/socketConfig.js — Robust rider socket with reconnection, heartbeat, and error handling
import { io as socketIO } from "socket.io-client";
import mitt from "mitt";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { playOrderAlert } from "../utils/alertManager";

let socket = null;
let currentOrderId = null;
let heartbeatInterval = null;

export const emitter = mitt();

/**
 * Connect the rider socket with robust reconnection.
 * Emits 'connectionStatus' via mitt: { connected: boolean, reconnecting: boolean }
 */
export const connectRiderSocket = (riderId) => {
  if (socket) {
    if (socket.connected) {
      console.log("⚠️ Rider socket already connected:", socket.id);
      return socket;
    } else {
      console.log("⚠️ Rider socket exists but disconnected, reconnecting...");
      socket.io.opts.query = { riderId, role: "deliveryRider" };
      socket.connect();
      return socket;
    }
  }

  const role = "deliveryRider";
  socket = socketIO(Constants.expoConfig.extra.BACKEND_URL, {
    transports: ["websocket"],
    query: { riderId, role },
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

    socket.emit("registerRider", { riderId });

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

    currentOrderId = orderId;
    await SecureStore.setItemAsync("currentOrderId", orderId);

    emitter.emit("orderAssigned", orderPayload);

    // Trigger aggressive vibration and alert sound
    playOrderAlert();

    socket.emit("joinOrderRoom", orderId);
    console.log("Joined order room:", orderId);
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
        if (!order.cutomerAddress && storedOrder.cutomerAddress) mergedOrder.cutomerAddress = storedOrder.cutomerAddress;
        if (!order.customerLocation && storedOrder.customerLocation) mergedOrder.customerLocation = storedOrder.customerLocation;
        if (!order.deliveryAmount && storedOrder.deliveryAmount) mergedOrder.deliveryAmount = storedOrder.deliveryAmount;

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
  socket.emit("updateLocation", { riderId, lat, lng });
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
  await SecureStore.deleteItemAsync("currentOrderId");
};

// ── Heartbeat — keeps the connection alive and rider status fresh ──
function startHeartbeat() {
  stopHeartbeat();
  heartbeatInterval = setInterval(() => {
    if (socket && socket.connected) {
      socket.emit("ping");
    }
  }, 30000); // ping every 30 seconds
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}