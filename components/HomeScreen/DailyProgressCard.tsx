import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface DailyProgressCardProps {
  earnings?: number;
  onlineTime?: string;
  orders?: number;
  incentives?: any[];
}

const DailyProgressCard: React.FC<DailyProgressCardProps> = ({
  earnings = 0,
  onlineTime = '0h 0m',
  orders = 0,
  incentives = [],
}) => {
  const router = useRouter();

  const formatEarnings = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.statsContainer}>
          {/* Earnings */}
          <View style={styles.statItem}>
            <View style={styles.iconContainer}>
              <Text style={styles.earningsIcon}>₹</Text>
            </View>
            <Text style={styles.statValue}>{formatEarnings(earnings)}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>

          <View style={styles.divider} />

          {/* Online Time */}
          <View style={styles.statItem}>
            <View style={styles.iconContainer}>
              <Text style={styles.timeIcon}>🕒</Text>
            </View>
            <Text style={styles.statValue}>{onlineTime}</Text>
            <Text style={styles.statLabel}>Online time</Text>
          </View>

          <View style={styles.divider} />

          {/* Orders */}
          <View style={styles.statItem}>
            <View style={styles.iconContainer}>
              <Text style={styles.ordersIcon}>🛍️</Text>
            </View>
            <Text style={styles.statValue}>{orders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
        </View>

        {/* Mini Incentive Tracker */}
        {incentives && incentives.length > 0 && (
          <View style={styles.incentiveContainer}>
            <Text style={styles.incentiveTitle}>🎯 Active Incentives</Text>
            {incentives.slice(0, 2).map((inc, idx) => {
              const progress = inc.progress || {};
              const nextSlab = progress.nextSlab;
              const currentSlab = progress.currentSlab;
              const maxOrders = nextSlab ? nextSlab.minOrders : (currentSlab ? currentSlab.minOrders : 1);
              const progressRatio = Math.min((progress.completedOrders || 0) / maxOrders, 1);
              
              return (
                <View key={idx} style={styles.miniIncentiveItem}>
                  <View style={styles.miniIncentiveHeader}>
                    <Text style={styles.miniIncentiveName}>{inc.name}</Text>
                    <Text style={styles.miniIncentiveStatus}>
                      {progress.completedOrders || 0}/{maxOrders}
                    </Text>
                  </View>
                  <View style={styles.miniProgressBarBg}>
                    <View 
                      style={[
                        styles.miniProgressBarFill, 
                        { width: `${progressRatio * 100}%`, backgroundColor: currentSlab ? '#10b981' : '#3b82f6' }
                      ]} 
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={styles.orderButton}
          onPress={() => router.push('/(home)/Earnings')}
        >
          <Text style={styles.orderButtonText}>View Earnings Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingVertical: 12 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  earningsIcon: { fontSize: 16, fontWeight: '600', color: '#059669' },
  timeIcon: { fontSize: 14 },
  ordersIcon: { fontSize: 14 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  statLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  divider: { width: 1, height: 60, backgroundColor: '#e5e7eb', marginHorizontal: 8 },
  orderButton: {
    marginTop: 20,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
  },
  orderButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
    color: '#fff',
  },
  incentiveContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  incentiveTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  miniIncentiveItem: {
    marginBottom: 8,
  },
  miniIncentiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  miniIncentiveName: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  miniIncentiveStatus: {
    fontSize: 12,
    color: '#6b7280',
  },
  miniProgressBarBg: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
  },
  miniProgressBarFill: {
    height: 6,
    borderRadius: 3,
  },
});

export default DailyProgressCard;
