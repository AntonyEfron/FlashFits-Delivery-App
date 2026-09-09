import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EarningsSummaryProps {
  onFinish: () => void;
  order?: any; // pass the full order object from the parent
}

/**
 * EarningsSummary — shown after completing a delivery.
 * Derives real earnings from the order object.
 */
const EarningsSummary: React.FC<EarningsSummaryProps> = ({ onFinish, order }) => {
  // Real earnings from the order's charges: Delivery Charge + Return Charge + Tip
  const returnCharge = order?.originalReturnCharge ?? order?.returnCharge ?? 0;
  const deliveryTip = order?.finalBilling?.deliveryTip || order?.deliveryTip || order?.tip || 0;
  const baseFare = order?.originalDeliveryCharge 
    ?? order?.finalBilling?.deliveryCharge 
    ?? order?.deliveryCharge 
    ?? (order?.deliveryAmount ? Math.max(0, order.deliveryAmount - returnCharge - deliveryTip) : 0);

  // Waiting time compensation (if customer took long during try-phase)
  const waitingCharge = order?.waitingTimeCharge || 0;

  const breakdown = useMemo(() => {
    const rows: { label: string; amount: number; icon: string; color: string }[] = [];

    if (baseFare > 0) {
      rows.push({ label: 'Delivery Charge', amount: baseFare, icon: '🚴', color: '#3b82f6' });
    }
    if (returnCharge > 0) {
      rows.push({ label: 'Return Charge', amount: returnCharge, icon: '🔄', color: '#10b981' });
    }
    if (deliveryTip > 0) {
      rows.push({ label: 'Customer Tip', amount: deliveryTip, icon: '💝', color: '#f59e0b' });
    }
    if (waitingCharge > 0) {
      rows.push({ label: 'Waiting Time Comp', amount: waitingCharge, icon: '⏳', color: '#8b5cf6' });
    }
    // If no real data is available, show delivery fare fallback
    if (rows.length === 0) {
      rows.push({ label: 'Delivery Charge', amount: order?.deliveryAmount || 0, icon: '🚴', color: '#3b82f6' });
    }
    return rows;
  }, [baseFare, returnCharge, waitingCharge, deliveryTip, order?.deliveryAmount]);


  const totalEarnings = breakdown.reduce((sum, item) => sum + item.amount, 0);
  const collectedViaQR = order?.deliveryFeeRecovery?.collectedByRider === true;
  const qrCollectedAmount = collectedViaQR ? (order?.deliveryFeeRecovery?.amount || 0) : 0;
  // FlashFits payout is total minus what the rider already collected directly
  const flashFitsPayout = Math.max(0, totalEarnings - qrCollectedAmount);

  const allKept = order?.items?.every((i: any) => i.tryStatus === 'accepted' || i.tryStatus === 'not-triable');
  const keptCount = order?.items?.filter((i: any) => i.tryStatus === 'accepted' || i.tryStatus === 'not-triable').length ?? 0;
  const returnedCount = order?.items?.filter((i: any) => i.tryStatus === 'returned').length ?? 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Header */}
        <View style={styles.header}>
          <View style={styles.earningsHeader}>
            <Text style={styles.congratsText}>Delivery Complete! 🎉</Text>
            <Text style={styles.totalLabel}>TOTAL EARNINGS</Text>
            <Text style={styles.totalAmount}>₹{totalEarnings}</Text>
          </View>
        </View>

        {/* Trial outcome */}
        {order?.items && (
          <View style={styles.outcomePill}>
            <Ionicons
              name={allKept ? 'checkmark-circle' : 'swap-horizontal'}
              size={18}
              color={allKept ? '#10b981' : '#f59e0b'}
            />
            <Text style={styles.outcomeText}>
              {keptCount} kept{returnedCount > 0 ? `, ${returnedCount} returned` : ''}
            </Text>
          </View>
        )}

        {/* Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          {breakdown.map((item, index) => (
            <View key={index} style={styles.breakdownItem}>
              <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                  <Text style={styles.iconText}>{item.icon}</Text>
                </View>
                <Text style={styles.itemLabel}>{item.label}</Text>
              </View>
              <Text style={[styles.itemAmount, { color: item.color }]}>₹{item.amount}</Text>
            </View>
          ))}

          {/* Divider + total */}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalRowLabel}>Total</Text>
            <Text style={styles.totalRowAmount}>₹{totalEarnings}</Text>
          </View>
          
          {collectedViaQR && (
            <View style={[styles.breakdownItem, { marginTop: 12, backgroundColor: '#f0fdf4', padding: 8, borderRadius: 8 }]}>
              <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#10b98120' }]}>
                  <Text style={styles.iconText}>📱</Text>
                </View>
                <Text style={[styles.itemLabel, { color: '#047857' }]}>Collected via QR</Text>
              </View>
              <Text style={[styles.itemAmount, { color: '#047857' }]}>-₹{qrCollectedAmount}</Text>
            </View>
          )}
          
          {collectedViaQR && (
            <View style={[styles.totalRow, { marginTop: 8 }]}>
              <Text style={[styles.totalRowLabel, { fontSize: 14 }]}>Weekly Payout Addition</Text>
              <Text style={[styles.totalRowAmount, { fontSize: 16 }]}>₹{flashFitsPayout}</Text>
            </View>
          )}
        </View>

        {/* Order reference */}
        {order?._id && (
          <Text style={styles.orderRef}>
            Order #{order._id.slice(-8).toUpperCase()}
          </Text>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={onFinish} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Continue to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EarningsSummary;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  earningsHeader: { alignItems: 'flex-start' },
  congratsText: { fontSize: 16, color: '#64748b', marginBottom: 8, fontWeight: '500' },
  totalLabel: { fontSize: 13, color: '#94a3b8', marginBottom: 4, fontWeight: '600', letterSpacing: 0.5 },
  totalAmount: { fontSize: 96, fontWeight: '800', color: '#0f172a', letterSpacing: -2 },
  outcomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  outcomeText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  breakdownSection: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94a3b8', marginBottom: 16, letterSpacing: 0.5 },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: { fontSize: 20 },
  itemLabel: { fontSize: 15, color: '#475569', fontWeight: '500' },
  itemAmount: { fontSize: 17, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalRowLabel: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  totalRowAmount: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  orderRef: { textAlign: 'center', marginTop: 20, color: '#94a3b8', fontSize: 12, fontFamily: 'monospace' },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
});