import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

const DailyProgressCard = ({ 
  earnings = 0, 
  onlineTime = "0h 0m", 
  orders = 0 
}) => {
  const formatEarnings = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.header}>TODAY'S PROGRESS</Text>
        
        <View style={styles.statsContainer}>
          {/* Earnings Section */}
          <View style={styles.statItem}>
            <View style={styles.iconContainer}>
              <Text style={styles.earningsIcon}>₹</Text>
            </View>
            <Text style={styles.statValue}>{formatEarnings(earnings)}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Online Time Section */}
          <View style={styles.statItem}>
            <View style={styles.iconContainer}>
              <Text style={styles.timeIcon}>🕒</Text>
            </View>
            <Text style={styles.statValue}>{onlineTime}</Text>
            <Text style={styles.statLabel}>Online time</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Orders Section */}
          <View style={styles.statItem}>
            <View style={styles.iconContainer}>
              <Text style={styles.ordersIcon}>🛍️</Text>
            </View>
            <Text style={styles.statValue}>{orders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 24,
    textTransform: 'uppercase',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  earningsIcon: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  timeIcon: {
    fontSize: 14,
  },
  ordersIcon: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
});

export default DailyProgressCard;