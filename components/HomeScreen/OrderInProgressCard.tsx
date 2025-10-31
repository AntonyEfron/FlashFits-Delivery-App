import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { Package, Truck } from "lucide-react-native";

const OrderInProgressCard = () => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const storedOrder = await SecureStore.getItemAsync("acceptOrder");
        if (storedOrder) {
          const orderData = JSON.parse(storedOrder);
          setOrder(orderData);
        }
      } catch (error) {
        console.error("Failed to load order:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, []);

  const handleContinueOrder = async () => {
    const stepValue = await SecureStore.getItemAsync("orderStep");

    const step = stepValue ? parseInt(JSON.parse(stepValue)) : 0;
    console.log(step,'step3e89');
    

    // Navigate to order flow and pass step as param
    router.push({
      pathname: "/(orderFlow)",
      params: { step: step.toString() },
    });
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  if (!order) return null; // no active order → don't render anything

  return (
    <TouchableOpacity style={styles.card} onPress={handleContinueOrder}>
      <View style={styles.iconContainer}>
        <Truck size={32} color="#2563EB" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Order In Progress</Text>
        <Text style={styles.subtitle}>{order.shopName}</Text>
        <Text style={styles.amount}>₹{order.deliveryAmount}</Text>
      </View>
      <Package size={24} color="#2563EB" />
    </TouchableOpacity>
  );
};

export default OrderInProgressCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 16,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  iconContainer: {
    backgroundColor: "#E0E7FF",
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 2,
  },
  amount: {
    fontSize: 15,
    color: "#2563EB",
    fontWeight: "bold",
    marginTop: 4,
  },
});
