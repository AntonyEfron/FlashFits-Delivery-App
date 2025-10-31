import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { Modalize } from "react-native-modalize";
import * as SecureStore from "expo-secure-store";
import { AcceptOrderApi } from "../api/orderFlow";
import { joinOrderRoom } from "../../config/socketConfig";
import { emitter } from "../../config/socketConfig";

const { width } = Dimensions.get("window");

interface AcceptOrderProps {
  onNext: () => void;
}

const AcceptOrder: React.FC<AcceptOrderProps> = ({ onNext }) => {
  const modalRef = useRef<Modalize>(null);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  console.log(order, "Order Data");

  // Pulse animation for the new order indicator
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Fade in animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [order]);

  // Open the modal when the component mounts
  useEffect(() => {
    const timer = setTimeout(() => modalRef.current?.open(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Load stored order data
  useEffect(() => {
    const loadOrder = async () => {
      const storedOrder = await SecureStore.getItemAsync("acceptOrder");
      if (storedOrder) {
        const parsedOrder = JSON.parse(storedOrder);
        console.log("📦 Loaded order data from SecureStore:", parsedOrder);
        setOrder(parsedOrder);
      }
    };
    loadOrder();
  }, []);

  const handleAcceptOrder = async () => {
    try {
      setLoading(true);

      if (!order) {
        Alert.alert("Error", "Missing order information.");
        return;
      }

      console.log(order,'y879');
      

      const result = await AcceptOrderApi(order.orderId);
      console.log("✅ Order accepted:", result);
      if (result){
      await SecureStore.setItemAsync("orderStep", JSON.stringify('1'));
      }
      await joinOrderRoom(order.orderId);

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
      adjustToContentHeight
      handlePosition="inside"
      modalStyle={styles.modal}
      handleStyle={styles.handle}
      overlayStyle={styles.overlay}
      closeOnOverlayTap={false}
    >
      <View style={styles.container}>
        {/* Header with pulse animation */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.badge,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Text style={styles.badgeText}>NEW</Text>
          </Animated.View>
          <Text style={styles.title}>New Order Request</Text>
          <Text style={styles.subtitle}>Review and accept the delivery</Text>
        </View>

        {order ? (
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Order Card */}
            <View style={styles.card}>
              {/* Pickup Section */}
              <View style={styles.section}>
                <View style={styles.iconContainer}>
                  <View style={styles.pickupIcon}>
                    <Text style={styles.iconText}>📍</Text>
                  </View>
                </View>
                <View style={styles.sectionContent}>
                  <Text style={styles.label}>Pickup Location</Text>
                  <Text style={styles.value}>
                    {order.shopName || "Unknown Shop"}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Delivery Amount Section */}
              <View style={styles.section}>
                <View style={styles.iconContainer}>
                  <View style={styles.amountIcon}>
                    <Text style={styles.iconText}>💰</Text>
                  </View>
                </View>
                <View style={styles.sectionContent}>
                  <Text style={styles.label}>Delivery Earnings</Text>
                  <Text style={styles.amountValue}>
                    ₹{order.deliveryAmount || 0}
                  </Text>
                </View>
              </View>

              {/* Order ID (subtle) */}
              <View style={styles.orderIdContainer}>
                <Text style={styles.orderId}>
                  Order ID: {order.orderId?.slice(-8) || "N/A"}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={handleAcceptOrder}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Accept Order</Text>
                    <Text style={styles.buttonIcon}>✓</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Optional: Decline button
              <TouchableOpacity
                style={[styles.button, styles.declineButton]}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
              */}
            </View>
          </Animated.View>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#16a34a" />
            <Text style={styles.loadingText}>Loading order details...</Text>
          </View>
        )}
      </View>
    </Modalize>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    backgroundColor: "#cbd5e1",
    width: 40,
    height: 5,
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  container: {
    padding: 24,
    paddingBottom: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  badge: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "400",
  },
  content: {
    width: "100%",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginRight: 16,
  },
  pickupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  amountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 22,
  },
  sectionContent: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 17,
    color: "#0f172a",
    fontWeight: "600",
  },
  amountValue: {
    fontSize: 24,
    color: "#16a34a",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 16,
  },
  orderIdContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  orderId: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
  },
  actions: {
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: "#16a34a",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  buttonIcon: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  declineButton: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  declineButtonText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: "#64748b",
  },
});

export default AcceptOrder;