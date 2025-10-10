// src/config/riderSocket.ts
import io from "socket.io-client/dist/socket.io";

import mitt from "mitt";
import Constants from "expo-constants";
// import { registerRiderOrderListeners } from "./orderListeners";

// Socket instance
let socket = null;

// Typed emitter for frontend components
export const emitter = mitt();

/**
 * Connect rider socket when going online
 * @param riderId string
 */
export const connectRiderSocket = (riderId) => {
    console.log("✅ Rider connected to socket:", socket?.id);
  const role = "deliveryRider";

  socket = io(Constants.expoConfig.extra.BACKEND_URL, {
    transports: ["websocket"],
    query: { riderId, role },
  });

  socket.on("connect", () => {
    console.log("✅ Rider connected to socket:", socket?.id);
    socket?.emit("registerRider", { riderId }); // match backend
// Backend can track online riders
  });

  socket.on("disconnect", () => {
    console.log("❌ Rider disconnected from socket");
  });

  socket.on("orderAssigned", ({orderId,orderPayload}) => {
    console.log(orderPayload);
    
    // emitter.emit("newOrder", orderPayload);
});

socket.on("orderUpdate", (order) => {
    emitter.emit("orderUpdate", order);
});

  // Listen for order updates
//   registerRiderOrderListeners(socket);

  return socket;
};


// export const registerRiderOrderListeners = (socket) => {
//     socket.on("newOrder", (order) => {
//         emitter.emit("newOrder", order);
//     });
    
//     socket.on("orderUpdate", (order) => {
//         emitter.emit("orderUpdate", order);
//     });
// };

export const sendRiderLocation = (riderId, lat, lng) => {
    if (!socket) return;
    console.log("✅ Rider location sent to socket:", riderId);
    socket.emit("updateLocation", { riderId, lat, lng });
};

export const disconnectRiderSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};