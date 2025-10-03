import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Vibration,
} from 'react-native';
import { router } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import {verifyPhoneOtp} from '../../app/api/auth'
import * as SecureStore from "expo-secure-store";
import { connectRiderSocket } from '../../config/socketConfig';

const { width, height } = Dimensions.get('window');

type OTPVerificationScreenProps = {
  phoneNumber: string;
  onBack: () => void;
};

const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({ 
  phoneNumber, 
  onBack 
}) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>([]);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const loadingRotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const otpInputAnims = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(0))
  ).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered animation for OTP inputs
    const staggeredAnimations = otpInputAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      })
    );

    Animated.stagger(100, staggeredAnimations).start();

    // Timer countdown
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Pulse animation for timer
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      clearInterval(interval);
      pulseAnimation.stop();
    };
  }, []);

  useEffect(() => {
    // Loading rotation animation
    if (isLoading) {
      const rotateAnimation = Animated.loop(
        Animated.timing(loadingRotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      return () => rotateAnimation.stop();
    } else {
      loadingRotateAnim.setValue(0);
    }
  }, [isLoading]);

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value)) && value !== '') return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Input fill animation
    if (value !== '') {
      Animated.spring(otpInputAnims[index], {
        toValue: 1.1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }).start(() => {
        Animated.spring(otpInputAnims[index], {
          toValue: 1,
          tension: 100,
          friction: 7,
          useNativeDriver: true,
        }).start();
      });
    }

    // Auto focus next input
    if (value !== '' && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 100);
    }

    // Auto verify when all digits are filled
    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      setTimeout(() => verifyOTP(newOtp.join('')), 500);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && otp[index] === '' && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

const verifyOTP = async (otpCode: string) => {
  console.log(phoneNumber, "phoneNumber", otpCode);
  try {
    setIsLoading(true);

    const res = await verifyPhoneOtp(phoneNumber, otpCode);
    console.log("✅ OTP verification success:", res);

    const { status, data } = res;
    const rider = data?.deliveryRider;

      if (status === 201 || status === 200) {
        // Save token + verification status
        await SecureStore.setItemAsync("token", data?.token);
        await SecureStore.setItemAsync("isVerified", String(rider?.isVerified ?? false));
        await SecureStore.setItemAsync("deliveryRiderId", String(rider?.id ?? ""));
        await connectRiderSocket(rider?.id);

        Alert.alert(
          "Success 🎉",
          rider?.isVerified ? "Welcome back!" : "Please complete registration."
        );
        // Always redirect to index, let index.tsx decide
        router.replace("/");
      }
  } catch (error: any) {
    console.error("❌ OTP verification failed:", error);
    Alert.alert(
      "OTP verification failed ❌",
      error.response?.data?.message || "Please try again."
    );

    // Error shake animation
    Vibration.vibrate([0, 100, 50, 100]);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 15, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -15, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();

    setOtp(["", "", "", "", "", ""]);
    setTimeout(() => inputRefs.current[0]?.focus(), 500);
  } finally {
    setIsLoading(false);
  }
};


  const handleResendOTP = () => {
    setTimer(30);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    
    // Reset and animate inputs
    otpInputAnims.forEach((anim, index) => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        easing: Easing.out(Easing.back(1.3)),
        useNativeDriver: true,
      }).start();
    });

    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    Alert.alert('OTP Sent! 📱', 'A new verification code has been sent to your phone');
  };

  const formatPhoneNumber = (phone: string) => {
    return `+91 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
  };

  const rotateInterpolation = loadingRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Animated Background Gradient */}
      <LinearGradient 
        colors={['#f1f3faff', '#424242ff', '#2c2b2dff']} 
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >

          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.backButtonGradient}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </LinearGradient>
          </TouchableOpacity>

        {/* Floating Elements */}
        <View style={styles.floatingElements}>
          <Animated.View style={[styles.circle1, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.circle2, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.circle3, { opacity: fadeAnim }]} />
        </View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
                { translateX: shakeAnim }
              ],
            },
          ]}
        >


          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                style={styles.iconGradient}
              >
                <Text style={styles.iconText}>🔐</Text>
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Verify Phone Number</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={styles.phoneNumber}>{formatPhoneNumber(phoneNumber)}</Text>
            </Text>
          </View>

          {/* OTP Input Section */}
          <View style={styles.otpSection}>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.otpInputWrapper,
                    {
                      transform: [
                        { scale: otpInputAnims[index] },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={
                      digit !== ''
                        ? ['rgba(255, 107, 107, 0.2)', 'rgba(255, 142, 83, 0.2)']
                        : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']
                    }
                    style={[
                      styles.otpInputGradient,
                      digit !== '' && styles.otpInputFilled,
                    ]}
                  >
                    <TextInput
                      ref={ref => (inputRefs.current[index] = ref)}
                      style={[
                        styles.otpInput,
                        digit !== '' && styles.otpInputFilledText,
                      ]}
                      value={digit}
                      onChangeText={value => handleOtpChange(value, index)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                      keyboardType="numeric"
                      maxLength={1}
                      textAlign="center"
                      selectTextOnFocus
                      selectionColor="#667eea"
                    />
                  </LinearGradient>
                </Animated.View>
              ))}
            </View>

            {/* Success Check Animation */}
            <Animated.View
              style={[
                styles.successCheck,
                {
                  opacity: successAnim,
                  transform: [{ scale: successAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.successCheckGradient}
              >
                <Text style={styles.successCheckText}>✓</Text>
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Loading Section */}
          {isLoading && (
            <View style={styles.loadingSection}>
              <Animated.View
                style={[
                  styles.loadingSpinner,
                  { transform: [{ rotate: rotateInterpolation }] },
                ]}
              />
              <Text style={styles.verifyingText}>🔍 Verifying your code...</Text>
            </View>
          )}

          {/* Timer and Resend Section */}
          <View style={styles.resendSection}>
            {canResend ? (
              <TouchableOpacity style={styles.resendButton} onPress={handleResendOTP}>
                <LinearGradient
                  colors={['#4F46E5', '#7C3AED']}
                  style={styles.resendButtonGradient}
                >
                  <Text style={styles.resendButtonText}>📱 Resend OTP</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.timerGradient}
                >
                  <Text style={styles.timerText}>⏱️ Resend code in {timer}s</Text>
                </LinearGradient>
              </Animated.View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              🔒 Didn't receive the code? Check your messages or try resending
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  floatingElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: height * 0.15,
    right: -20,
  },
  circle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: height * 0.25,
    left: -10,
  },
  circle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: height * 0.4,
    left: width * 0.8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
backButton: {
  position: 'absolute',
  top: Platform.OS === 'ios' ? 50 : 30, // leave room for status bar
  left: 20,
  zIndex: 10, // keep it above other elements
},
  backButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
    marginTop: 50,

  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconText: {
    fontSize: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  phoneNumber: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  otpSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    width: '100%',
  },
  otpInputWrapper: {
    width: (width - 100) / 6,
  },
  otpInputGradient: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  otpInputFilled: {
    borderColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.3,
  },
  otpInput: {
    height: 60,
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  otpInputFilledText: {
    color: '#FF6B6B',
  },
  successCheck: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
  },
  successCheckGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCheckText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
  },
  loadingSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingSpinner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: '#FFFFFF',
    marginBottom: 15,
  },
  verifyingText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resendButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  resendButtonGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  resendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  timerContainer: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  timerGradient: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});

export default OTPVerificationScreen;