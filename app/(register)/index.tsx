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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ActivityIndicator } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { submitPersonalDetails, uploadDocuments, submitBankDetails} from "../api/registration";

const cities = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Indore',
];

const bankNames = [
  "State Bank of India (SBI)",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank (PNB)",
  "Kotak Mahindra Bank",
  "IndusInd Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
];

const areasByCity = {
  Mumbai: ['Andheri', 'Bandra', 'Borivali', 'Dadar', 'Goregaon', 'Malad', 'Powai', 'Thane'],
  Delhi: ['Connaught Place', 'Dwarka', 'Karol Bagh', 'Lajpat Nagar', 'Nehru Place', 'Rohini', 'Saket'],
  Bengaluru: ['Indiranagar', 'Koramangala', 'Whitefield', 'Jayanagar', 'HSR Layout', 'BTM Layout', 'Electronic City'],
  Hyderabad: ['Banjara Hills', 'Hitech City', 'Gachibowli', 'Madhapur', 'Kukatpally', 'Secunderabad'],
  Chennai: ['Anna Nagar', 'T Nagar', 'Velachery', 'Adyar', 'Porur', 'Tambaram', 'OMR'],
  Kolkata: ['Park Street', 'Salt Lake', 'Howrah', 'Ballygunge', 'Behala', 'Jadavpur'],
  Pune: ['Kothrud', 'Hinjewadi', 'Wakad', 'Baner', 'Viman Nagar', 'Hadapsar', 'Pimpri'],
  Ahmedabad: ['Satellite', 'Vastrapur', 'Bodakdev', 'Maninagar', 'Naroda', 'Chandkheda'],
  Jaipur: ['Malviya Nagar', 'Vaishali Nagar', 'Mansarovar', 'C-Scheme', 'Raja Park'],
  Surat: ['Adajan', 'Vesu', 'Pal', 'City Light', 'Varachha', 'Althan'],
  Lucknow: ['Gomti Nagar', 'Hazratganj', 'Alambagh', 'Indira Nagar', 'Aliganj'],
  Indore: ['Vijay Nagar', 'MG Road', 'Bhanwarkuan', 'Rau', 'Palasia', 'Nipania'],
};



const DeliveryPartnerEnrollment = () => {
  const [step, setStep] = useState(5);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
const [aadhaarFront, setAadhaarFront] = useState<string | null>(null);
const [aadhaarBack, setAadhaarBack] = useState<string | null>(null);
const [licenseFront, setLicenseFront] = useState<string | null>(null);
const [licenseBack, setLicenseBack] = useState<string | null>(null);
const [panFront, setPanFront] = useState<string | null>(null);
const [panBack, setPanBack] = useState<string | null>(null);
  const [videoWatched, setVideoWatched] = useState(false);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [holderName, setHolderName] = useState('');

  // Bank details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  const [loading, setLoading] = useState(false);

  const steps = [
    { num: 1, title: 'Personal', icon: 'person' },
    { num: 2, title: 'Documents', icon: 'document-text' },
    { num: 3, title: 'Training', icon: 'school' },
    { num: 4, title: 'Bank', icon: 'wallet' },
    { num: 5, title: 'Payment', icon: 'card' },
  ];

  const calculateAge = (birthDate) => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return (age - 1).toString();
    }
    return age.toString();
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDob(selectedDate);
      setAge(calculateAge(selectedDate));
    }
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

