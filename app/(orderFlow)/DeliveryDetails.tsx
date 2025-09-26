import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface DeliveryDetailsProps {
  onNext: () => void;
}

const DeliveryDetails: React.FC<DeliveryDetailsProps> = ({ onNext }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deliver Order</Text>
      <Text style={styles.info}>Customer: John Doe</Text>
      <Text style={styles.info}>Address: 221B Baker Street</Text>
      <Text style={styles.info}>Amount: ₹120</Text>

      <TouchableOpacity style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>Mark as Delivered</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  info: { fontSize: 16, marginBottom: 10 },
  button: { backgroundColor: '#dc2626', padding: 15, borderRadius: 10, marginTop: 20 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
});

export default DeliveryDetails;
