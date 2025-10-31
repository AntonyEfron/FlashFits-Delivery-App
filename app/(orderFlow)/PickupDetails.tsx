import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { VerifyPickupOtpApi } from "../api/orderFlow";

const PickupDetails: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [itemsExpanded, setItemsExpanded] = useState(true);
  const [notesExpanded, setNotesExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const storedOrder = await SecureStore.getItemAsync("acceptOrder");
        if (storedOrder) {
          const parsedOrder = JSON.parse(storedOrder);
          console.log("Fetched order from SecureStore:", parsedOrder);
          setOrder(parsedOrder);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, []);

  const handleVerifyOtp = async () => {
    if (code.length !== 4) {
      Alert.alert("Invalid", "Please enter a 4-digit code");
      return;
    }
    try {
      setIsVerifying(true);
      const res = await VerifyPickupOtpApi({
        orderId: order?.orderId,
        otp: code,
      });
      if (res) {
        await SecureStore.setItemAsync("orderStep", JSON.stringify("3"));
        onNext();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to verify code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={{ marginTop: 10 }}>Loading order...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, color: "#6b7280" }}>No order found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {order.status || "READY FOR PICKUP"}
            </Text>
          </View>
          <Text style={styles.orderNumber}>
            {order.orderNumber
              ? order.orderNumber.toUpperCase()
              : `ORD-${String(order.orderId).slice(-4).toUpperCase()}`}
          </Text>
        </View>

        {/* Pickup Location */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Pickup Location</Text>
          <Text style={styles.storeName}>{order.shopName}</Text>
          <Text style={styles.address}>{order.pickupAddress}</Text>
        </View>

        {/* OTP */}
        <View style={styles.verificationCard}>
          <Text style={styles.verificationTitle}>🔐 Pickup Verification</Text>
          <Text style={styles.verificationSubtext}>
            Enter the 4-digit pickup code provided by the store
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 4-digit code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            (code.length !== 4 || isVerifying) && styles.buttonDisabled,
          ]}
          onPress={handleVerifyOtp}
          disabled={code.length !== 4 || isVerifying}
        >
          <Text style={styles.buttonText}>
            {isVerifying ? "Verifying..." : "✓ Verify & Confirm Pickup"}
          </Text>
        </TouchableOpacity>

        {/* Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦 Order Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {order.items?.length || 0}
              </Text>
              <Text style={styles.summaryLabel}>Total Items</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{order.distance || "—"}</Text>
              <Text style={styles.summaryLabel}>Est. Distance</Text>
            </View>
          </View>
        </View>

        {/* Items */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => setItemsExpanded(!itemsExpanded)}
        >
          <View style={styles.expandHeader}>
            <Text style={styles.cardTitle}>📋 Items to Pickup</Text>
            <Text style={styles.expandIcon}>{itemsExpanded ? "▼" : "▶"}</Text>
          </View>

          {itemsExpanded && order.items && (
            <View style={styles.expandedContent}>
              {order.items.map((item: any, index: number) => (
                <View
                  key={item.id || index}
                  style={[
                    styles.itemRow,
                    index !== order.items.length - 1 && styles.itemBorder,
                  ]}
                >
                  <View style={styles.itemQuantity}>
                    <Text style={styles.quantityText}>{item.quantity}x</Text>
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.sku && (
                      <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                    )}
                    {item.notes && (
                      <Text style={styles.itemNotes}>Note: {item.notes}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        {/* Notes */}
        {order.specialInstructions && (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setNotesExpanded(!notesExpanded)}
          >
            <View style={styles.expandHeader}>
              <Text style={styles.cardTitle}>⚠️ Special Instructions</Text>
              <Text style={styles.expandIcon}>{notesExpanded ? "▼" : "▶"}</Text>
            </View>

            {notesExpanded && (
              <View style={styles.expandedContent}>
                <Text style={styles.instructionsText}>
                  {order.specialInstructions}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // same as yours ...
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
    alignItems: "center",
  },
  statusBadge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  orderNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1f2937",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 12,
  },
  storeName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: "#6b7280",
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: { alignItems: "center" },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f59e0b",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  verificationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  verificationSubtext: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 16,
    fontSize: 20,
    textAlign: "center",
    letterSpacing: 4,
    backgroundColor: "#f9fafb",
  },
  button: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#f59e0b",
  },
  buttonDisabled: {
    backgroundColor: "#d1d5db",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  expandHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expandIcon: {
    fontSize: 16,
    color: "#9ca3af",
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  itemRow: {
    flexDirection: "row",
    paddingVertical: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  itemQuantity: {
    backgroundColor: "#f59e0b",
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  quantityText: {
    color: "#fff",
    fontWeight: "700",
  },
  itemDetails: { flex: 1 },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  itemSku: {
    fontSize: 12,
    color: "#9ca3af",
  },
  itemNotes: {
    fontSize: 12,
    color: "#6b7280",
  },
  instructionsText: {
    fontSize: 14,
    color: "#dc2626",
    lineHeight: 20,
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 8,
  },
});

export default PickupDetails;
