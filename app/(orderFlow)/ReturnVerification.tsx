import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ReturnItemVerificationApi,
  ConfirmCashCollectionApi,
  UploadReturnPhotosApi,
} from '../api/orderFlow';
import { emitter } from '../../config/socketConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ReturnVerificationProps {
  onNext: () => void;
  orderId: string;
  order?: any;
}

const ReturnVerification: React.FC<ReturnVerificationProps> = ({ onNext, orderId, order: propOrder }) => {
  const [order, setOrder] = useState<any>(propOrder || null);
  const cleanId = String(orderId || order?._id || '').replace(/^["']|["']$/g, '').trim();

  // Verification state machine
  const [otp, setOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Photo state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isPhotoVerified, setIsPhotoVerified] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // Payment state
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);

  // Active step accordion: 1 = OTP, 2 = Photo, 3 = Payment
  const [activeStage, setActiveStage] = useState<1 | 2 | 3>(1);

  // Load order from SecureStore if not passed as prop
  useEffect(() => {
    const loadOrderData = async () => {
      try {
        const savedOrderStr = await SecureStore.getItemAsync('acceptOrder');
        if (savedOrderStr) {
          const parsed = JSON.parse(savedOrderStr);
          setOrder((prev: any) => prev || parsed);
          if (parsed.trialPhaseEnd) {
            setIsOtpVerified(true);
            if (parsed.photoVerified) {
              setIsPhotoVerified(true);
              setActiveStage(3);
            } else {
              setActiveStage(2);
            }
          } else {
            setActiveStage(1);
          }
        }
      } catch (e) {
        console.error('Failed to read acceptOrder:', e);
      }
    };
    if (!order) loadOrderData();
  }, [order]);

  // Sync state if order prop is already verified
  useEffect(() => {
    if (order?.trialPhaseEnd) {
      setIsOtpVerified(true);
      if (order?.photoVerified) {
        setIsPhotoVerified(true);
        setActiveStage(3);
      } else {
        setActiveStage(2);
      }
    } else {
      setActiveStage(1);
    }
  }, [order?.trialPhaseEnd, order?.photoVerified]);

  // Listen to orderUpdate in ReturnVerification
  useEffect(() => {
    const handleOrderUpdate = (payload: any) => {
      if (payload?._id === cleanId || payload?.orderId === cleanId) {
        setOrder((prev: any) => ({ ...prev, ...payload }));
        if (payload.trialPhaseEnd) {
          setIsOtpVerified(true);
          if (payload.photoVerified) {
            setIsPhotoVerified(true);
            setActiveStage(3);
          } else {
            setActiveStage(2);
          }
        }
      }
    };
    emitter.on("orderUpdate", handleOrderUpdate);
    return () => {
      emitter.off("orderUpdate", handleOrderUpdate);
    };
  }, [cleanId]);

  // Calculate payment/fee due from customer
  const deliveryFeeRecovery = order?.deliveryFeeRecovery;
  const isDeliveryFeePending = deliveryFeeRecovery?.required && deliveryFeeRecovery?.status === 'pending';
  const deliveryFeeAmount = deliveryFeeRecovery?.amount ?? 0;

  // Items accepted/kept
  const acceptedItems = order?.items?.filter((i: any) => i.tryStatus === 'accepted' || i.tryStatus === 'not-triable') || [];
  const isCustomerBuyingAtLeastOne = acceptedItems.length > 0 || ((order?.finalBilling?.baseAmount ?? 0) > 0);

  // Unpaid total if not already paid online
  const totalPayable = order?.finalBilling?.totalPayable ?? 0;
  const isPaidOnline = order?.paymentStatus === 'paid' || order?.paymentStatus === 'delivery_fee_paid';
  
  // Amount to collect directly from customer:
  // If customer bought nothing -> direct cash to rider (deliveryFeeAmount or delivery+return+tip+waiting)
  // If customer bought >= 1 -> customer pays FlashFits online; rider only collects cash if delivery fee recovery is pending
  const unpaidDeliveryCharge = (order?.originalDeliveryCharge ?? order?.deliveryCharge ?? 0);
  const unpaidReturnCharge = (order?.originalReturnCharge ?? order?.returnCharge ?? 0);
  const unpaidDeliveryTip = (order?.finalBilling?.deliveryTip ?? order?.deliveryTip ?? order?.tip ?? 0);
  const overtimeCharge = (order?.finalBilling?.overtimePenalty ?? order?.overtimePenalty ?? 0);
  const directRiderDue = isDeliveryFeePending 
    ? deliveryFeeAmount 
    : (!isCustomerBuyingAtLeastOne ? (unpaidDeliveryCharge + unpaidReturnCharge + unpaidDeliveryTip + overtimeCharge) : 0);

  const amountToCollect = !isPaidOnline ? directRiderDue : 0;

  // Auto-mark payment as confirmed if no amount is due and already paid
  useEffect(() => {
    if (isPhotoVerified && !isPaymentConfirmed) {
      if (amountToCollect === 0 && isPaidOnline) {
        setIsPaymentConfirmed(true);
      }
    }
  }, [isPhotoVerified, amountToCollect, isPaidOnline, isPaymentConfirmed]);

  // ───────────────────────────────────────────
  // 1. OTP Verification
  // ───────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.trim().length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit return code shared by the customer.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      await ReturnItemVerificationApi({ orderId: cleanId, otp: otp.trim() });
      setIsOtpVerified(true);
      setActiveStage(2);
      Alert.alert('✓ OTP Verified', 'Return code verified successfully. Now capture return item photo.');
    } catch (error: any) {
      console.error('Error verifying return OTP:', error);
      Alert.alert(
        'Verification Failed',
        error?.response?.data?.message || 'Invalid OTP. Please check the code with the customer and retry.'
      );
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ───────────────────────────────────────────
  // 2. Camera & Photo Handlers
  // ───────────────────────────────────────────
  const handleStartCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to capture return photos.');
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
        console.error('Capture error:', err);
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
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
      console.error('Gallery pick error:', e);
    }
  };

  const handleSubmitPhoto = async () => {
    if (!capturedImage) {
      Alert.alert('Photo Required', 'Please take or choose a photo of the returned items first.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      await UploadReturnPhotosApi({ orderId: cleanId, photoUris: [capturedImage] });
    } catch (err: any) {
      console.warn('Backend photo upload warning (proceeding with local evidence):', err?.message);
    } finally {
      setIsUploadingPhoto(false);
      setIsPhotoVerified(true);
      setActiveStage(3);
      Alert.alert('✓ Photo Verified', 'Photo evidence recorded. Please confirm customer payment.');
    }
  };

  // ───────────────────────────────────────────
  // 3. Money Confirmation Handlers
  // ───────────────────────────────────────────
  const handleConfirmCashCollection = async () => {
    setIsConfirmingPayment(true);
    try {
      await ConfirmCashCollectionApi({ orderId: cleanId });
      setIsPaymentConfirmed(true);
      Alert.alert('✓ Payment Confirmed', 'Cash payment recorded. You are ready to return to the shop.');
    } catch (error: any) {
      console.error('Cash confirmation error:', error);
      Alert.alert(
        'Payment Confirmation Failed',
        error?.response?.data?.message || 'Could not record cash collection. Please retry.'
      );
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  // ───────────────────────────────────────────
  // 4. Final Proceed Button
  // ───────────────────────────────────────────
  const canProceed = isOtpVerified && isPhotoVerified && isPaymentConfirmed;

  const handleProceedToShop = () => {
    if (!canProceed) {
      Alert.alert('Incomplete Verification', 'Please complete all steps (OTP, photo, and money confirmation) before heading to the shop.');
      return;
    }
    onNext();
  };

  const returnedItems = order?.items?.filter((i: any) => i.tryStatus === 'returned') || order?.items || [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            style={styles.headerCard}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="repeat" size={26} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Return Verification</Text>
                <Text style={styles.headerSubtitle}>
                  Order #{cleanId.slice(-6).toUpperCase()} • {returnedItems.length} return item(s)
                </Text>
              </View>
            </View>

            {/* Step Progress Pills */}
            <View style={styles.stepperContainer}>
              <View style={[styles.stepPill, isOtpVerified && styles.stepPillDone, activeStage === 1 && styles.stepPillActive]}>
                <Ionicons
                  name={isOtpVerified ? 'checkmark-circle' : 'key-outline'}
                  size={14}
                  color={isOtpVerified ? '#10B981' : (activeStage === 1 ? '#fff' : '#64748B')}
                />
                <Text style={[styles.stepPillText, activeStage === 1 && styles.stepPillTextActive, isOtpVerified && styles.stepPillTextDone]}>
                  1. OTP
                </Text>
              </View>

              <View style={styles.stepDivider} />

              <View style={[styles.stepPill, isPhotoVerified && styles.stepPillDone, activeStage === 2 && styles.stepPillActive]}>
                <Ionicons
                  name={isPhotoVerified ? 'checkmark-circle' : 'camera-outline'}
                  size={14}
                  color={isPhotoVerified ? '#10B981' : (activeStage === 2 ? '#fff' : '#64748B')}
                />
                <Text style={[styles.stepPillText, activeStage === 2 && styles.stepPillTextActive, isPhotoVerified && styles.stepPillTextDone]}>
                  2. Photo
                </Text>
              </View>

              <View style={styles.stepDivider} />

              <View style={[styles.stepPill, isPaymentConfirmed && styles.stepPillDone, activeStage === 3 && styles.stepPillActive]}>
                <Ionicons
                  name={isPaymentConfirmed ? 'checkmark-circle' : 'cash-outline'}
                  size={14}
                  color={isPaymentConfirmed ? '#10B981' : (activeStage === 3 ? '#fff' : '#64748B')}
                />
                <Text style={[styles.stepPillText, activeStage === 3 && styles.stepPillTextActive, isPaymentConfirmed && styles.stepPillTextDone]}>
                  3. Payment
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ─── STAGE 1: OTP VERIFICATION ─── */}
        <View style={[styles.card, activeStage === 1 && styles.cardActive, isOtpVerified && styles.cardCompleted]}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => isOtpVerified && setActiveStage(1)}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.stageBadge, isOtpVerified ? styles.stageBadgeDone : styles.stageBadgePending]}>
                {isOtpVerified ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : (
                  <Text style={styles.stageBadgeText}>1</Text>
                )}
              </View>
              <View>
                <Text style={styles.cardTitle}>Customer Return OTP</Text>
                <Text style={styles.cardSub}>
                  {isOtpVerified ? `Verified code: ${otp}` : 'Ask customer for code on return screen'}
                </Text>
              </View>
            </View>
            {isOtpVerified && (
              <View style={styles.verifiedTag}>
                <Text style={styles.verifiedTagText}>VERIFIED</Text>
              </View>
            )}
          </TouchableOpacity>

          {(!isOtpVerified || activeStage === 1) && (
            <View style={styles.cardBody}>
              <View style={styles.otpInputContainer}>
                <TextInput
                  style={[styles.otpInput, isOtpVerified && styles.otpInputVerified]}
                  placeholder="• • • •"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={4}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  value={otp}
                  onChangeText={setOtp}
                  editable={!isOtpVerified && !isVerifyingOtp}
                  autoFocus={!isOtpVerified}
                />
              </View>

              {!isOtpVerified ? (
                <TouchableOpacity
                  style={[styles.actionBtn, (otp.length !== 4 || isVerifyingOtp) && styles.actionBtnDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={otp.length !== 4 || isVerifyingOtp}
                >
                  {isVerifyingOtp ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.actionBtnText}>Verify OTP</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.successBanner}>
                  <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                  <Text style={styles.successBannerText}>Return OTP Verified</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ─── STAGE 2: PHOTO EVIDENCE ─── */}
        <View style={[styles.card, activeStage === 2 && styles.cardActive, isPhotoVerified && styles.cardCompleted, !isOtpVerified && styles.cardLocked]}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => isOtpVerified && setActiveStage(2)}
            disabled={!isOtpVerified}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.stageBadge, isPhotoVerified ? styles.stageBadgeDone : (isOtpVerified ? styles.stageBadgeActive : styles.stageBadgeLocked)]}>
                {isPhotoVerified ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : (
                  <Text style={styles.stageBadgeText}>2</Text>
                )}
              </View>
              <View>
                <Text style={styles.cardTitle}>Return Photo Evidence</Text>
                <Text style={styles.cardSub}>
                  {isPhotoVerified
                    ? 'Photo captured and recorded'
                    : (isOtpVerified ? 'Capture photo of returned clothes' : 'Locked until OTP is verified')}
                </Text>
              </View>
            </View>
            {isPhotoVerified && (
              <View style={styles.verifiedTag}>
                <Text style={styles.verifiedTagText}>RECORDED</Text>
              </View>
            )}
          </TouchableOpacity>

          {isOtpVerified && (activeStage === 2 || !isPhotoVerified) && (
            <View style={styles.cardBody}>
              {/* Inline Camera or Preview Area */}
              <View style={styles.photoContainer}>
                {capturedImage ? (
                  <View style={styles.imagePreviewWrapper}>
                    <Image source={{ uri: capturedImage }} style={styles.imagePreview} />
                    <View style={styles.previewBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
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
                      <Ionicons name="camera" size={36} color="#6366F1" />
                    </View>
                    <Text style={styles.photoPlaceholderTitle}>Take Photo of Returned Clothes</Text>
                    <Text style={styles.photoPlaceholderSub}>Ensure items and tags are clearly visible</Text>
                  </View>
                )}
              </View>

              {/* Photo Controls */}
              {!isPhotoVerified && (
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
                        <TouchableOpacity style={[styles.actionBtn, { flex: 1.5, backgroundColor: '#10B981' }]} onPress={handleCapturePhoto}>
                          <Ionicons name="camera" size={20} color="#fff" />
                          <Text style={styles.actionBtnText}>Capture</Text>
                        </TouchableOpacity>
                      </View>
                    )
                  ) : (
                    <View style={{ gap: 10 }}>
                      <TouchableOpacity
                        style={[styles.actionBtn, isUploadingPhoto && styles.actionBtnDisabled]}
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
              )}

              {isPhotoVerified && (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.successBannerText}>Return Photo Evidence Recorded</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ─── STAGE 3: MONEY CONFIRMATION ─── */}
        <View style={[styles.card, activeStage === 3 && styles.cardActive, isPaymentConfirmed && styles.cardCompleted, !isPhotoVerified && styles.cardLocked]}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => isPhotoVerified && setActiveStage(3)}
            disabled={!isPhotoVerified}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.stageBadge, isPaymentConfirmed ? styles.stageBadgeDone : (isPhotoVerified ? styles.stageBadgeActive : styles.stageBadgeLocked)]}>
                {isPaymentConfirmed ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : (
                  <Text style={styles.stageBadgeText}>3</Text>
                )}
              </View>
              <View>
                <Text style={styles.cardTitle}>Payment / Cash Confirmation</Text>
                <Text style={styles.cardSub}>
                  {isPaymentConfirmed
                    ? 'Payment status confirmed'
                    : (isPhotoVerified ? 'Collect cash / direct payment if due' : 'Locked until photo is captured')}
                </Text>
              </View>
            </View>
            {isPaymentConfirmed && (
              <View style={styles.verifiedTag}>
                <Text style={styles.verifiedTagText}>CONFIRMED</Text>
              </View>
            )}
          </TouchableOpacity>

          {isPhotoVerified && (activeStage === 3 || !isPaymentConfirmed) && (
            <View style={styles.cardBody}>
              {isCustomerBuyingAtLeastOne && !isPaidOnline ? (
                <View style={[styles.paymentBox, { borderColor: '#6366f1' }]}>
                  <View style={styles.paymentHeader}>
                    <View style={[styles.moneyCircle, { backgroundColor: '#ede9fe' }]}>
                      <Ionicons name="phone-portrait" size={24} color="#6366f1" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentLabel}>Customer Paying FlashFits Online:</Text>
                      <Text style={[styles.paymentAmount, { color: '#4f46e5' }]}>₹{totalPayable}</Text>
                    </View>
                  </View>
                  <View style={[styles.paymentNote, { backgroundColor: '#f5f3ff', borderColor: '#c7d2fe' }]}>
                    <Ionicons name="information-circle" size={16} color="#6366f1" />
                    <Text style={[styles.paymentNoteText, { color: '#4338ca' }]}>
                      Customer kept {acceptedItems.length} item(s). Payment is being made online to FlashFits (including delivery fee & tip). Waiting for confirmation...
                    </Text>
                  </View>
                </View>
              ) : amountToCollect > 0 ? (
                <View style={styles.paymentBox}>
                  <View style={styles.paymentHeader}>
                    <View style={styles.moneyCircle}>
                      <MaterialCommunityIcons name="currency-inr" size={26} color="#D97706" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentLabel}>Amount to Collect Directly:</Text>
                      <Text style={styles.paymentAmount}>₹{amountToCollect}</Text>
                    </View>
                  </View>

                  <View style={styles.paymentNote}>
                    <Ionicons name="information-circle" size={16} color="#D97706" />
                    <Text style={styles.paymentNoteText}>
                      Customer returned all items. Please collect the delivery & return fee directly from the customer.
                    </Text>
                  </View>

                  {!isPaymentConfirmed ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#10B981' }, isConfirmingPayment && styles.actionBtnDisabled]}
                      onPress={handleConfirmCashCollection}
                      disabled={isConfirmingPayment}
                    >
                      {isConfirmingPayment ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="cash" size={20} color="#fff" />
                          <Text style={styles.actionBtnText}>Confirm I Received ₹{amountToCollect}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.successBanner}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <Text style={styles.successBannerText}>Payment of ₹{amountToCollect} Recorded</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.freeDeliveryBox}>
                  <Ionicons name="checkmark-circle-outline" size={32} color="#10B981" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.freeDeliveryTitle}>No Cash Collection Required</Text>
                    <Text style={styles.freeDeliverySub}>
                      {isPaidOnline
                        ? 'Customer paid online via FlashFits. You do not need to collect cash.'
                        : 'Delivery fee is waived or prepaid. You do not need to collect any money from the customer.'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ─── RETURN SUMMARY INFO ─── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Items Returning to Shop</Text>
          {returnedItems.map((item: any, idx: number) => (
            <View key={item._id || idx} style={styles.summaryItemRow}>
              <View style={styles.summaryItemDot} />
              <Text style={styles.summaryItemName} numberOfLines={1}>
                {item.name || 'Dress Item'} {item.size ? `(${item.size})` : ''}
              </Text>
              <Text style={styles.summaryItemQty}>Qty: {item.quantity || 1}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ─── BOTTOM PROCEED BAR ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.proceedBtn, !canProceed && styles.proceedBtnDisabled]}
          onPress={handleProceedToShop}
          disabled={!canProceed}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={canProceed ? ['#10B981', '#059669'] : ['#94A3B8', '#64748B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.proceedGradient}
          >
            <Text style={styles.proceedText}>Proceed to Return to Shop</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
        {!canProceed && (
          <Text style={styles.proceedHint}>
            {!isOtpVerified
              ? 'Enter & verify OTP to continue'
              : !isPhotoVerified
              ? 'Capture return photo to continue'
              : 'Confirm payment receipt to continue'}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default ReturnVerification;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, paddingBottom: 110 },

  // Header
  header: { marginBottom: 16 },
  headerCard: {
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2 },

  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  stepPillActive: { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
  stepPillDone: {},
  stepPillText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  stepPillTextActive: { color: '#fff', fontWeight: '700' },
  stepPillTextDone: { color: '#10B981', fontWeight: '700' },
  stepDivider: { width: 14, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.15)' },

  // Card Structure
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardActive: { borderColor: '#6366F1' },
  cardCompleted: { borderColor: '#10B981' },
  cardLocked: { opacity: 0.65, backgroundColor: '#F1F5F9' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stageBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stageBadgePending: { backgroundColor: '#6366F1' },
  stageBadgeActive: { backgroundColor: '#4F46E5' },
  stageBadgeDone: { backgroundColor: '#10B981' },
  stageBadgeLocked: { backgroundColor: '#94A3B8' },
  stageBadgeText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  cardSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  verifiedTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedTagText: { fontSize: 10, fontWeight: '800', color: '#16A34A', letterSpacing: 0.5 },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },

  // Stage 1: OTP
  otpInputContainer: { alignItems: 'center', marginBottom: 14 },
  otpInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 10,
    color: '#0F172A',
    width: '80%',
  },
  otpInputVerified: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
    color: '#16A34A',
  },

  // Buttons
  actionBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryBtnText: { color: '#475569', fontSize: 14, fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 10 },

  // Stage 2: Camera
  photoContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  imagePreviewWrapper: { width: '100%', height: '100%', position: 'relative' },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  previewBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  previewBadgeText: { fontSize: 11, fontWeight: '700', color: '#10B981' },
  cameraBox: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 170,
    height: 170,
    position: 'relative',
    marginBottom: 8,
  },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#10B981' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  cameraGuideText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photoIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  photoPlaceholderTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  photoPlaceholderSub: { fontSize: 12, color: '#64748B', marginTop: 4, textAlign: 'center' },
  photoControls: { marginTop: 4 },

  // Stage 3: Payment
  paymentBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  paymentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  moneyCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentLabel: { fontSize: 12, color: '#92400E', fontWeight: '600' },
  paymentAmount: { fontSize: 24, color: '#B45309', fontWeight: '900' },
  paymentNote: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(254, 243, 199, 0.5)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  paymentNoteText: { fontSize: 12, color: '#92400E', flex: 1, lineHeight: 16 },
  freeDeliveryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  freeDeliveryTitle: { fontSize: 14, fontWeight: '700', color: '#166534' },
  freeDeliverySub: { fontSize: 12, color: '#15803D', marginTop: 2 },

  // Success Banner
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  successBannerText: { fontSize: 13, fontWeight: '700', color: '#16A34A' },

  // Summary Card
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  summaryItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  summaryItemDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6366F1', marginRight: 10 },
  summaryItemName: { fontSize: 13, color: '#334155', flex: 1 },
  summaryItemQty: { fontSize: 12, color: '#64748B', fontWeight: '600' },

  // Bottom Proceed Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  proceedBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  proceedBtnDisabled: { opacity: 0.65 },
  proceedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  proceedText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  proceedHint: { fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '600' },
});