import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  onNext: () => void;
};

export default function ReachDeliveryLocation({ onNext }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Reach Delivery Location</Text>
      <Text style={styles.subtitle}>
        Navigate to the customer’s location and confirm when you arrive.
      </Text>

      <TouchableOpacity style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>I’ve Reached</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: 30, color: "#666" },
  button: { backgroundColor: "#FF9800", padding: 15, borderRadius: 10 },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
