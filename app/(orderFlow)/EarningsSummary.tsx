import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface EarningsSummaryProps {
  onFinish: () => void;
}

const EarningsSummary: React.FC<EarningsSummaryProps> = ({ onFinish }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Completed 🎉</Text>

      <View style={styles.card}>
        <Text style={styles.amount}>₹120</Text>
        <Text style={styles.label}>Earned for this order</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={onFinish}>
        <Text style={styles.buttonText}>Go Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 30 },
  card: {
    backgroundColor: '#f0fdf4',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  amount: { fontSize: 36, fontWeight: '800', color: '#16a34a', marginBottom: 8 },
  label: { fontSize: 16, color: '#4b5563' },
  button: { backgroundColor: '#2563eb', padding: 15, borderRadius: 10, width: '100%' },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
});

export default EarningsSummary;
