import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ReachPickupProps {
  onNext: () => void;
}

const ReachPickup: React.FC<ReachPickupProps> = ({ onNext }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Go to Pickup Location</Text>
      <Text style={styles.info}>Pickup: ABC Restaurant, MG Road</Text>
      <TouchableOpacity style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>Reached Pickup</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  info: { fontSize: 16, marginBottom: 10 },
  button: { backgroundColor: '#2563eb', padding: 15, borderRadius: 10, marginTop: 20 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
});

export default ReachPickup;
