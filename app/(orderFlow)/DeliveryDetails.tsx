import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Animated,
  Linking,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { AnimatedDots } from "../../components/OrderFlowComponents/AnimatedDots";
import { HandoverPackageApi } from "../api/orderFlow";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const FALLBACK_LOCATION = { lat: 9.9312, lng: 76.2673 };

type DeliveryStatus = "pending" | "trying";

const AnimatedEarningsCircle = ({ earnings }: { earnings: number }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    scaleAnimation.start();
    pulseAnimation.start();
    return () => {
      scaleAnimation.stop();
      pulseAnimation.stop();
    };
  }, []);

  return (
    <View style={styles.earningsCircleContainer}>
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: pulseAnim.interpolate({
              inputRange: [1, 1.3],
              outputRange: [0.4, 0],
            }),
          },
        ]}
      />
      <Animated.View
        style={[styles.earningsCircle, { transform: [{ scale: scaleAnim }] }]}
      >
        <MaterialCommunityIcons name="currency-inr" size={24} color="#fff" />
        <Text style={styles.earningsCircleAmount}>{earnings}</Text>
        <Text style={styles.earningsCircleLabel}>Earned</Text>
      </Animated.View>
    </View>
  );
};

const DeliveryDetails = ({
  onNext, orderStatus
}: {
  onNext: (route: "earnings" | "returnVerification") => void;
  orderStatus: string;
}) => {
  const [status, setStatus] = useState<DeliveryStatus>("pending");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [orderData, setOrderData] = useState<any>(null);

  const TRY_DURATION = 600; // 10 min max
  const BASE_EARNINGS = 8;
  const EARNINGS_AFTER_10MIN = 2;

  // Load stored order and saved state
  useEffect(() => {
    const fetchOrderAndState = async () => {
      try {
        const storedOrder = await SecureStore.getItemAsync("acceptOrder");
        const savedStatus = await SecureStore.getItemAsync("status");
        const savedStartTime = await SecureStore.getItemAsync("startTime");

        if (storedOrder) {
          const parsed = JSON.parse(storedOrder);
          setOrderData(parsed);
        }

        // If status is 'trying', resume timer from stored time
        if (savedStatus === "trying" && savedStartTime) {
          const startTime = Number(savedStartTime);
          const now = Date.now();
          const diffSec = Math.floor((now - startTime) / 1000);
          setTimeElapsed(diffSec);
          setStatus("trying");
        }
      } catch (err) {
        console.error("Error fetching order or state:", err);
      }
    };
    fetchOrderAndState();
  }, []);

  // Timer control
  useEffect(() => {
    if (status !== "trying") return;

    setEarnings(BASE_EARNINGS);

    const timer = setInterval(() => {
      setTimeElapsed((prev) => {
        if (prev + 1 >= TRY_DURATION) {
          clearInterval(timer);
          // handleTryPeriodEnd();
          return TRY_DURATION;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

useEffect(() => {
  if (status === "trying") {
    const minutes = Math.floor(timeElapsed / 60);

    // ✅ Always start with base earnings
    let calc = BASE_EARNINGS;

    // ✅ After 10 minutes, increase earnings by 1 per minute
    if (minutes >= 10) {
      const extra = (minutes - 9) * EARNINGS_AFTER_10MIN;
      calc += extra;
    }

    setEarnings(calc);
  }
}, [timeElapsed, status]);

  // 🔹 Expanded handleHandover function
  const handleHandover = async () => {
    try {
      if (!orderData?.orderId) {
        Alert.alert("Error", "No order found to hand over.");
        return;
      }

      // Call API
      const response = await HandoverPackageApi({
        orderId: orderData.orderId,
      });

      if (response) {
        const currentTime = Date.now().toString();
        await SecureStore.setItemAsync("status", "trying");
        await SecureStore.setItemAsync("startTime", currentTime);
        setStatus("trying");
        setTimeElapsed(0);
      } else {
        Alert.alert("Error", "Failed to update handover status.");
      }
    } catch (err) {
      console.error("Handover API Error:", err);
      Alert.alert("Error", "Could not start try period. Please retry.");
    }
  };

  // const handleTryPeriodEnd = () => {
  //   SecureStore.deleteItemAsync("status");
  //   SecureStore.deleteItemAsync("startTime");
  //   Alert.alert("Customer Decision", "Did the customer buy all the clothes?", [
  //     { text: "Yes, all bought", onPress: () => onNext("earnings") },
  //     {
  //       text: "No, some returned",
  //       onPress: () => onNext("returnVerification"),
  //     },
  //   ]);
  // };

  const handleMap = () => {
    const lat = orderData?.customerLocation?.lat || FALLBACK_LOCATION.lat;
    const lng = orderData?.customerLocation?.lng || FALLBACK_LOCATION.lng;
    Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`);
  };

  const handleCallCustomer = () => {
    const phoneNumber = orderData?.customerPhone || "+911234567890";
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!orderData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading Order...</Text>
      </View>
    );
  }

  const orderId = orderData?.orderId
    ? `ORD-${orderData.orderId.slice(-4).toUpperCase()}`
    : "ORD-XXXX";
  const customerName = orderData?.customerName || "Customer";
  const address =
    orderData?.cutomerAddress !== "null"
      ? orderData.cutomerAddress
      : "No address available";
  const items = orderData?.items || [];

  if (status === "pending") {
    return (
      <ScrollView
        style={styles.containerBlue}
        contentContainerStyle={styles.scrollContentPending}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Deliver Order</Text>
            <View style={styles.badgeBlue}>
              <Text style={styles.badgeTextBlue}>Try & Buy</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Info label="Order ID" value={orderId} />
            <Info label="Customer Name" value={customerName} />
            <Info label="Delivery Address" value={address} />
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Items ({items.length})</Text>
              {items.map((item: any, index: number) => (
                <View key={item._id || index} style={styles.itemRow}>
                  <Text style={styles.itemText} numberOfLines={2}>
                    🛍️ {item.name}
                  </Text>
                  <Text style={styles.itemPrice}>× {item.quantity}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actionButtonsContainer}>
            <ActionButton
              color="#3b82f6"
              icon="map"
              text="Open Map"
              onPress={handleMap}
            />
            <ActionButton
              color="#10b981"
              icon="person"
              text="Call Customer"
              onPress={handleCallCustomer}
            />
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleHandover}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="package-variant"
              size={24}
              color="#fff"
            />
            <View style={styles.textContainer}>
              <Text style={styles.primaryButtonText}>
                Handover Package (Start Try Period)
              </Text>
              <Text style={styles.primaryButtonSubtext}>
                Earn while you wait
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (status === "trying") {
    const progress = (timeElapsed / TRY_DURATION) * 100;
    return (
      <ScrollView
        style={styles.containerAmber}
        contentContainerStyle={styles.scrollContentTrying}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.centerContent}>
            <View style={styles.iconCircleAmber}>
              <Ionicons name="time" size={56} color="#d97706" />
            </View>
            <Text style={styles.headerTitle}>Try Period Active</Text>
            <Text style={styles.subtitle}>Customer is trying the products</Text>
          </View>

          <View style={styles.timerCard}>
            <AnimatedEarningsCircle earnings={earnings} />
            <View style={styles.timerIconRow}>
              <Ionicons name="hourglass-outline" size={28} color="#fff" />
              <Text style={styles.timerLabel}>Time Elapsed</Text>
            </View>
            <Text style={styles.timerValue}>{formatTime(timeElapsed)}</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.timerSubtext}>
              Earn ₹1 for every minute after 10 minutes
            </Text>
          </View>

          <TouchableOpacity
            style={styles.buttonGreenLarge}
            // onPress={handleTryPeriodEnd}
            activeOpacity={0.8}
          >
            <View style={styles.waitingButtonContent}>
              <Text style={styles.waitingButtonText}>
                Waiting for the return
              </Text>
              <AnimatedDots />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return null;
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoCard}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={3}>
      {value}
    </Text>
  </View>
);

const ActionButton = ({ color, icon, text, onPress }: any) => (
  <TouchableOpacity
    style={[styles.actionButton, { backgroundColor: color }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Ionicons name={icon} size={22} color="#fff" />
    <Text style={styles.buttonText}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  containerBlue: {
    flex: 1,
    backgroundColor: "#dbeafe",
  },
  containerAmber: {
    flex: 1,
    backgroundColor: "#fef3c7",
  },
  scrollContentPending: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  scrollContentTrying: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    flex: 1,
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 24,
    textAlign: "center",
  },
  badgeBlue: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeTextBlue: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 6,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    lineHeight: 22,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  itemText: {
    fontSize: 15,
    color: "#374151",
    flex: 1,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    elevation: 3,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  textContainer: {
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButtonSubtext: {
    color: "#e0e7ff",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  centerContent: {
    alignItems: "center",
    marginBottom: 28,
  },
  iconCircleAmber: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonGreenLarge: {
    backgroundColor: "#16a34a",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  waitingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  waitingButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  earningsCircleContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 24,
  },
  pulseRing: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#16a34a",
  },
  earningsCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  earningsCircleAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 2,
  },
  earningsCircleLabel: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
    marginTop: 2,
  },
  timerCard: {
    backgroundColor: "#f59e0b",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  timerIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  timerLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  timerValue: {
    color: "white",
    fontSize: 64,
    fontWeight: "bold",
    marginBottom: 20,
    letterSpacing: 2,
  },
  timerSubtext: {
    color: "white",
    fontSize: 13,
    opacity: 0.9,
    marginTop: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  progressBarBg: {
    width: "100%",
    height: 10,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 5,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
});

export default DeliveryDetails;
