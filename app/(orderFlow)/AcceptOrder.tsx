import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { AcceptOrderApi } from "../api/orderFlow";
import { joinOrderRoom } from "../../config/socketConfig";
import { stopOrderAlert } from "../../utils/alertManager";

interface AcceptOrderProps {
  onNext: () => void;
  order?: any;
}

const AcceptOrder: React.FC<AcceptOrderProps> = ({ onNext, order: propOrder }) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(propOrder || null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Sync prop order
  useEffect(() => {
    if (propOrder) {
      setOrder(propOrder);
    }
  }, [propOrder]);

  // Pulse animation for the NEW order indicator badge
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Slide up bottom sheet and fade in backdrop on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 24,
        mass: 0.8,
        stiffness: 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, backdropAnim]);

  // Load stored order data as fallback if prop wasn't provided
  useEffect(() => {
    const loadOrder = async () => {
      if (!order) {
        try {
          const storedOrder = await SecureStore.getItemAsync("acceptOrder");
          if (storedOrder) {
            const parsedOrder = JSON.parse(storedOrder);
            setOrder(parsedOrder);
            if (parsedOrder.orderId) {
              await SecureStore.setItemAsync("currentOrderId", parsedOrder.orderId);
            }
          }
        } catch (err) {
          console.error("Failed to load stored order in AcceptOrder:", err);
        }
      }
    };
    loadOrder();
  }, [order]);

  // Stop alert sound/vibration when unmounting
  useEffect(() => {
    return () => {
      stopOrderAlert();
    };
  }, []);

  const handleDismissAlert = () => {
    stopOrderAlert();
    setAlertDismissed(true);
  };

  const handleAcceptOrder = async () => {
    try {
      stopOrderAlert();

      if (!order || !order.orderId) {
        Alert.alert("Error", "Missing order information.");
        return;
      }

      setLoading(true);

      const result = await AcceptOrderApi(order.orderId);
      if (result) {
        const nextStep =
          order?.orderStatus === "packed" || result?.order?.orderStatus === "packed"
            ? "2"
            : "1";
        await SecureStore.setItemAsync("orderStep", String(nextStep));
      }
      await joinOrderRoom(order.orderId);

      // Slide down and transition to next step
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 400,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onNext();
      });
    } catch (error) {
      console.error("❌ Failed to accept order:", error);
      Alert.alert("Failed", "Could not accept the order. Try again.");
      setLoading(false);
    }
  };

  // Earnings calculations
  const deliveryCharge =
    order?.originalDeliveryCharge ??
    order?.finalBilling?.deliveryCharge ??
    order?.deliveryCharge ??
    order?.deliveryAmount ??
    0;
  const returnCharge =
    order?.originalReturnCharge ?? order?.returnCharge ?? 0;
  const tipCharge =
    order?.finalBilling?.deliveryTip ??
    order?.deliveryTip ??
    order?.tip ??
    0;
  const totalEarnings =
    (deliveryCharge + returnCharge + tipCharge) || order?.deliveryAmount || 0;

  return (
    <View style={styles.screenWrapper}>
      {/* Dimmed backdrop overlay */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />

      {/* Clean, Non-Scrolling Bottom Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY: slideAnim }],
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {order ? (
          <View style={styles.content}>
            {/* Header Row: Badge + Title on Left, Order ID on Right */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
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
                <Text style={styles.headerTitle}>New Delivery Offer</Text>
              </View>

              <View style={styles.orderIdBadge}>
                <Text style={styles.orderIdText}>
                  #{order.orderId ? order.orderId.slice(-6).toUpperCase() : "N/A"}
                </Text>
              </View>
            </View>

            {/* Total Earnings Card */}
            <View style={styles.earningsCard}>
              <View style={styles.earningsMain}>
                <Text style={styles.earningsLabel}>TOTAL EARNINGS</Text>
                <Text style={styles.earningsAmount}>₹{totalEarnings}</Text>
              </View>

              {/* Compact Breakdown Tags */}
              <View style={styles.breakdownContainer}>
                {deliveryCharge > 0 && (
                  <View style={styles.breakdownTag}>
                    <Text style={styles.breakdownText}>🚴 ₹{deliveryCharge}</Text>
                  </View>
                )}
                {returnCharge > 0 && (
                  <View style={[styles.breakdownTag, styles.returnTag]}>
                    <Text style={[styles.breakdownText, styles.returnText]}>
                      🔄 ₹{returnCharge}
                    </Text>
                  </View>
                )}
                {tipCharge > 0 && (
                  <View style={[styles.breakdownTag, styles.tipTag]}>
                    <Text style={[styles.breakdownText, styles.tipText]}>
                      💝 +₹{tipCharge} tip
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Pickup Location Card */}
            <View style={styles.pickupCard}>
              <View style={styles.pickupIconBox}>
                <Text style={styles.pickupIcon}>📍</Text>
              </View>

              <View style={styles.pickupDetails}>
                <Text style={styles.pickupLabel}>PICKUP FROM</Text>
                <Text style={styles.shopName} numberOfLines={1}>
                  {order.shopName || "Store / Merchant"}
                </Text>
                {order.pickupAddress && order.pickupAddress !== "null" ? (
                  <Text style={styles.pickupAddress} numberOfLines={1}>
                    {order.pickupAddress}
                  </Text>
                ) : null}
              </View>

              {order.deliveryDistance ? (
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>{order.deliveryDistance}</Text>
                </View>
              ) : null}
            </View>

            {/* Action Bar (1 Single Row - No Scrolling!) */}
            <View style={styles.actionsRow}>
              {!alertDismissed && (
                <TouchableOpacity
                  style={styles.muteButton}
                  onPress={handleDismissAlert}
                  activeOpacity={0.7}
                >
                  <Text style={styles.muteButtonText}>🔇 Mute</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.acceptButton,
                  !alertDismissed && styles.acceptButtonWithMute,
                ]}
                onPress={handleAcceptOrder}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.acceptButtonText}>Accept Order</Text>
                    <Text style={styles.acceptButtonIcon}>✓</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#16a34a" />
            <Text style={styles.loadingText}>Fetching order details...</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 4,
  },
  handle: {
    backgroundColor: "#cbd5e1",
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  content: {
    paddingTop: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
  },
  orderIdBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  orderIdText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  earningsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0fdf4",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginBottom: 8,
  },
  earningsMain: {
    justifyContent: "center",
  },
  earningsLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#15803d",
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  earningsAmount: {
    fontSize: 26,
    fontWeight: "800",
    color: "#16a34a",
  },
  breakdownContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 4,
    maxWidth: "55%",
  },
  breakdownTag: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  breakdownText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803d",
  },
  returnTag: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  returnText: {
    color: "#2563eb",
  },
  tipTag: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
  },
  tipText: {
    color: "#b45309",
  },
  pickupCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
  },
  pickupIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  pickupIcon: {
    fontSize: 18,
  },
  pickupDetails: {
    flex: 1,
    justifyContent: "center",
  },
  pickupLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  shopName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  pickupAddress: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },
  distanceBadge: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  muteButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  muteButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  acceptButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#16a34a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  acceptButtonWithMute: {
    flex: 2.8,
  },
  acceptButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  acceptButtonIcon: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#64748b",
  },
});

export default AcceptOrder;