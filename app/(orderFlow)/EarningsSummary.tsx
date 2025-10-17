import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface EarningsSummaryProps {
  onFinish: () => void;
}

const EarningsSummary: React.FC<EarningsSummaryProps> = ({ onFinish }) => {
  const breakdown = [
    { label: 'Base Fare', amount: 65, color: '#3b82f6', icon: '💰' },
    { label: 'Surge Bonus', amount: 30, color: '#f59e0b', icon: '⚡' },
    { label: 'Waiting Charges', amount: 15, color: '#8b5cf6', icon: '⏱️' },
    { label: 'Return Bonus', amount: 10, color: '#10b981', icon: '🔄' },
  ];

  const totalEarnings = breakdown.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.earningsHeader}>
            <Text style={styles.congratsText}>Delivery Completed! 🎉</Text>
            <Text style={styles.totalLabel}>TOTAL EARNINGS</Text>
            <Text style={styles.totalAmount}>₹{totalEarnings}</Text>
          </View>
        </View>

        <View style={styles.breakdownSection}>
          {breakdown.map((item, index) => (
            <View key={index} style={styles.breakdownItem}>
              <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                  <Text style={styles.iconText}>{item.icon}</Text>
                </View>
                <Text style={styles.itemLabel}>{item.label}</Text>
              </View>
              <Text style={styles.itemAmount}>₹{item.amount}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={onFinish} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Continue to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  earningsHeader: {
    alignItems: 'flex-start',
  },
  congratsText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 130,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -2,
  },
  breakdownSection: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  itemLabel: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '500',
  },
  itemAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
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
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default EarningsSummary;