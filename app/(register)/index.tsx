import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type RootStackParamList = {
  Home: undefined;
  Register: undefined;
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Register"
>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    aadharNumber: "",
    licenseNumber: "",
    vehicleNumber: "",
    vehicleType: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = () => {
    // Simple validation
    if (
      !formData.name ||
      !formData.aadharNumber ||
      !formData.licenseNumber ||
      !formData.vehicleNumber ||
      !formData.vehicleType
    ) {
      Alert.alert("Missing Info ❌", "Please fill in all fields");
      return;
    }

    // TODO: API call to backend to save details
    console.log("Registering Rider:", formData);

    Alert.alert("✅ Success", "Registration complete!");
    navigation.replace("Home"); // go to Home after successful registration
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Rider Registration 🚴</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={formData.name}
        onChangeText={(text) => handleChange("name", text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Aadhar Number"
        keyboardType="numeric"
        value={formData.aadharNumber}
        onChangeText={(text) => handleChange("aadharNumber", text)}
      />

      <TextInput
        style={styles.input}
        placeholder="License Number"
        value={formData.licenseNumber}
        onChangeText={(text) => handleChange("licenseNumber", text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Vehicle Number"
        value={formData.vehicleNumber}
        onChangeText={(text) => handleChange("vehicleNumber", text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Vehicle Type (bike/scooter/car)"
        value={formData.vehicleType}
        onChangeText={(text) => handleChange("vehicleType", text)}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Complete Registration</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
