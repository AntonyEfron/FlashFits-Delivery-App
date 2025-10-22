// src/config/riderSocket.ts
import io from "socket.io-client/dist/socket.io";
import mitt from "mitt";
import Constants from "expo-constants";

let socket = null;
export const emitter = mitt();
export const connectRiderSocket = (riderId) => {
  if (socket && socket.connected) {
    console.log("⚠️ Rider socket already connected:", socket.id);
    return socket;
  }

  const role = "deliveryRider";
  socket = io(Constants.expoConfig.extra.BACKEND_URL, {
    transports: ["websocket"],
    query: { riderId, role },
  });

  socket.on("connect", () => {
    console.log("✅ Rider connected to socket:", socket.id);
    socket.emit("registerRider", { riderId });
  });

  socket.on("disconnect", () => {
    console.log("❌ Rider disconnected from socket");
  });

  socket.on("orderAssigned", ({ orderId, orderPayload }) => {
    console.log("📦 Order assigned:", orderPayload);
    emitter.emit("orderAssigned", orderPayload);
    // router.push("/(orderFlow)");
  });

  socket.on("orderUpdate", (order) => {
    console.log('orderUpdated 📦📦📦📦📦' );
    emitter.emit("orderUpdate", order);
  });

  socket.on("reconnect", () => {
    console.log("🔄 Reconnected to server");
    socket.emit("registerRider", { riderId });
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