import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface MerchantReturnVerificationProps {
  onNext: () => void;
}

const MerchantReturnVerification: React.FC<MerchantReturnVerificationProps> = ({ onNext }) => {
  const [verifying, setVerifying] = useState(false);

  // Example order data (replace with real props or backend data)
  const orderData = {
    totalItems: 3,
    Distance: '4.8 km',
    returnId: 'RET-2024-056',
  };

  const handleHandover = () => {
    setVerifying(true);
    // simulate merchant verification (3 seconds)
    setTimeout(() => {
      setVerifying(false);
      setTimeout(onNext, 1000);
    }, 3000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {verifying ? (
        <View style={styles.loaderBox}>
          <MaterialCommunityIcons name="storefront-outline" size={70} color="#1e3a8a" />
          <Text style={styles.title}>Merchant Verification</Text>
          <Text style={styles.subtitle}>
            Waiting for merchant to verify the returned items...
          </Text>
          <ActivityIndicator size="large" color="#1e3a8a" style={{ marginTop: 24 }} />
        </View>
      ) : (
        <View style={styles.content}>
          <Ionicons name="cube-outline" size={60} color="#1e3a8a" />
          <Text style={styles.mainTitle}>Return Handover</Text>
          <Text style={styles.mainSubtitle}>
            Verify the returned items before handing over to the merchant.
          </Text>

          {/* Order Summary Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📦 Order Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{orderData.totalItems}</Text>
                <Text style={styles.summaryLabel}>Total Items</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{orderData.Distance}</Text>
                <Text style={styles.summaryLabel}>Est. Distance</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryFooter}>
              <Text style={styles.returnIdLabel}>Return ID:</Text>
              <Text style={styles.returnIdValue}>{orderData.returnId}</Text>
            </View>
          </View>

          {/* Handover Button */}
          <TouchableOpacity style={styles.handoverButton} onPress={handleHandover}>
            <Text style={styles.handoverText}>Handover to Merchant</Text>
            <Ionicons name="arrow-forward-circle" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

export default MerchantReturnVerification;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  loaderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e3a8a',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e3a8a',
    marginTop: 12,
  },
  mainSubtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 28,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  returnIdLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  returnIdValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  handoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e3a8a',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '90%',
  },
  handoverText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginRight: 8,
  },
});
