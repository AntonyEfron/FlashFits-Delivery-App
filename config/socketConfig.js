// src/config/riderSocket.ts
import io from "socket.io-client/dist/socket.io";
import mitt from "mitt";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
let socket = null;
let currentOrderId = null;
export const emitter = mitt();
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
  socket = io(Constants.expoConfig.extra.BACKEND_URL, {
    transports: ["websocket"],
    query: { riderId, role },
  });

  socket.on("connect", async () => {
    console.log("✅ Rider connected to socket:", socket.id);
    socket.emit("registerRider", { riderId });

    // Ensure we re-join the order room on connection/reconnection
    const savedOrderId = await SecureStore.getItemAsync("currentOrderId");
    if (savedOrderId) {
      currentOrderId = savedOrderId;
      console.log("Re-joining saved order:", savedOrderId);
      socket.emit("joinOrderRoom", savedOrderId);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Rider disconnected from socket");
  });

  // When rider gets assigned an order — SAVE IT
  socket.on("orderAssigned", async ({ orderId, orderPayload }) => {
    console.log("Order assigned:", orderPayload);

    currentOrderId = orderId;

    // SAVE TO SECURESTORE SO IT SURVIVES REFRESH
    await SecureStore.setItemAsync("currentOrderId", orderId);

    emitter.emit("orderAssigned", orderPayload);

    socket.emit("joinOrderRoom", orderId);
    console.log("Joined order room:", orderId);
  });

  socket.on("orderUpdate", (order) => {
    // console.log('orderUpdated 📦📦📦📦📦' );
    emitter.emit("orderUpdate", order);
  });

  return socket;
};

export const sendRiderLocation = (riderId, lat, lng) => {
  if (!socket || !socket.connected) return;
  console.log("✅ Rider location sent:", lat, lng);
  socket.emit("updateLocation", { riderId, lat, lng });
};

export const disconnectRiderSocket = (riderId) => {
  if (socket) {
    socket.emit("riderOffline", { riderId });
    socket.removeAllListeners();
    socket.disconnect();
    console.log("🧹 Rider socket fully disconnected");
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinOrderRoom = (orderId: string) => {
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