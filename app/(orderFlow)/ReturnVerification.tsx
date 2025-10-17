import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

interface ReturnVerificationProps {
  onNext: () => void;
}

const ReturnVerification: React.FC<ReturnVerificationProps> = ({ onNext }) => {
  const [image, setImage] = useState<string | null>(null);
  const [otp, setOtp] = useState('');

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is needed to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!image) {
      Alert.alert('Upload Required', 'Please upload or take a return proof photo.');
      return;
    }
    if (otp.trim().length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter a valid 4-digit OTP.');
      return;
    }

    Alert.alert('Verification Complete', 'Return successfully verified!', [
      { text: 'OK', onPress: onNext },
    ]);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="package-variant-closed" size={60} color="#1e3a8a" />
          <Text style={styles.title}>Return Verification</Text>
          <Text style={styles.subtitle}>
            Upload proof photo and enter customer OTP to complete the return process.
          </Text>
        </View>

        {/* Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Upload Return Proof</Text>
          {image ? (
            <TouchableOpacity onPress={openCamera} style={styles.imagePreviewWrapper}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <View style={styles.overlay}>
                <Ionicons name="camera" size={24} color="#fff" />
                <Text style={styles.overlayText}>Change Photo</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View>
              <TouchableOpacity style={styles.uploadBox} onPress={openCamera}>
                <Ionicons name="camera-outline" size={50} color="#9ca3af" />
                <Text style={styles.uploadText}>Take Photo Using Camera</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* OTP Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Customer OTP</Text>
          <TextInput
            style={styles.otpInput}
            placeholder="Enter 4-digit OTP"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            maxLength={4}
            value={otp}
            onChangeText={setOtp}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Verify Return</Text>
          <Ionicons name="checkmark-done" size={22} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ReturnVerification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f6ff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1e3a8a',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#9ca3af',
    borderRadius: 12,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  uploadText: {
    color: '#6b7280',
    marginTop: 8,
    fontSize: 14,
  },
  imagePreviewWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
  otpInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 6,
    color: '#111827',
  },
  submitButton: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
    marginTop: 10,
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});