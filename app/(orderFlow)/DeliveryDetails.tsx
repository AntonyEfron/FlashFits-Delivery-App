import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AnimatedDots } from '../../components/OrderFlowComponents/AnimatedDots';

const MOCK_ORDER = {
  orderId: 'ORD-2024-001',
  customerName: 'John Doe',
  customerPhone: '+91 9876543210',
  address: '221B Baker Street, Sector 5, Bangalore',
  items: [
    { id: 1, name: 'Blue Cotton Shirt', qty: 1, image: '👕' },
    { id: 2, name: 'Black Formal Pants', qty: 1, image: '👖' },
    { id: 3, name: 'Leather Belt', qty: 1, image: '👔' },
  ],
  totalAmount: 2697,
  tryDuration: 600, // seconds (10 minutes)
  baseEarnings: 8, // ₹5 initial
  earningsAfter10Min: 1, // ₹1 per minute after 10 minutes
};

type DeliveryStatus = 'pending' | 'trying';

// Animated Earnings Circle Component
const AnimatedEarningsCircle = ({ earnings }: { earnings: number }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Main scale animation
    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Pulse animation for the outer ring
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    scaleAnimation.start();
    pulseAnimation.start();

    return () => {
      scaleAnimation.stop();
      pulseAnimation.stop();
    };
  }, []);

  return (
    <View style={styles.earningsCircleContainer}>
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: pulseAnim.interpolate({
              inputRange: [1, 1.3],
              outputRange: [0.4, 0],
            }),
          },
        ]}
      />
      
      <Animated.View
        style={[
          styles.earningsCircle,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <MaterialCommunityIcons name="currency-inr" size={20} color="#fff" />
        <Text style={styles.earningsCircleAmount}>{earnings}</Text>
        <Text style={styles.earningsCircleLabel}>Earned</Text>
      </Animated.View>
    </View>
  );
};

