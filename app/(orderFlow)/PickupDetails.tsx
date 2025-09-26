import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface PickupDetailsProps {
  onNext: () => void;
}

const PickupDetails: React.FC<PickupDetailsProps> = ({ onNext }) => {
  const [code, setCode] = useState<string>("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pickup Order</Text>
      <Text style={styles.info}>Order #: 56789</Text>
      <Text style={styles.info}>Items: 3</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter verification code"
        value={code}
        onChangeText={setCode}
      />

      <TouchableOpacity style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>Verify & Pickup</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  info: { fontSize: 16, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  button: { backgroundColor: '#f59e0b', padding: 15, borderRadius: 10, marginTop: 20 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
});

export default PickupDetails;
