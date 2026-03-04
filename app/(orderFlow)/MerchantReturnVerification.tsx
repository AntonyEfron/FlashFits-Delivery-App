import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReachedReturnMerchantApi, ReturnVerificationApi } from '../api/orderFlow';
import * as Location from 'expo-location';
import { joinOrderRoom, listenOrderUpdates, removeOrderListeners } from '@/app/sockets/order.socket';

/**
 * MerchantReturnVerification
 *
 * This screen handles the return journey:
 * 1. Rider navigates back to merchant (calls reachedReturnMerchant API)
 * 2. Merchant inspects items
 * 3. Rider enters merchant-provided return OTP to confirm handover
 */
export default function MerchantReturnVerification({ onNext, order }) {
  const [step, setStep] = useState('confirm_arrival'); // confirm_arrival | enter_otp | verifying | done
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const returnedItems = order?.items?.filter(i => i.tryStatus === 'returned') ?? [];
  const returnedCount = returnedItems.length;
  const orderId = order?._id;

  // Step 1: Call backend to mark rider as arrived at merchant for return
  const handleConfirmArrival = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let latitude = null;
      let longitude = null;

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
      }

      await ReachedReturnMerchantApi({ orderId, latitude, longitude });
      setStep('enter_otp');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to confirm arrival';
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Step 2: Verify the return OTP provided by merchant
  const handleVerifyOtp = useCallback(async () => {
    if (!otp || otp.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit OTP from the merchant.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await ReturnVerificationApi({ orderId, otp: otp.trim() });
      setStep('done');
      // Small delay for UX, then proceed to earnings
      setTimeout(() => onNext(), 1200);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'OTP verification failed';
      setError(msg);
      Alert.alert('Invalid OTP', msg);
    } finally {
      setLoading(false);
    }
  }, [orderId, otp, onNext]);

  if (step === 'done') {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#10b981" />
        <Text style={styles.doneTitle}>Return Confirmed!</Text>
        <Text style={styles.doneSubtitle}>Loading your earnings…</Text>
        <ActivityIndicator color="#10b981" style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Ionicons name="storefront-outline" size={40} color="#1e3a8a" />
        <Text style={styles.headerTitle}>Return Handover</Text>
        <Text style={styles.headerSubtitle}>
          Hand back the {returnedCount} returned item{returnedCount !== 1 ? 's' : ''} to the merchant.
        </Text>
      </View>

      {/* Returned items summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📦 Returning {returnedCount} item{returnedCount !== 1 ? 's' : ''}</Text>
        {returnedItems.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.itemThumb} />
            ) : (
              <View style={[styles.itemThumb, styles.itemThumbPlaceholder]}>
                <Ionicons name="shirt-outline" size={20} color="#94a3b8" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemMeta}>Size: {item.size}  ·  ₹{item.price}</Text>
              {item.returnReason ? (
                <Text style={styles.returnReason}>Reason: {item.returnReason}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      {/* Step 1: Confirm arrival */}
      {step === 'confirm_arrival' && (
        <View style={styles.actionSection}>
          <Text style={styles.instructionText}>
            Tap below once you've reached the merchant and are ready to hand over the items.
          </Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleConfirmArrival}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryButtonText}>✅ Arrived at Merchant</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Enter return OTP */}
      {step === 'enter_otp' && (
        <View style={styles.actionSection}>
          <Text style={styles.instructionText}>
            Ask the merchant to verify the returned items and provide the return OTP.
          </Text>
          <View style={styles.otpBox}>
            <Text style={styles.otpLabel}>Enter Return OTP</Text>
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              placeholder="••••"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryButtonText}>Verify & Complete Return</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
    paddingBottom: 60,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 16,
  },
  doneSubtitle: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 6,
  },
  headerRow: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e3a8a',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  itemThumbPlaceholder: {
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  itemMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  returnReason: {
    fontSize: 11,
    color: '#ef4444',
    marginTop: 2,
    fontStyle: 'italic',
  },
  actionSection: {
    marginTop: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  otpBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  otpLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  otpInput: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1e3a8a',
    letterSpacing: 16,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 6,
    minWidth: 160,
  },
  primaryButton: {
    backgroundColor: '#1e3a8a',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#1e3a8a',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
});
