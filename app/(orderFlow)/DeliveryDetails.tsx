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
  TextInput,
  Image,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { AnimatedDots } from "../../components/OrderFlowComponents/AnimatedDots";
import {
  HandoverPackageApi,
  EndTrialPhaseApi,
  ConfirmCashCollectionApi,
  UploadReturnPhotosApi,
  GetActiveOrderApi,
} from "../api/orderFlow";
import { emitter } from "../../config/socketConfig";
import { forceStopAlert } from "../../utils/alertManager";

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
  onNext: (route: "earnings" | "returnLocation") => void;
  orderStatus: string;
}) => {
  const [status, setStatus] = useState<DeliveryStatus>("pending");
  const [startTimeMs, setStartTimeMs] = useState<number | null>(null);
  const [waitedMinutes, setWaitedMinutes] = useState(0);
  const [orderData, setOrderData] = useState<any>(null);
  const [handoverOtp, setHandoverOtp] = useState("");
  const [trialOtp, setTrialOtp] = useState("");
  const [isEndingTrial, setIsEndingTrial] = useState(false);
  const [isTrialEnded, setIsTrialEnded] = useState(false);
  const [isCollectingCash, setIsCollectingCash] = useState(false);

  // Photo verification states
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isPhotoVerified, setIsPhotoVerified] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const TRY_DURATION = 600; // 10 min max

  // Base earnings from deliveryCharge + returnCharge + tip
  const dCharge = orderData?.originalDeliveryCharge ?? orderData?.finalBilling?.deliveryCharge ?? orderData?.deliveryCharge ?? 0;
  const rCharge = orderData?.originalReturnCharge ?? orderData?.returnCharge ?? 0;
  const dTip = orderData?.finalBilling?.deliveryTip ?? orderData?.deliveryTip ?? orderData?.tip ?? 0;
  const baseEarnings = (dCharge + rCharge + dTip) || orderData?.deliveryAmount || 0;
  // Calculate total earnings dynamically based on waited time (waiting charge only after 10 min free trial)
  const overtimeMinutes = Math.max(0, waitedMinutes - 10);
  const waitingCharge = overtimeMinutes * 2;
  const deliveryEarnings = baseEarnings + waitingCharge;

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

          // If customer phone is missing from cached order, fetch live active order to obtain real phone
          const existingPhone =
            parsed?.customerPhone ||
            parsed?.deliveryLocation?.phone ||
            parsed?.userId?.phoneNumber;

          if (!existingPhone) {
            GetActiveOrderApi().then((res) => {
              if (res?.success && res.order) {
                const freshOrder = res.order;
                const realPhone =
                  freshOrder?.deliveryLocation?.phone ||
                  freshOrder?.userId?.phoneNumber ||
                  freshOrder?.customerPhone;
                const realName =
                  freshOrder?.deliveryLocation?.name ||
                  freshOrder?.userId?.name ||
                  freshOrder?.customerName;
                if (realPhone) {
                  setOrderData((prev: any) => {
                    const updated = {
                      ...prev,
                      customerPhone: realPhone,
                      customerName: realName || prev?.customerName || "Customer",
                      deliveryLocation: freshOrder.deliveryLocation || prev?.deliveryLocation,
                    };
                    SecureStore.setItemAsync("acceptOrder", JSON.stringify(updated)).catch(() => {});
                    return updated;
                  });
                }
              }
            }).catch(() => {});
          }

          if (parsed.trialPhaseEnd) {
            setIsTrialEnded(true);
          }
          if (parsed.photoVerified) {
            setIsPhotoVerified(true);
          }
          if (parsed.deliveryRiderStatus === "try_phase" || savedStatus === "trying" || savedStatus === "collecting_fee") {
            setStatus("trying");
            if (savedStartTime) {
              setStartTimeMs(Number(savedStartTime));
            } else if (parsed.trialPhaseStart) {
              setStartTimeMs(new Date(parsed.trialPhaseStart).getTime());
            }
          }
        }

        // If status is 'trying', resume timer from stored time
        if (savedStatus === "trying" && savedStartTime) {
          const startTime = Number(savedStartTime);
          setStartTimeMs(startTime);
          setStatus("trying");
        }
      } catch (err) {
        console.error("Error fetching order or state:", err);
      }
    };
    fetchOrderAndState();
  }, []);

  // Listen for orderUpdate, cashCollected, and photoVerified events
  useEffect(() => {
    const handleOrderUpdate = (payload: any) => {
      const riderStatus = payload?.deliveryRiderStatus;
      const oStatus = payload?.orderStatus;

      // Always update orderData with latest selection/billing info
      if (payload) {
        setOrderData((prev: any) => ({ ...prev, ...payload }));
      }

      // Customer kept everything and paid → order completed → go to earnings
      if (riderStatus === "completed" || oStatus === "completed") {
        forceStopAlert();
        SecureStore.deleteItemAsync("status").catch(() => {});
        SecureStore.deleteItemAsync("startTime").catch(() => {});
        onNext("earnings");
        return;
      }

      // If backend explicitly marked trial ended via verified customer OTP
      if (payload?.trialPhaseEnd) {
        setIsTrialEnded(true);
      }
      // If backend explicitly marked photo verified
      if (payload?.photoVerified) {
        setIsPhotoVerified(true);
      }
    };

    const handleCashCollected = (payload: any) => {
      const hasReturns = payload?.hasReturns ?? orderData?.items?.some((i: any) => i.tryStatus === "returned");
      SecureStore.deleteItemAsync("status").catch(() => {});
      SecureStore.deleteItemAsync("startTime").catch(() => {});
      onNext(hasReturns ? "returnLocation" : "earnings");
    };

    const handlePhotoVerified = (payload: any) => {
      setIsPhotoVerified(true);
      if (payload?.order) {
        setOrderData((prev: any) => ({ ...prev, ...payload.order, photoVerified: true }));
      }
    };

    emitter.on("orderUpdate", handleOrderUpdate);
    emitter.on("cashCollected", handleCashCollected);
    emitter.on("photoVerified", handlePhotoVerified);
    return () => {
      emitter.off("orderUpdate", handleOrderUpdate);
      emitter.off("cashCollected", handleCashCollected);
      emitter.off("photoVerified", handlePhotoVerified);
    };
  }, [onNext, orderData]);

  // Timer control
  useEffect(() => {
    if (status !== "trying" || !startTimeMs) return;

    const tick = () => {
      const diffMin = Math.floor((Date.now() - startTimeMs) / 60000);
      setWaitedMinutes(Math.max(0, diffMin));
    };

    tick();
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, [status, startTimeMs]);

  // 🔹 Expanded handleHandover function
  const handleHandover = async () => {
    try {
      if (!orderData?.orderId) {
        Alert.alert("Error", "No order found to hand over.");
        return;
      }

      if (handoverOtp.trim().length !== 4) {
        Alert.alert("Invalid OTP", "Please enter a valid 4-digit OTP.");
        return;
      }

      // Call API
      const response = await HandoverPackageApi({
        orderId: orderData.orderId,
        otp: handoverOtp.trim(),
      });

      if (response) {
        const currentTime = Date.now();
        await SecureStore.setItemAsync("status", "trying");
        await SecureStore.setItemAsync("startTime", currentTime.toString());
        setStatus("trying");
        setStartTimeMs(currentTime);
        setWaitedMinutes(0);
      } else {
        Alert.alert("Error", "Failed to update handover status.");
      }
    } catch (err) {
      console.error("Handover API Error:", err);
      Alert.alert("Error", "Could not start try period. Please retry.");
    }
  };

  // 🔹 Handle End Trial with Customer OTP on the SAME screen
  const handleEndTrial = async () => {
    try {
      const activeOrderId = orderData?.orderId || orderData?._id;
      if (!activeOrderId) {
        Alert.alert("Error", "No active order found.");
        return;
      }

      if (trialOtp.trim().length !== 4) {
        Alert.alert("Invalid OTP", "Please enter the 4-digit OTP provided by the customer.");
        return;
      }

      setIsEndingTrial(true);
      const res = await EndTrialPhaseApi({
        orderId: activeOrderId,
        otp: trialOtp.trim(),
      });

      if (res) {
        setIsTrialEnded(true);
        const updatedOrder = res.order || {
          ...orderData,
          finalBilling: res.finalBilling,
          overtimePenalty: res.overtimePenalty,
        };
        if (updatedOrder) {
          setOrderData(updatedOrder);
        }

        if (updatedOrder.photoVerified) {
          setIsPhotoVerified(true);
        }

        Alert.alert(
          "Trial Ended Successfully",
          `OTP verified! Total wait time: ${res.trialPhaseDurationMinutes ?? waitedMinutes} mins.${res.overtimePenalty > 0 ? `\nOvertime fee: ₹${res.overtimePenalty}` : ''}\n\nPlease capture a verification photo of the items to proceed.`
        );
      }
    } catch (err: any) {
      console.error("End trial error:", err);
      Alert.alert(
        "Verification Failed",
        err?.response?.data?.message || "Could not verify customer OTP. Please check the OTP with the customer and try again."
      );
    } finally {
      setIsEndingTrial(false);
    }
  };

  // 🔹 Photo capture handlers
  const handleStartCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Permission Required", "Camera permission is required to capture verification photo.");
        return;
      }
    }
    setCameraActive(true);
  };

  const handleCapturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        if (photo?.uri) {
          setCapturedImage(photo.uri);
          setCameraActive(false);
        }
      } catch (err) {
        console.error("Capture error:", err);
        Alert.alert("Error", "Failed to capture photo. Please try again.");
      }
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setCapturedImage(result.assets[0].uri);
        setCameraActive(false);
      }
    } catch (e) {
      console.error("Gallery pick error:", e);
    }
  };

  const handleSubmitPhoto = async () => {
    if (!capturedImage) {
      Alert.alert("Photo Required", "Please take or choose a verification photo first.");
      return;
    }

    const activeOrderId = orderData?.orderId || orderData?._id;
    if (!activeOrderId) {
      Alert.alert("Error", "Active order ID not found.");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      await UploadReturnPhotosApi({ orderId: activeOrderId, photoUris: [capturedImage] });
    } catch (err: any) {
      console.warn("Photo upload warning (proceeding):", err?.message);
    } finally {
      setIsUploadingPhoto(false);
      setIsPhotoVerified(true);
      Alert.alert("✓ Photo Verified", "Verification photo recorded. Customer can now settle payment.");
    }
  };

  // 🔹 Handle Cash Collected Confirmation by Rider
  const handleConfirmCashCollection = async () => {
    try {
      const activeOrderId = orderData?.orderId || orderData?._id;
      if (!activeOrderId) {
        Alert.alert("Error", "No active order found.");
        return;
      }

      setIsCollectingCash(true);
      const res = await ConfirmCashCollectionApi({ orderId: activeOrderId });

      await SecureStore.deleteItemAsync("status").catch(() => {});
      await SecureStore.deleteItemAsync("startTime").catch(() => {});

      const updatedOrder = res?.order || orderData;
      const hasReturns = updatedOrder?.items?.some((i: any) => i.tryStatus === "returned");

      Alert.alert(
        "Cash Collected",
        "Payment recorded successfully. Moving to next step.",
        [
          {
            text: "OK",
            onPress: () => {
              onNext(hasReturns ? "returnLocation" : "earnings");
            },
          },
        ]
      );
    } catch (err: any) {
      console.error("Confirm Cash Collection Error:", err);
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Could not confirm cash collection. Please retry."
      );
    } finally {
      setIsCollectingCash(false);
    }
  };

  // Navigation is now handled by the orderUpdate socket listener above.
  // When customer makes selection in their app, the backend emits orderUpdate,
  // and this component auto-navigates to the correct next step.

  const handleMap = () => {
    const lat = orderData?.customerLocation?.lat || FALLBACK_LOCATION.lat;
    const lng = orderData?.customerLocation?.lng || FALLBACK_LOCATION.lng;
    Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`);
  };

  const handleCallCustomer = () => {
    const rawPhone =
      orderData?.customerPhone ||
      orderData?.deliveryLocation?.phone ||
      orderData?.userId?.phoneNumber ||
      orderData?.deliveryLocation?.phoneNumber;

    if (!rawPhone) {
      Alert.alert(
        "Phone Number Unavailable",
        "Customer phone number is not available for this order."
      );
      return;
    }

    const cleaned = String(rawPhone).replace(/[^\d+]/g, "");
    Linking.openURL(`tel:${cleaned}`).catch((err) => {
      console.error("Failed to open phone dialer:", err);
      Alert.alert("Error", "Could not open phone dialer on this device.");
    });
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
  const customerName =
    orderData?.customerName ||
    orderData?.deliveryLocation?.name ||
    orderData?.userId?.name ||
    "Customer";
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
            <View style={[styles.infoCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.infoLabel, { color: '#166534', marginBottom: 0 }]}>Your Order Earnings</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#15803d' }}>₹{baseEarnings}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {dCharge > 0 && (
                  <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 11, color: '#166534', fontWeight: '600' }}>🚴 Delivery: ₹{dCharge}</Text>
                  </View>
                )}
                {rCharge > 0 && (
                  <View style={{ backgroundColor: '#e0e7ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 11, color: '#3730a3', fontWeight: '600' }}>🔄 Return: ₹{rCharge}</Text>
                  </View>
                )}
                {dTip > 0 && (
                  <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 11, color: '#92400e', fontWeight: '600' }}>💝 Tip: ₹{dTip}</Text>
                  </View>
                )}
              </View>
            </View>
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

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Customer Handover OTP</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="Enter 4-digit OTP"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              maxLength={4}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              value={handoverOtp}
              onChangeText={setHandoverOtp}
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
    const progress = Math.min(100, (waitedMinutes / (TRY_DURATION / 60)) * 100);
    const formattedStartTime = startTimeMs ? new Date(startTimeMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...';

    const items = orderData?.items || [];
    const returnedCount = items.filter((i: any) => i.tryStatus === 'returned').length;
    const acceptedCount = items.filter((i: any) => i.tryStatus === 'accepted' || i.tryStatus === 'not-triable').length;
    const hasSelection = items.some((i: any) => i.tryStatus === 'accepted' || i.tryStatus === 'returned' || i.tryStatus === 'not-triable');

    // Customer bought at least 1 item
    const isCustomerBuyingAtLeastOne = acceptedCount > 0 || ((orderData?.finalBilling?.baseAmount ?? 0) > 0);
    // Customer bought nothing (all returned)
    const isCustomerBuyingNothing = (hasSelection && acceptedCount === 0 && returnedCount > 0) || (orderData?.deliveryFeeRecovery?.required && orderData?.deliveryFeeRecovery?.status === 'pending');

    // Direct rider collection amount when buying nothing
    const unpaidDeliveryCharge = (orderData?.originalDeliveryCharge ?? orderData?.deliveryCharge ?? 0);
    const unpaidReturnCharge = (orderData?.originalReturnCharge ?? orderData?.returnCharge ?? 0);
    const unpaidDeliveryTip = (orderData?.finalBilling?.deliveryTip ?? orderData?.deliveryTip ?? orderData?.tip ?? 0);
    const overtimeCharge = (orderData?.finalBilling?.overtimePenalty ?? orderData?.overtimePenalty ?? (waitedMinutes > 10 ? (waitedMinutes - 10) * 2 : 0));
    const calculatedDue = unpaidDeliveryCharge + unpaidReturnCharge + unpaidDeliveryTip + overtimeCharge;
    const directRiderDue = (orderData?.deliveryFeeRecovery?.amount && orderData.deliveryFeeRecovery.amount > 0)
      ? orderData.deliveryFeeRecovery.amount
      : (calculatedDue > 0 ? calculatedDue : 70);

    // Online FlashFits payable when buying >= 1
    const flashfitsOnlinePayable = orderData?.finalBilling?.totalPayable ?? orderData?.totalPayable ?? 0;
    const isPaidOnline = !isCustomerBuyingNothing && (orderData?.paymentStatus === 'paid');
    const hasReturns = items.some((i: any) => i.tryStatus === 'returned') || returnedCount > 0;
    const requiresPhoto = true; // All Try & Buy orders require photo verification before customer can proceed to payment
    
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
            <AnimatedEarningsCircle earnings={deliveryEarnings} />
            <View style={styles.timerIconRow}>
              <Ionicons name="time-outline" size={28} color="#fff" />
              <Text style={styles.timerLabel}>Trial Started At</Text>
            </View>
            <Text style={[styles.timerValue, { fontSize: 22, marginVertical: 4 }]}>{formattedStartTime}</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.timerSubtext}>
              Waited: {waitedMinutes} mins {waitedMinutes <= 10 ? '(10 min free trial)' : ''}
            </Text>
            {waitedMinutes > 10 ? (
              <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: '#fca5a5' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff', textAlign: 'center' }}>
                  ⏳ Waiting Charge: +₹{waitingCharge} ({overtimeMinutes}m overtime @ ₹2/min)
                </Text>
              </View>
            ) : (
              <Text style={[styles.timerSubtext, { opacity: 0.85, fontSize: 11 }]}>
                Waiting Charge: ₹0 (free within 10-min trial)
              </Text>
            )}
            <Text style={[styles.timerSubtext, { fontWeight: '700', marginTop: 4 }]}>
              Your earnings: ₹{deliveryEarnings}
            </Text>
          </View>

          {/* Customer OTP & End Trial on the SAME screen */}
          {!isTrialEnded ? (
            <View style={[styles.infoCard, { marginTop: 16, backgroundColor: '#fff', borderColor: '#fde68a', borderWidth: 1 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="key-outline" size={20} color="#d97706" />
                <Text style={[styles.infoLabel, { color: '#92400e', marginBottom: 0, fontSize: 15 }]}>
                  Stage 1: Customer Trial Completion OTP
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                Ask customer for their 4-digit OTP to conclude trial and calculate final amount.
              </Text>
              <TextInput
                style={styles.otpInput}
                placeholder="Enter 4-digit OTP"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                maxLength={4}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                value={trialOtp}
                onChangeText={setTrialOtp}
              />
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: '#d97706', marginTop: 12 }]}
                onPress={handleEndTrial}
                disabled={isEndingTrial}
                activeOpacity={0.8}
              >
                {isEndingTrial ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                    <Text style={styles.primaryButtonText}>Verify OTP & End Trial</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ marginTop: 16, gap: 14 }}>
              {/* Stage 1 Completed Badge */}
              <View style={[styles.infoCard, { backgroundColor: '#f0fdf4', borderColor: '#86efac', borderWidth: 1 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#15803d' }}>
                    1. OTP Verified — Trial Ended
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>
                  Total wait: {waitedMinutes} mins. {orderData?.overtimePenalty > 0 ? `Overtime fee: ₹${orderData.overtimePenalty}` : 'No overtime fee.'}
                </Text>
              </View>

              {/* Stage 2: Photo Verification */}
              {requiresPhoto && !isPhotoVerified ? (
                <View style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: '#6366f1',
                  shadowColor: '#6366f1',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                  elevation: 4,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="camera" size={22} color="#4f46e5" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#1e293b' }}>
                        Stage 2: Verification Photo
                      </Text>
                      <Text style={{ fontSize: 12, color: '#64748b' }}>
                        Take a photo of clothes/tags with customer
                      </Text>
                    </View>
                  </View>

                  {/* Camera viewfinder / preview box */}
                  <View style={styles.photoContainer}>
                    {capturedImage ? (
                      <View style={styles.imagePreviewWrapper}>
                        <Image source={{ uri: capturedImage }} style={styles.imagePreview} />
                        <View style={styles.previewBadge}>
                          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                          <Text style={styles.previewBadgeText}>Photo Ready</Text>
                        </View>
                      </View>
                    ) : cameraActive && permission?.granted ? (
                      <View style={styles.cameraBox}>
                        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
                        <View style={styles.cameraOverlay}>
                          <View style={styles.scanFrame}>
                            <View style={[styles.corner, styles.cornerTL]} />
                            <View style={[styles.corner, styles.cornerTR]} />
                            <View style={[styles.corner, styles.cornerBL]} />
                            <View style={[styles.corner, styles.cornerBR]} />
                          </View>
                          <Text style={styles.cameraGuideText}>Position items inside frame</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <View style={styles.photoIconCircle}>
                          <Ionicons name="camera" size={34} color="#6366f1" />
                        </View>
                        <Text style={styles.photoPlaceholderTitle}>Capture Verification Photo</Text>
                        <Text style={styles.photoPlaceholderSub}>Ensure items and tags are clearly visible</Text>
                      </View>
                    )}
                  </View>

                  {/* Photo Action Buttons */}
                  <View style={styles.photoControls}>
                    {!capturedImage ? (
                      !cameraActive ? (
                        <View style={styles.btnRow}>
                          <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={handleStartCamera}>
                            <Ionicons name="camera" size={20} color="#fff" />
                            <Text style={styles.actionBtnText}>Open Camera</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.secondaryBtn} onPress={handlePickFromGallery}>
                            <Ionicons name="images-outline" size={20} color="#475569" />
                            <Text style={styles.secondaryBtnText}>Gallery</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.btnRow}>
                          <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} onPress={() => setCameraActive(false)}>
                            <Text style={styles.secondaryBtnText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.actionBtn, { flex: 1.5, backgroundColor: '#10b981' }]} onPress={handleCapturePhoto}>
                            <Ionicons name="camera" size={20} color="#fff" />
                            <Text style={styles.actionBtnText}>Capture</Text>
                          </TouchableOpacity>
                        </View>
                      )
                    ) : (
                      <View style={{ gap: 8 }}>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#10b981' }, isUploadingPhoto && styles.actionBtnDisabled]}
                          onPress={handleSubmitPhoto}
                          disabled={isUploadingPhoto}
                        >
                          {isUploadingPhoto ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <>
                              <Ionicons name="cloud-upload" size={20} color="#fff" />
                              <Text style={styles.actionBtnText}>Confirm & Submit Photo</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.secondaryBtn}
                          onPress={() => {
                            setCapturedImage(null);
                            setCameraActive(true);
                          }}
                          disabled={isUploadingPhoto}
                        >
                          <Ionicons name="refresh" size={18} color="#475569" />
                          <Text style={styles.secondaryBtnText}>Retake Photo</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                <>
                  {/* Stage 2 Completed Badge */}
                  {requiresPhoto && (
                    <View style={[styles.infoCard, { backgroundColor: '#f0fdf4', borderColor: '#86efac', borderWidth: 1 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#15803d' }}>
                          2. Photo Verified & Evidence Recorded
                        </Text>
                      </View>
                      <Text style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>
                        Customer can now complete payment / returns.
                      </Text>
                    </View>
                  )}

                  {/* Stage 3: Payment Resolution */}
                  {isCustomerBuyingNothing ? (
                    /* Customer kept 0 items -> Direct Payment to Rider */
                    <View style={styles.cashCollectionCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="cash" size={26} color="#d97706" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: '#6b7280' }}>
                            Collect Direct Payment from Customer
                          </Text>
                          <Text style={{ fontSize: 32, fontWeight: '900', color: '#d97706' }}>
                            ₹{directRiderDue}
                          </Text>
                        </View>
                      </View>

                      <View style={{ backgroundColor: '#fffbeb', padding: 12, borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: '#fde68a' }}>
                        <Text style={{ fontSize: 12, color: '#92400e', fontWeight: '700', marginBottom: 6 }}>
                          Customer returned all items. Collect directly via Cash or personal UPI:
                        </Text>
                        <View style={{ gap: 4, borderTopWidth: 1, borderTopColor: '#fef3c7', paddingTop: 6 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 11, color: '#78350f' }}>Delivery & Return Fee:</Text>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#78350f' }}>₹{unpaidDeliveryCharge + unpaidReturnCharge}</Text>
                          </View>
                          {unpaidDeliveryTip > 0 && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: 11, color: '#78350f' }}>Rider Tip:</Text>
                              <Text style={{ fontSize: 11, fontWeight: '600', color: '#78350f' }}>₹{unpaidDeliveryTip}</Text>
                            </View>
                          )}
                          {overtimeCharge > 0 && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: 11, color: '#dc2626' }}>Waiting / Overtime Fee:</Text>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#dc2626' }}>+₹{overtimeCharge}</Text>
                            </View>
                          )}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#fde68a', paddingTop: 4, marginTop: 2 }}>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: '#78350f' }}>Total Due to Rider:</Text>
                            <Text style={{ fontSize: 14, fontWeight: '900', color: '#92400e' }}>₹{directRiderDue}</Text>
                          </View>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.primaryButton,
                          {
                            backgroundColor: '#10b981',
                            paddingVertical: 14,
                            borderRadius: 12,
                          }
                        ]}
                        onPress={handleConfirmCashCollection}
                        disabled={isCollectingCash}
                        activeOpacity={0.8}
                      >
                        {isCollectingCash ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-done-circle" size={24} color="#fff" />
                            <Text style={[styles.primaryButtonText, { fontSize: 16, fontWeight: '800' }]}>
                              Cash / UPI Collected (₹{directRiderDue})
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : isPaidOnline ? (
                    <View style={styles.paymentSuccessCard}>
                      <Ionicons name="checkmark-circle" size={44} color="#10b981" />
                      <Text style={styles.paymentSuccessTitle}>Payment Received Online</Text>
                      <Text style={styles.paymentSuccessSub}>
                        Customer paid ₹{flashfitsOnlinePayable} online to FlashFits.
                      </Text>
                      <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: '#10b981', marginTop: 14, width: '100%' }]}
                        onPress={() => onNext(hasReturns ? "returnLocation" : "earnings")}
                      >
                        <Ionicons name="arrow-forward-circle" size={22} color="#fff" />
                        <Text style={styles.primaryButtonText}>
                          {hasReturns ? "Proceed to Return to Shop" : "Complete & View Earnings"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : isCustomerBuyingAtLeastOne ? (
                    /* Customer buying at least 1 item -> Pays FlashFits online */
                    <View style={styles.onlinePaymentCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="phone-portrait" size={24} color="#6366f1" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: '#6b7280' }}>
                            Awaiting Customer Online Payment
                          </Text>
                          <Text style={{ fontSize: 28, fontWeight: '900', color: '#4f46e5' }}>
                            ₹{flashfitsOnlinePayable}
                          </Text>
                        </View>
                      </View>

                      <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, marginBottom: 14 }}>
                        <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600', marginBottom: 6 }}>
                          Customer is paying FlashFits online via app:
                        </Text>
                        <View style={{ gap: 4, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 6 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 11, color: '#64748b' }}>Kept Items ({acceptedCount}):</Text>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#1e293b' }}>₹{orderData?.finalBilling?.baseAmount ?? 0}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 11, color: '#64748b' }}>Delivery Fee:</Text>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#1e293b' }}>₹{orderData?.finalBilling?.deliveryCharge ?? unpaidDeliveryCharge}</Text>
                          </View>
                          {unpaidDeliveryTip > 0 && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: 11, color: '#64748b' }}>Delivery Tip:</Text>
                              <Text style={{ fontSize: 11, fontWeight: '600', color: '#1e293b' }}>₹{unpaidDeliveryTip}</Text>
                            </View>
                          )}
                          {overtimeCharge > 0 && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: 11, color: '#ef4444' }}>Waiting Fee:</Text>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#ef4444' }}>+₹{overtimeCharge}</Text>
                            </View>
                          )}
                          {orderData?.finalBilling?.discount > 0 && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: 11, color: '#10b981' }}>Discount:</Text>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#10b981' }}>-₹{orderData.finalBilling.discount}</Text>
                            </View>
                          )}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 4, marginTop: 2 }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a' }}>Total Online Payable:</Text>
                            <Text style={{ fontSize: 13, fontWeight: '900', color: '#4f46e5' }}>₹{flashfitsOnlinePayable}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 }}>
                        <ActivityIndicator size="small" color="#6366f1" />
                        <Text style={{ fontSize: 13, color: '#6366f1', fontWeight: '600' }}>
                          Waiting for customer payment confirmation...
                        </Text>
                      </View>
                    </View>
                  ) : (
                    /* Customer hasn't finalized selection yet */
                    <View style={[styles.infoCard, { backgroundColor: '#f8fafc', borderColor: '#cbd5e1', borderWidth: 1, alignItems: 'center', paddingVertical: 18 }]}>
                      <ActivityIndicator size="small" color="#6366f1" style={{ marginBottom: 8 }} />
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#1e293b', textAlign: 'center' }}>
                        Awaiting Customer Item Selection
                      </Text>
                      <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4, paddingHorizontal: 12 }}>
                        Customer is reviewing items and selecting what to keep or return.
                      </Text>
                      <Text style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
                        • If buying ≥1: Pays FlashFits online (including delivery fee & tip)
                      </Text>
                      <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                        • If buying 0: Pays you delivery & waiting fees directly
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* Quick Actions (Call Customer & Open Map) */}
          <View style={[styles.actionButtonsContainer, { marginTop: 16 }]}>
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

          {/* Waiting indicator only before trial is ended */}
          {!isTrialEnded && (
            <View style={[styles.buttonGreenLarge, { marginTop: 16, opacity: 0.95 }]}>
              <View style={styles.waitingButtonContent}>
                <Text style={styles.waitingButtonText}>
                  Waiting for customer to try items
                </Text>
                <AnimatedDots />
              </View>
            </View>
          )}
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
  otpInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 4,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginTop: 8,
  },
  // Photo capture stage styles
  photoContainer: {
    width: "100%",
    height: 220,
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 12,
  },
  imagePreviewWrapper: { width: "100%", height: "100%", position: "relative" },
  imagePreview: { width: "100%", height: "100%", resizeMode: "cover" },
  previewBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  previewBadgeText: { fontSize: 11, fontWeight: "700", color: "#10b981" },
  cameraBox: { flex: 1, position: "relative" },
  camera: { flex: 1 },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 170,
    height: 170,
    position: "relative",
    marginBottom: 8,
  },
  corner: { position: "absolute", width: 24, height: 24, borderColor: "#10b981" },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  cameraGuideText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  photoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  photoIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  photoPlaceholderTitle: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  photoPlaceholderSub: { fontSize: 12, color: "#64748b", marginTop: 4, textAlign: "center" },
  photoControls: { marginTop: 4, marginBottom: 8 },
  btnRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    backgroundColor: "#4f46e5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondaryBtn: {
    backgroundColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  secondaryBtnText: { color: "#475569", fontSize: 14, fontWeight: "700" },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  successBannerText: { color: "#15803d", fontSize: 14, fontWeight: "700" },
  cashCollectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#d97706",
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  onlinePaymentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  paymentSuccessCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#10b981",
  },
  paymentSuccessTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#15803d",
    marginTop: 8,
  },
  paymentSuccessSub: {
    fontSize: 13,
    color: "#166534",
    textAlign: "center",
    marginTop: 4,
  },
});

export default DeliveryDetails;