const DeliveryDetails = ({
  onNext,
}: {
  onNext: (route: 'earnings' | 'returnVerification') => void;
}) => {
  const [status, setStatus] = useState<DeliveryStatus>('pending');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    if (status !== 'trying') return;
    
    setEarnings(MOCK_ORDER.baseEarnings);
    
    const timer = setInterval(() => {
      setTimeElapsed((prev) => {
        if (prev + 1 >= MOCK_ORDER.tryDuration) {
          clearInterval(timer);
          handleTryPeriodEnd();
          return MOCK_ORDER.tryDuration;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

useEffect(() => {
  if (status === 'trying') {
    const minutes = Math.floor(timeElapsed / 60);
    let calculatedEarnings = MOCK_ORDER.baseEarnings;

    if (minutes >= 10) {
      const extraMinutes = minutes - 9; // start counting from 10th minute
      calculatedEarnings += extraMinutes * MOCK_ORDER.earningsAfter10Min;
    }

    setEarnings(calculatedEarnings);
  }
}, [timeElapsed, status]);

  const handleTryPeriodEnd = () => {
    Alert.alert('Customer Decision', 'Did the customer buy all the clothes?', [
      { text: 'Yes, all bought', onPress: () => onNext('earnings') },
      { text: 'No, some returned', onPress: () => onNext('returnVerification') },
    ]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleHandover = () => setStatus('trying');

  const handleCall = () => Alert.alert('Call Customer', `Calling ${MOCK_ORDER.customerPhone}`);
  const handleMap = () => Alert.alert('Navigation', 'Opening Google Maps...');

  /** PENDING STATE */
  if (status === 'pending') {
    return (
      <ScrollView style={styles.containerBlue}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Deliver Order</Text>
            <View style={styles.badgeBlue}>
              <Text style={styles.badgeTextBlue}>Try & Buy</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Info label="Order ID" value={MOCK_ORDER.orderId} />
            <Info label="Customer Name" value={MOCK_ORDER.customerName} />
            <Info label="Delivery Address" value={MOCK_ORDER.address} />

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Items ({MOCK_ORDER.items.length})</Text>
              {MOCK_ORDER.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemText}>{item.image} {item.name}</Text>
                  <Text style={styles.itemPrice}>× {item.qty}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.buttonRow}>
            <ActionButton color="#22c55e" icon="call" text="Call Customer" onPress={handleCall} />
            <ActionButton color="#3b82f6" icon="map" text="Open Map" onPress={handleMap} />
          </View>
   
          <TouchableOpacity style={styles.primaryButton} onPress={handleHandover}>
            <MaterialCommunityIcons name="package-variant" size={22} color="#fff" />
            <View style={styles.textContainer}>
              <Text style={styles.primaryButtonText}>Handover Package (Start Try Period)</Text>
              <Text style={styles.primaryButtonText1}>Earn while you wait</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  /** TRYING STATE */
  if (status === 'trying') {
    const progress = (timeElapsed / MOCK_ORDER.tryDuration) * 100;

    return (
      <ScrollView style={styles.containerAmber} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.centerContent}>
            <View style={styles.iconCircleAmber}>
              <Ionicons name="time" size={48} color="#d97706" />
            </View>
            <Text style={styles.headerTitle}>Try Period Active</Text>
            <Text style={styles.subtitle}>Customer is trying the products</Text>
          </View>

          <View style={styles.timerCard}>
            <View style={styles.earningsCircleSmallContainer}>
              <AnimatedEarningsCircle earnings={earnings} />
            </View>

            <View style={styles.timerIconRow}>
              <Ionicons name="hourglass-outline" size={24} color="#fff" />
              <Text style={styles.timerLabel}>Time Elapsed</Text>
            </View>
            <Text style={styles.timerValue}>{formatTime(timeElapsed)}</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.timerSubtext}>
              {Math.floor(MOCK_ORDER.tryDuration / 60 - timeElapsed / 60)} minutes remaining
            </Text>
          <Text style={styles.timerSubtext}>
            Earn <MaterialCommunityIcons name="currency-inr" size={10} color="#fff" />1 for every minute after 10 minutes
          </Text>
          </View>

          <View style={styles.itemsBeingTriedCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="package-variant" size={20} color="#1e3a8a" />
              <Text style={styles.cardHeaderText}>Items Being Tried</Text>
            </View>
            {MOCK_ORDER.items.map((item) => (
              <View key={item.id} style={styles.itemRowSmall}>
                <Text style={styles.itemTextSmall}>{item.image} {item.name}</Text>
                <Text style={styles.itemPriceSmall}>× {item.qty}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.buttonGreenLarge} onPress={handleTryPeriodEnd}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.primaryButtonText}>Waiting for the return</Text>
              <AnimatedDots />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return null;
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoCard}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const ActionButton = ({
  color,
  icon,
  text,
  onPress,
}: {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
    <Ionicons name={icon} size={20} color="#fff" />
    <Text style={styles.buttonText}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  containerBlue: {
    flex: 1,
    backgroundColor: '#dbeafe',
  },
  containerAmber: {
    flex: 1,
    backgroundColor: '#fef3c7',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: 'white',
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  badgeBlue: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeTextBlue: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemText: {
    fontSize: 16,
    color: '#374151',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 70,
    gap: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  textContainer: {
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    gap: 10,
  },
  centerContent: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircleAmber: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonGreenLarge: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText1: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  // Earnings Circle Styles
  earningsCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#16a34a',
  },
  earningsCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#fff',
  },
  earningsCircleAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  earningsCircleLabel: {
    fontSize: 9,
    color: '#fff',
    opacity: 0.9,
    fontWeight: '600',
  },
  earningsCircleSmallContainer: {
    position: 'absolute',
    top: -20,
    right: -10,
    zIndex: 10,
  },
  // Enhanced Timer Card
  timerCard: {
    backgroundColor: '#f59e0b',
    borderRadius: 16,
    padding: 28,
    marginBottom: 32,
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'visible',
  },
  timerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  timerLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.95,
  },
  timerValue: {
    color: 'white',
    fontSize: 56,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 2,
  },
  timerSubtext: {
    color: 'white',
    fontSize: 12,
    opacity: 0.85,
    marginTop: 12,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  itemsBeingTriedCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  itemRowSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTextSmall: {
    fontSize: 14,
    color: '#374151',
  },
  itemPriceSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
});

export default DeliveryDetails;