import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AcceptOrderProps {
  onNext: () => void;
}

const AcceptOrder: React.FC<AcceptOrderProps> = ({ onNext }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Order Request</Text>
      <Text style={styles.info}>Pickup: ABC Restaurant, MG Road</Text>
      <Text style={styles.info}>Delivery Amount: ₹120</Text>
      <TouchableOpacity style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>Accept Order</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  info: { fontSize: 16, marginBottom: 10 },
  button: { backgroundColor: '#16a34a', padding: 15, borderRadius: 10, marginTop: 20 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
});

export default AcceptOrder;