const nextStep = async () => {
  if (step === 1) {
    const personalData = {
      fullName,
      dob,
      age,
      gender,
      email,
      city,
      area,
      pincode,
    };
    try {
      const response = await submitPersonalDetails(personalData);
      console.log("Personal details saved:", response);
      setStep(2); // move to next step if success
      return; // stop further execution
    } catch (error) {
      Alert.alert("Error", "Failed to submit personal details. Please try again.");
      return;
    }
  }

  else if (step === 2) {
    if (
      !aadhaarFront || !aadhaarBack ||
      !licenseFront || !licenseBack ||
      !panFront || !panBack
    ) {
      Alert.alert('Missing Documents', 'Please upload all required documents (front & back).');
      return;
    }

    const formData = new FormData();
    formData.append("aadhaarFront", { uri: aadhaarFront, type: "image/jpeg", name: "aadhaar_front.jpg" });
    formData.append("aadhaarBack", { uri: aadhaarBack, type: "image/jpeg", name: "aadhaar_back.jpg" });
    formData.append("licenseFront", { uri: licenseFront, type: "image/jpeg", name: "license_front.jpg" });
    formData.append("licenseBack", { uri: licenseBack, type: "image/jpeg", name: "license_back.jpg" });
    formData.append("panFront", { uri: panFront, type: "image/jpeg", name: "pan_front.jpg" });
    formData.append("panBack", { uri: panBack, type: "image/jpeg", name: "pan_back.jpg" });

    try {
      setLoading(true);
      const response = await uploadDocuments(formData);
      console.log("Documents uploaded:", response);
      setStep(3);
      return; // stop here ✅
    } catch (error) {
      Alert.alert("Upload Failed", "Unable to upload documents. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  else if (step === 3) {
    if (!videoWatched) {
      Alert.alert('Incomplete', 'Please confirm you have watched the training video.');
      return;
    }
    setStep(4);
  }

else if (step === 4) {
  if (!holderName || !bankName || !accountNumber || !confirmAccountNumber || !ifsc) {
    Alert.alert('Missing Info', 'Please fill in all the required bank details.');
    return;
  }

  if (accountNumber !== confirmAccountNumber) {
    Alert.alert('Mismatch', 'Account numbers do not match. Please recheck.');
    return;
  }

    const bankData = {
      accountHolderName: holderName.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifsc: ifsc.trim(),
    };
  try {
    setLoading(true);
    const response = await submitBankDetails(bankData);
    console.log('Bank details API response:', response);

    // ✅ handle both success cases
    if (response?.success || response?.status === 200) {
      Alert.alert('Success', 'Bank details submitted successfully!');
      setStep(5);
    } else {
      throw new Error(response?.message || 'Unexpected response');
    }
  } catch (error) {
    console.error('Bank details submission error:', error);
    Alert.alert('Error', 'Failed to submit bank details. Please try again.');
  } finally {
    setLoading(false);
  }
}

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
    <KeyboardAvoidingView 
      style={styles.fullScreen} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="bicycle" size={32} color="#2563eb" />
          </View>
          <Text style={styles.heading}>Become a Delivery Partner</Text>
          <Text style={styles.subheading}>Join thousands of partners earning daily</Text>
        </View>

        {/* Modern Stepper */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepper}>
            {steps.map((s, i) => {
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <React.Fragment key={s.num}>
                  <View style={styles.stepWrapper}>
                    <View style={[
                      styles.stepCircle,
                      isDone ? styles.doneStep : isActive ? styles.activeStep : styles.inactiveStep,
                    ]}>
                      {isDone ? (
                        <Ionicons name="checkmark" size={18} color="#fff" />
                      ) : (
                        <Text style={[styles.stepNumber, isActive && styles.activeStepNumber]}>
                          {s.num}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.stepTitle, isActive && styles.activeStepTitle]}>
                      {s.title}
                    </Text>
                  </View>
                  {i < steps.length - 1 && (
                    <View style={[styles.stepLine, isDone && styles.doneLine]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              {/* <Ionicons name="person-circle" size={24} color="#2563eb" /> */}
              <Text style={styles.cardTitle}>Personal Information</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
                value={fullName}
                onChangeText={setFullName}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth *</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color="#6b7280" />
                <Text style={styles.dateText}>{formatDate(dob)}</Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={dob}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <View style={styles.ageDisplay}>
                <Text style={styles.ageText}>{age || '--'} years</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                onPress={() => setShowGenderDropdown(true)}
              >
                <Text style={[styles.dropdownText, !gender && styles.placeholderText]}>
                  {gender || 'Select gender'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit pincode"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                maxLength={6}
                value={pincode}
                onChangeText={setPincode}
                returnKeyType="done"
              />
            </View>
          </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Select City/Area for Delivery</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>City / Area *</Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                onPress={() => setShowCityDropdown(true)}
              >
                <Ionicons name="location" size={20} color="#6b7280" />
                <Text style={[styles.dropdownText, !city && styles.placeholderText]}>
                  {city || 'Select your city'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

                        {city ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Area *</Text>
                <TouchableOpacity
                  style={styles.dropdownInput}
                  onPress={() => setShowAreaDropdown(true)}
                >
                  <Ionicons name="map" size={20} color="#6b7280" />
                  <Text style={[styles.dropdownText, !area && styles.placeholderText]}>
                    {area || 'Select your area'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            ) : null}
            
          </View>

          </>
        )}

        {/* City Dropdown Modal */}
        <Modal visible={showCityDropdown} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select City</Text>
                <TouchableOpacity onPress={() => setShowCityDropdown(false)}>
                  <Ionicons name="close-circle" size={28} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={cities}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.cityItem, city === item && styles.selectedCityItem]}
                    onPress={() => {
                      // When city changes → clear area selection
                      if (item !== city) {
                        setArea('');
                      }
                      setCity(item);
                      setShowCityDropdown(false);
                    }}
                  >
                    <Text style={[styles.cityText, city === item && styles.selectedCityText]}>
                      {item}
                    </Text>
                    {city === item && <Ionicons name="checkmark" size={20} color="#2563eb" />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <Modal visible={showAreaDropdown} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Area</Text>
                <TouchableOpacity onPress={() => setShowAreaDropdown(false)}>
                  <Ionicons name="close-circle" size={28} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={areasByCity[city] || []}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.cityItem, area === item && styles.selectedCityItem]}
                    onPress={() => {
                      setArea(item);
                      setShowAreaDropdown(false);
                    }}
                  >
                    <Text style={[styles.cityText, area === item && styles.selectedCityText]}>
                      {item}
                    </Text>
                    {area === item && <Ionicons name="checkmark" size={20} color="#2563eb" />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>


        {/* Gender Dropdown Modal */}
        <Modal visible={showGenderDropdown} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Gender</Text>
                <TouchableOpacity onPress={() => setShowGenderDropdown(false)}>
                  <Ionicons name="close-circle" size={28} color="#6b7280" />
                </TouchableOpacity>
              </View>
              {['Male', 'Female', 'Other', 'Prefer not to say'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.cityItem, gender === item && styles.selectedCityItem]}
                  onPress={() => {
                    setGender(item);
                    setShowGenderDropdown(false);
                  }}
                >
                  <Text style={[styles.cityText, gender === item && styles.selectedCityText]}>
                    {item}
                  </Text>
                  {gender === item && <Ionicons name="checkmark" size={20} color="#2563eb" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* Step 2: Documents */}
      {step === 2 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={24} color="#2563eb" />
            <Text style={styles.cardTitle}>Upload Documents</Text>
          </View>
          <Text style={styles.cardSubtitle}>Please upload clear photos of both sides</Text>
          
          <DocumentUploadBoxDouble 
            title="Aadhaar Card" 
            frontFile={aadhaarFront}
            backFile={aadhaarBack}
            onUploadFront={() => handleFileUpload(setAadhaarFront)}
            onUploadBack={() => handleFileUpload(setAadhaarBack)}
          />
          <DocumentUploadBoxDouble 
            title="Driving License" 
            frontFile={licenseFront}
            backFile={licenseBack}
            onUploadFront={() => handleFileUpload(setLicenseFront)}
            onUploadBack={() => handleFileUpload(setLicenseBack)}
          />
          <DocumentUploadBoxDouble 
            title="PAN Card" 
            frontFile={panFront}
            backFile={panBack}
            onUploadFront={() => handleFileUpload(setPanFront)}
            onUploadBack={() => handleFileUpload(setPanBack)}
          />
        </View>
      )}

        {/* Step 3: Training */}
        {step === 3 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="school" size={24} color="#2563eb" />
              <Text style={styles.cardTitle}>Training Video</Text>
            </View>
            <Text style={styles.cardSubtitle}>Watch this short video to get started</Text>
            
            <View style={styles.videoPlaceholder}>
              <View style={styles.playButton}>
                <Ionicons name="play" size={40} color="white" />
              </View>
              <Text style={styles.videoText}>Training Video - 5 minutes</Text>
              <Text style={styles.videoSubtext}>Learn about safety, delivery process & earnings</Text>
            </View>
            
            <TouchableOpacity
              onPress={() => setVideoWatched(!videoWatched)}
              style={styles.checkboxContainer}
            >
              <View style={[styles.checkbox, videoWatched && styles.checkboxChecked]}>
                {videoWatched && <Ionicons name="checkmark" size={18} color="white" />}
              </View>
              <Text style={styles.checkboxText}>I have watched and understood the video</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Bank Details */}
        {step === 4 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="wallet" size={24} color="#2563eb" />
              <Text style={styles.cardTitle}>Bank Account Details</Text>
            </View>
            <Text style={styles.cardSubtitle}>For receiving your earnings</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bank Name *</Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              onPress={() => setShowBankDropdown(true)}
            >
              <Ionicons name="business" size={20} color="#6b7280" />
              <Text style={[styles.dropdownText, !bankName && styles.placeholderText]}>
                {bankName || "Select your bank"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

            <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Holder Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter account holder's name"
              placeholderTextColor="#9ca3af"
              value={holderName}
              onChangeText={setHolderName}
              returnKeyType="next"
            />
          </View>


            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter account number"
                placeholderTextColor="#9ca3af"
                value={accountNumber}
                keyboardType="numeric"
                onChangeText={setAccountNumber}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Account Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter account number"
              placeholderTextColor="#9ca3af"
              value={confirmAccountNumber}
              keyboardType="numeric"
              onChangeText={setConfirmAccountNumber}
              returnKeyType="done"
            />
          </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>IFSC Code *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. SBIN0001234"
                placeholderTextColor="#9ca3af"
                value={ifsc}
                onChangeText={setIfsc}
                autoCapitalize="characters"
                returnKeyType="done"
              />
            </View>
          </View>
        )}

        <Modal visible={showBankDropdown} transparent animationType="slide">
  <View style={styles.modalContainer}>
    <View style={styles.modalBox}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Select Bank</Text>
        <TouchableOpacity onPress={() => setShowBankDropdown(false)}>
          <Ionicons name="close-circle" size={28} color="#6b7280" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={bankNames}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.cityItem, bankName === item && styles.selectedCityItem]}
            onPress={() => {
              setBankName(item);
              setShowBankDropdown(false);
            }}
          >
            <Text style={[styles.cityText, bankName === item && styles.selectedCityText]}>
              {item}
            </Text>
            {bankName === item && <Ionicons name="checkmark" size={20} color="#2563eb" />}
          </TouchableOpacity>
        )}
      />
    </View>
  </View>
</Modal>

        {/* Step 5: Payment */}
        {step === 5 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="card" size={24} color="#2563eb" />
              <Text style={styles.cardTitle}>Registration Fee</Text>
            </View>
            
            <View style={styles.paymentBox}>
              <View style={styles.paymentHeader}>
                <Ionicons name="shield-checkmark" size={32} color="white" />
                <Text style={styles.paymentLabel}>One-Time Fee</Text>
              </View>
              <Text style={styles.paymentAmount}>₹199</Text>
              <View style={styles.paymentFeatures}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#dcfce7" />
                  <Text style={styles.featureText}>Account activation</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#dcfce7" />
                  <Text style={styles.featureText}>Training materials</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#dcfce7" />
                  <Text style={styles.featureText}>Partner kit</Text>
                </View>
              </View>
              <Text style={styles.paymentNote}>Non-refundable registration fee</Text>
            </View>
            
            <TouchableOpacity onPress={handlePayment} style={styles.paymentButton}>
              <Ionicons name="lock-closed" size={20} color="white" />
              <Text style={styles.paymentButtonText}>Proceed to Secure Payment</Text>
            </TouchableOpacity>
          </View>
        )}
              {loading && (
                <View style={styles.loaderOverlay}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={styles.loaderText}>Uploading, please wait...</Text>
                </View>
              )}


        {/* Navigation */}
        <View style={styles.navigation}>
          {step > 1 && (
            <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={20} color="#374151" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < 5 && (
            <TouchableOpacity onPress={nextStep} style={styles.nextBtn}>
              <Text style={styles.nextText}>Continue</Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const DocumentUploadBoxDouble = ({ title, frontFile, backFile, onUploadFront, onUploadBack }) => (
  <View style={styles.docContainer}>
    <Text style={styles.docTitle}>{title}</Text>
    <View style={styles.docRow}>
      {/* Front Side */}
      <TouchableOpacity 
        onPress={onUploadFront} 
        style={[styles.docSide, frontFile && styles.docSideUploaded]}
      >
        {frontFile ? (
          <>
            <Image source={{ uri: frontFile }} style={styles.docImage} />
            <View style={styles.docBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            </View>
          </>
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={28} color="#2563eb" />
            <Text style={styles.docLabel}>Front</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Back Side */}
      <TouchableOpacity 
        onPress={onUploadBack} 
        style={[styles.docSide, backFile && styles.docSideUploaded]}
      >
        {backFile ? (
          <>
            <Image source={{ uri: backFile }} style={styles.docImage} />
            <View style={styles.docBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            </View>
          </>
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={28} color="#2563eb" />
            <Text style={styles.docLabel}>Back</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  </View>
);


const styles = StyleSheet.create({
  fullScreen: { 
    flex: 1, 
    backgroundColor: '#f8fafc',
  },
  container: { 
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 12,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heading: { 
    fontSize: 28, 
    fontWeight: '700', 
    textAlign: 'center', 
    color: '#111827',
    marginBottom: 6,
  },
  subheading: { 
    textAlign: 'center', 
    color: '#6b7280', 
    fontSize: 15,
  },

  docContainer: {
  marginBottom: 20,
},
docTitle: {
  fontSize: 15,
  fontWeight: '600',
  color: '#374151',
  marginBottom: 10,
},
docRow: {
  flexDirection: 'row',
  gap: 12,
},
loaderOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
},
loaderText: {
  marginTop: 10,
  color: "#fff",
  fontSize: 16,
  fontWeight: "500",
},
docSide: {
  flex: 1,
  aspectRatio: 1.4,
  borderWidth: 2,
  borderColor: '#e5e7eb',
  borderStyle: 'dashed',
  borderRadius: 12,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#fafafa',
  position: 'relative',
},
docSideUploaded: {
  borderColor: '#22c55e',
  borderStyle: 'solid',
  backgroundColor: '#f0fdf4',
},
docImage: {
  width: '100%',
  height: '100%',
  borderRadius: 10,
},
docLabel: {
  fontSize: 13,
  color: '#6b7280',
  marginTop: 6,
  fontWeight: '500',
},
docBadge: {
  position: 'absolute',
  top: 6,
  right: 6,
  backgroundColor: 'white',
  borderRadius: 12,
  padding: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
},
  // Modern Stepper
  stepperContainer: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  stepper: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    justifyContent: 'space-between',
  },
  stepWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 6,
  },
  activeStep: { 
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  doneStep: { 
    backgroundColor: '#22c55e',
  },
  inactiveStep: { 
    backgroundColor: '#e5e7eb',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  activeStepNumber: {
    color: '#ffffff',
  },
  stepTitle: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 2,
  },
  activeStepTitle: {
    color: '#2563eb',
    fontWeight: '600',
  },
  stepLine: { 
    position: 'absolute',
    top: 18,
    left: '50%',
    width: '100%',
    height: 2, 
    backgroundColor: '#e5e7eb',
    zIndex: -1,
  },
  doneLine: { 
    backgroundColor: '#22c55e',
  },
  
  // Card Styles
  card: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  cardTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  
  // Input Styles
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: { 
    borderWidth: 1.5, 
    borderColor: '#e5e7eb', 
    borderRadius: 12, 
    padding: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#f9fafb',
    gap: 10,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  ageDisplay: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#dbeafe',
  },
  ageText: {
    fontSize: 15,
    color: '#1e40af',
    fontWeight: '600',
  },
  dropdownInput: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: '#e5e7eb', 
    borderRadius: 12, 
    padding: 14,
    backgroundColor: '#f9fafb',
    gap: 10,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  
  // Video Styles
  videoPlaceholder: { 
    backgroundColor: '#1e3a8a', 
    borderRadius: 16, 
    height: 200, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16,
    overflow: 'hidden',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoText: { 
    color: 'white', 
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  videoSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },
  
  // Checkbox
  checkboxContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
    backgroundColor: '#f0f9ff',
    padding: 14,
    borderRadius: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
  },
  checkboxText: { 
    color: '#1e40af', 
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  
  // Upload Box
  uploadBox: { 
    borderWidth: 2, 
    borderColor: '#e5e7eb', 
    borderStyle: 'dashed', 
    borderRadius: 16, 
    padding: 24, 
    alignItems: 'center', 
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  uploadedBox: { 
    backgroundColor: '#f0fdf4', 
    borderColor: '#22c55e',
    borderStyle: 'solid',
  },
  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadTitle: { 
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 13,
    color: '#6b7280',
  },
  previewImage: { 
    width: 120, 
    height: 120, 
    borderRadius: 12,
    marginBottom: 12,
  },
  uploadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  uploadedText: { 
    color: '#16a34a',
    fontSize: 15,
    fontWeight: '600',
  },
  
  // Payment Box
  paymentBox: { 
    backgroundColor: '#1e3a8a', 
    borderRadius: 16, 
    padding: 24, 
    alignItems: 'center', 
    marginBottom: 16,
  },
  paymentHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 6,
  },
  paymentAmount: { 
    color: 'white', 
    fontSize: 48, 
    fontWeight: '700',
    marginBottom: 16,
  },
  paymentFeatures: {
    width: '100%',
    gap: 10,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: 'white',
    fontSize: 14,
  },
  paymentNote: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  paymentButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#22c55e', 
    borderRadius: 12, 
    paddingVertical: 16,
    gap: 10,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  paymentButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '700',
  },
  
  // Navigation
  navigation: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 12,
    gap: 12,
  },
  backBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f3f4f6', 
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  nextBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#2563eb', 
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
    flex: 2,
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  backText: { 
    color: '#374151', 
    fontWeight: '600',
    fontSize: 15,
  },
  nextText: { 
    color: 'white', 
    fontWeight: '700',
    fontSize: 15,
  },
  
  // Modal
  modalContainer: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'flex-end',
  },
  modalBox: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '700',
    color: '#111827',
  },
  cityItem: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1, 
    borderBottomColor: '#f3f4f6',
    borderRadius: 8,
  },
  selectedCityItem: {
    backgroundColor: '#eff6ff',
  },
  cityText: { 
    fontSize: 16, 
    color: '#374151',
  },
  selectedCityText: {
    color: '#2563eb',
    fontWeight: '600',
  },
});

export default DeliveryPartnerEnrollment;
