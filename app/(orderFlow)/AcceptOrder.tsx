import React, { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Modalize } from "react-native-modalize";
import * as SecureStore from "expo-secure-store";
import { AcceptOrderApi } from "../api/orderFlow"; // 👈 import the function
import { joinOrderRoom } from '../../config/socketConfig'

interface AcceptOrderProps {
  onNext: () => void;
}

const AcceptOrder: React.FC<AcceptOrderProps> = ({ onNext }) => {
  const modalRef = useRef<Modalize>(null);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => modalRef.current?.open(), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadOrder = async () => {
      const storedOrder = await SecureStore.getItemAsync("currentOrder");
      if (storedOrder) setOrder(JSON.parse(storedOrder));
    };
    loadOrder();
  }, []);

  const handleAcceptOrder = async () => {
    try {
      setLoading(true);
      // const riderId = await SecureStore.getItemAsync("deliveryRiderId");

      if (!order?.orderId ) {
        Alert.alert("Error", "Missing order or rider info.");
        return;
      }
   
      const result = await AcceptOrderApi(order.orderId); // 👈 use exported API
      console.log("✅ Order accepted:", result );

      await joinOrderRoom(order.orderId)

      modalRef.current?.close();
      onNext();
    } catch (error) {
      console.error("❌ Failed to accept order:", error);
      Alert.alert("Failed", "Could not accept the order. Try again.");
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <Modalize
      ref={modalRef}
      modalHeight={300}
      handleStyle={{ backgroundColor: "#ccc" }}
      overlayStyle={{ backgroundColor: "rgba(0,0,0,0.3)" }}
      closeOnOverlayTap={false}
      panGestureEnabled={false}
      disableScrollIfPossible
      withHandle
    >
      <View style={styles.container}>
        <Text style={styles.title}>New Order Request</Text>
        <Text style={styles.info}>
          Pickup:  "ABC Restaurant, MG Road"
        </Text>
        <Text style={styles.info}>Delivery Amount: ₹{order?.amount || 120}</Text>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleAcceptOrder}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Accept Order</Text>}
        </TouchableOpacity>
      </View>
    </Modalize>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  info: { fontSize: 16, marginBottom: 10 },
  button: {
    backgroundColor: "#16a34a",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});

export default AcceptOrder;
