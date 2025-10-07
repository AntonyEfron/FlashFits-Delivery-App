import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const cities = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Indore',
];

const DeliveryPartnerEnrollment = () => {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [aadhaar, setAadhaar] = useState<string | null>(null);
  const [license, setLicense] = useState<string | null>(null);
  const [pan, setPan] = useState<string | null>(null);
  const [videoWatched, setVideoWatched] = useState(false);

  const steps = [
    { num: 1, title: 'Personal Info', icon: 'person' },
    { num: 2, title: 'Documents', icon: 'document-text' },
    { num: 3, title: 'Training', icon: 'play-circle' },
    { num: 4, title: 'Payment', icon: 'card' },
  ];

  const nextStep = () => {
    if (step === 1 && (!fullName || !city)) {
      Alert.alert('Missing Info', 'Please fill in all details.');
      return;
    }
    if (step === 2 && (!aadhaar || !license || !pan)) {
      Alert.alert('Missing Documents', 'Please upload all required documents.');
      return;
    }
    if (step === 3 && !videoWatched) {
      Alert.alert('Incomplete', 'Please confirm you have watched the training video.');
      return;
    }
    setStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

const handleFileUpload = async (setter: (value: string) => void) => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return;

    setter(result.assets[0].uri);
  } catch (error: any) {
    if (error.message?.includes('Permission')) {
      Alert.alert(
        'Permission Denied',
        'Please allow gallery access in your phone settings to upload files.'
      );
    } else {
      Alert.alert('Error', 'Something went wrong while selecting the image.');
    }
  }
};


  const handlePayment = () => {
    Alert.alert('Payment', 'Redirecting to secure payment gateway...');
  };

  return (
    <View style={styles.fullScreen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Become a Delivery Partner</Text>
        <Text style={styles.subheading}>Join thousands of partners earning daily</Text>

        {/* Stepper */}
        <View style={styles.stepper}>
          {steps.map((s, i) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <React.Fragment key={s.num}>
                <View style={[styles.stepCircle, 
                  isDone ? styles.doneStep : isActive ? styles.activeStep : styles.inactiveStep]}>
                  <Ionicons 
                    name={isDone ? 'checkmark-circle' : (s.icon as any)} 
                    size={24} 
                    color={isActive || isDone ? '#fff' : '#999'} 
                  />
                </View>
                {i < steps.length - 1 && <View style={[styles.stepLine, isDone && styles.doneLine]} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.title}>Personal Information</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
            />

            <TouchableOpacity
              style={styles.dropdownInput}
              onPress={() => setShowCityDropdown(true)}
            >
              <Text style={{ color: city ? '#000' : '#999' }}>
                {city || 'Select City / Area'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#555" />
            </TouchableOpacity>
          </View>
        )}

        {/* City Dropdown Modal */}
        <Modal visible={showCityDropdown} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Select City</Text>
              <FlatList
                data={cities}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.cityItem}
                    onPress={() => {
                      setCity(item);
                      setShowCityDropdown(false);
                    }}
                  >
                    <Text style={styles.cityText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                onPress={() => setShowCityDropdown(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Step 2: Documents */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.title}>Upload Documents</Text>
            <DocumentUploadBox title="Aadhaar Card" file={aadhaar} onUpload={() => handleFileUpload(setAadhaar)} />
            <DocumentUploadBox title="Driving License" file={license} onUpload={() => handleFileUpload(setLicense)} />
            <DocumentUploadBox title="PAN Card" file={pan} onUpload={() => handleFileUpload(setPan)} />
          </View>
        )}

        {/* Step 3: Training */}
        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.title}>Training Video</Text>
            <View style={styles.videoPlaceholder}>
              <Ionicons name="play-circle" size={50} color="white" />
              <Text style={styles.videoText}>Training Video - 5 min</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setVideoWatched(!videoWatched)} 
              style={styles.checkboxContainer}
            >
              <Ionicons 
                name={videoWatched ? 'checkbox' : 'square-outline'} 
                size={24} 
                color="#2563eb" 
              />
              <Text style={styles.checkboxText}>I have watched and understood the video</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Payment */}
        {step === 4 && (
          <View style={styles.card}>
            <Text style={styles.title}>One-Time Registration Fee</Text>
            <View style={styles.paymentBox}>
              <Text style={styles.paymentAmount}>₹199</Text>
              <Text style={styles.paymentText}>One-time payment • Non-refundable</Text>
            </View>
            <TouchableOpacity onPress={handlePayment} style={styles.paymentButton}>
              <Ionicons name="lock-closed" size={20} color="white" />
              <Text style={styles.paymentButtonText}>Proceed to Secure Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Navigation */}
        <View style={styles.navigation}>
          {step > 1 && (
            <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={20} color="#333" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < 4 && (
            <TouchableOpacity onPress={nextStep} style={styles.nextBtn}>
              <Text style={styles.nextText}>Continue</Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const DocumentUploadBox = ({ title, file, onUpload }) => (
  <TouchableOpacity onPress={onUpload} style={[styles.uploadBox, file && styles.uploadedBox]}>
    {file ? (
      <Image source={{ uri: file }} style={styles.previewImage} />
    ) : (
      <Ionicons name="cloud-upload" size={28} color="#555" />
    )}
    <Text style={styles.uploadText}>{file ? `${title} Uploaded` : `Upload ${title}`}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: '#f9fafb' },
  container: { padding: 20, paddingBottom: 60 },
  heading: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#111' },
  subheading: { textAlign: 'center', color: '#555', marginBottom: 20 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 25 },
  stepCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  activeStep: { backgroundColor: '#2563eb' },
  doneStep: { backgroundColor: '#22c55e' },
  inactiveStep: { backgroundColor: '#e5e7eb' },
  stepLine: { width: 40, height: 3, backgroundColor: '#d1d5db', marginHorizontal: 4, borderRadius: 2 },
  doneLine: { backgroundColor: '#22c55e' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 20, elevation: 3 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#111' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, marginBottom: 10 },
  dropdownInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, marginBottom: 10 },
  videoPlaceholder: { backgroundColor: '#1e3a8a', borderRadius: 10, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  videoText: { color: 'white', marginTop: 6 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkboxText: { color: '#333' },
  uploadBox: { borderWidth: 1.5, borderColor: '#ccc', borderStyle: 'dashed', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
  uploadedBox: { backgroundColor: '#dcfce7', borderColor: '#22c55e' },
  uploadText: { marginTop: 8, color: '#333' },
  previewImage: { width: 80, height: 80, borderRadius: 10, marginBottom: 8 },
  paymentBox: { backgroundColor: '#2563eb', borderRadius: 10, padding: 20, alignItems: 'center', marginBottom: 15 },
  paymentAmount: { color: 'white', fontSize: 36, fontWeight: 'bold' },
  paymentText: { color: 'white', opacity: 0.9 },
  paymentButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 14, gap: 8 },
  paymentButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  navigation: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e5e7eb', padding: 12, borderRadius: 10 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', padding: 12, borderRadius: 10 },
  backText: { color: '#333', fontWeight: '500', marginLeft: 6 },
  nextText: { color: 'white', fontWeight: '500', marginRight: 6 },

  // City dropdown modal
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', width: '80%', borderRadius: 12, padding: 16, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  cityItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  cityText: { fontSize: 16, color: '#111', textAlign: 'center' },
  modalCloseBtn: { marginTop: 10, padding: 10, alignItems: 'center' },
  modalCloseText: { color: '#2563eb', fontWeight: '500' },
});

export default DeliveryPartnerEnrollment;
