import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

// Mock data - replace with actual data from your backend
const MOCK_ORDER = {
  orderId: 'ORD-2024-001',
  customerName: 'John Doe',
  customerPhone: '+91 9876543210',
  address: '221B Baker Street, Sector 5, Bangalore',
  items: [
    { id: 1, name: 'Blue Cotton Shirt', price: 899, image: '👕' },
    { id: 2, name: 'Black Formal Pants', price: 1299, image: '👖' },
    { id: 3, name: 'Leather Belt', price: 499, image: '👔' },
  ],
  totalAmount: 2697,
  tryDuration: 600, // 10 minutes in seconds
};

type DeliveryStatus = 'pending' | 'trying' | 'selecting' | 'returning' | 'completed';

const DeliveryDetails = () => {
  const [status, setStatus] = useState<DeliveryStatus>('pending');
  const [timeRemaining, setTimeRemaining] = useState(MOCK_ORDER.tryDuration);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [returnItems, setReturnItems] = useState<number[]>([]);

  // Timer for try phase
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === 'trying' && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setStatus('selecting');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [status, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleHandover = () => {
    setStatus('trying');
  };

  const handleCall = () => {
    Alert.alert('Call Customer', `Calling ${MOCK_ORDER.customerPhone}`);
  };

  const handleMap = () => {
    Alert.alert('Navigation', 'Opening Google Maps...');
  };

  const toggleItemSelection = (itemId: number) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleProceedToPayment = () => {
    if (selectedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to purchase');
      return;
    }

    const unselectedItems = MOCK_ORDER.items
      .filter(item => !selectedItems.includes(item.id))
      .map(item => item.id);

    if (unselectedItems.length > 0) {
      setReturnItems(unselectedItems);
      setStatus('returning');
    } else {
      setStatus('completed');
    }
  };

  const handleReturnConfirmed = () => {
    setStatus('completed');
  };

  const calculateTotal = () => {
    return MOCK_ORDER.items
      .filter(item => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
  };

  // Pending/Delivery Screen
  if (status === 'pending') {
    return (
      <ScrollView style={styles.containerBlue} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Deliver Order</Text>
            <View style={styles.badgeBlue}>
              <Text style={styles.badgeTextBlue}>Try & Buy</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Order ID</Text>
              <Text style={styles.infoValue}>{MOCK_ORDER.orderId}</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Customer Name</Text>
              <Text style={styles.infoValue}>{MOCK_ORDER.customerName}</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Delivery Address</Text>
              <Text style={styles.infoText}>{MOCK_ORDER.address}</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Items ({MOCK_ORDER.items.length})</Text>
              <View style={styles.itemsList}>
                {MOCK_ORDER.items.map(item => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemText}>
                      {item.image} {item.name}
                    </Text>
                    <Text style={styles.itemPrice}>₹{item.price}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>₹{MOCK_ORDER.totalAmount}</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.buttonGreen} onPress={handleCall}>
              <Ionicons name="call" size={20} color="white" />
              <Text style={styles.buttonText}>Call Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonBlue} onPress={handleMap}>
              <Ionicons name="map" size={20} color="white" />
              <Text style={styles.buttonText}>Open Map</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleHandover}>
            <MaterialCommunityIcons name="package-variant" size={24} color="white" />
            <Text style={styles.primaryButtonText}>Handover Package (Start Try Period)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Trying Phase Screen
  if (status === 'trying') {
    const percentage = (timeRemaining / MOCK_ORDER.tryDuration) * 100;
    
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
            <Text style={styles.timerLabel}>Time Remaining</Text>
            <Text style={styles.timerValue}>{formatTime(timeRemaining)}</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBar, { width: `${percentage}%` }]} />
            </View>
          </View>

          <View style={styles.itemsBeingTriedCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="package-variant" size={20} color="#1e3a8a" />
              <Text style={styles.cardHeaderText}>Items Being Tried</Text>
            </View>
            <View style={styles.itemsList}>
              {MOCK_ORDER.items.map(item => (
                <View key={item.id} style={styles.itemRowSmall}>
                  <Text style={styles.itemTextSmall}>
                    {item.image} {item.name}
                  </Text>
                  <Text style={styles.itemPriceSmall}>₹{item.price}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={styles.buttonGreenLarge} 
            onPress={() => setStatus('selecting')}
          >
            <Text style={styles.primaryButtonText}>Customer Ready to Select Items</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Item Selection Screen
  if (status === 'selecting') {
    return (
      <ScrollView style={styles.containerPurple} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.headerTitle}>Select Items to Purchase</Text>
          <Text style={styles.subtitle}>Tap on items the customer wants to buy</Text>

          <View style={styles.section}>
            {MOCK_ORDER.items.map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => toggleItemSelection(item.id)}
                style={[
                  styles.selectableItem,
                  selectedItems.includes(item.id) && styles.selectedItem
                ]}
              >
                <View style={styles.itemContent}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemEmoji}>{item.image}</Text>
                    <View>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPriceLarge}>₹{item.price}</Text>
                    </View>
                  </View>
                  <View>
                    {selectedItems.includes(item.id) ? (
                      <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
                    ) : (
                      <View style={styles.uncheckedCircle} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {selectedItems.length > 0 && (
            <View style={styles.summaryCard}>
              <View>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryAmount}>₹{calculateTotal()}</Text>
                <Text style={styles.summarySubtext}>
                  {selectedItems.length} of {MOCK_ORDER.items.length} items selected
                </Text>
              </View>
              <MaterialIcons name="attach-money" size={48} color="rgba(255,255,255,0.8)" />
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.primaryButtonPurple,
              selectedItems.length === 0 && styles.disabledButton
            ]}
            onPress={handleProceedToPayment}
            disabled={selectedItems.length === 0}
          >
            <Text style={[
              styles.primaryButtonText,
              selectedItems.length === 0 && styles.disabledButtonText
            ]}>
              Proceed to Payment
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Return Items Screen
  if (status === 'returning') {
    const returnItemsList = MOCK_ORDER.items.filter(item => returnItems.includes(item.id));
    
    return (
      <ScrollView style={styles.containerRed} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.centerContent}>
            <View style={styles.iconCircleRed}>
              <Ionicons name="close-circle" size={48} color="#dc2626" />
            </View>
            <Text style={styles.headerTitle}>Return Items</Text>
            <Text style={styles.subtitle}>Collect the following items from customer</Text>
          </View>

          <View style={styles.returnCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="package-variant" size={20} color="#7f1d1d" />
              <Text style={styles.cardHeaderTextRed}>Items to Return ({returnItemsList.length})</Text>
            </View>
            <View style={styles.returnItemsList}>
              {returnItemsList.map(item => (
                <View key={item.id} style={styles.returnItemCard}>
                  <View style={styles.returnItemContent}>
                    <Text style={styles.returnItemEmoji}>{item.image}</Text>
                    <View>
                      <Text style={styles.returnItemName}>{item.name}</Text>
                      <Text style={styles.returnItemPrice}>₹{item.price}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.purchasedCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#14532d" />
              <Text style={styles.cardHeaderTextGreen}>Purchased Items ({selectedItems.length})</Text>
            </View>
            <View style={styles.itemsList}>
              {MOCK_ORDER.items
                .filter(item => selectedItems.includes(item.id))
                .map(item => (
                  <View key={item.id} style={styles.itemRowSmall}>
                    <Text style={styles.itemTextSmall}>
                      {item.image} {item.name}
                    </Text>
                    <Text style={styles.itemPriceSmall}>₹{item.price}</Text>
                  </View>
                ))}
              <View style={styles.totalDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalRowLabel}>Total Paid</Text>
                <Text style={styles.totalRowAmount}>₹{calculateTotal()}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.buttonGreenLarge} onPress={handleReturnConfirmed}>
            <Text style={styles.primaryButtonText}>Confirm Return & Complete Delivery</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Completion/Earnings Screen
  if (status === 'completed') {
    const earnings = calculateTotal() * 0.1;
    
    return (
      <ScrollView style={styles.containerGreen} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.centerContent}>
            <View style={styles.iconCircleGreen}>
              <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
            </View>
            <Text style={styles.headerTitle}>Delivery Completed!</Text>
            <Text style={styles.subtitle}>Great job on completing this delivery</Text>
          </View>

          <View style={styles.earningsCard}>
            <Text style={styles.earningsLabel}>Your Earnings</Text>
            <Text style={styles.earningsAmount}>₹{earnings.toFixed(2)}</Text>
            <Text style={styles.earningsSubtext}>From this delivery</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Order ID</Text>
              <Text style={styles.infoValue}>{MOCK_ORDER.orderId}</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Items Purchased</Text>
                <Text style={styles.summaryRowValue}>{selectedItems.length}</Text>
              </View>
              {returnItems.length > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Items Returned</Text>
                  <Text style={styles.summaryRowValue}>{returnItems.length}</Text>
                </View>
              )}
            </View>

            <View style={styles.paymentSummaryCard}>
              <Text style={styles.paymentLabel}>Payment Summary</Text>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentRowLabel}>Total Collected</Text>
                <Text style={styles.paymentAmount}>₹{calculateTotal()}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              setStatus('pending');
              setTimeRemaining(MOCK_ORDER.tryDuration);
              setSelectedItems([]);
              setReturnItems([]);
            }}
          >
            <Text style={styles.primaryButtonText}>Next Delivery</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  containerBlue: {
    flex: 1,
    backgroundColor: '#dbeafe',
  },
  containerAmber: {
    flex: 1,
    backgroundColor: '#fef3c7',
  },
  containerPurple: {
    flex: 1,
    backgroundColor: '#fae8ff',
  },
  containerRed: {
    flex: 1,
    backgroundColor: '#fee2e2',
  },
  containerGreen: {
    flex: 1,
    backgroundColor: '#d1fae5',
  },
  // scrollContent: {
  //   padding: 24,
  // },
  card: {
    backgroundColor: 'white',
    // borderRadius: 16,
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
  infoText: {
    fontSize: 16,
    color: '#374151',
  },
  itemsList: {
    marginTop: 8,
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
  totalCard: {
    backgroundColor: '#eef2ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#c7d2fe',
  },
  totalLabel: {
    fontSize: 12,
    color: '#4f46e5',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4338ca',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  buttonGreen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  buttonBlue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
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
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  iconCircleRed: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconCircleGreen: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timerCard: {
    backgroundColor: '#f59e0b',
    borderRadius: 16,
    padding: 32,
    marginBottom: 32,
    alignItems: 'center',
  },
  timerLabel: {
    color: 'white',
    fontSize: 12,
    marginBottom: 8,
    opacity: 0.9,
  },
  timerValue: {
    color: 'white',
    fontSize: 64,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressBarBg: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 6,
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
  cardHeaderTextRed: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f1d1d',
  },
  cardHeaderTextGreen: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14532d',
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
  buttonGreenLarge: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectableItem: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    marginBottom: 16,
  },
  selectedItem: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  itemEmoji: {
    fontSize: 36,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemPriceLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  uncheckedCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  summaryCard: {
    backgroundColor: '#a855f7',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9,
    marginBottom: 4,
  },
  summaryAmount: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  summarySubtext: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 8,
  },
  primaryButtonPurple: {
    backgroundColor: '#a855f7',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
  },
  disabledButtonText: {
    color: '#6b7280',
  },
  returnCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
  },
  returnItemsList: {
    marginTop: 16,
  },
  returnItemCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 12,
  },
  returnItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  returnItemEmoji: {
    fontSize: 32,
  },
  returnItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  returnItemPrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  purchasedCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
  },
  totalDivider: {
    height: 2,
    backgroundColor: '#86efac',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalRowLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14532d',
  },
  totalRowAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#15803d',
  },
  earningsCard: {
    backgroundColor: '#16a34a',
    borderRadius: 16,
    padding: 32,
    marginBottom: 32,
    alignItems: 'center',
  },
  earningsLabel: {
    color: 'white',
    fontSize: 12,
    marginBottom: 8,
    opacity: 0.9,
  },
  earningsAmount: {
    color: 'white',
    fontSize: 56,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  earningsSubtext: {
    color: 'white',
    fontSize: 12,
    opacity: 0.75,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  summaryRowLabel: {
    fontSize: 16,
    color: '#374151',
  },
  summaryRowValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  paymentSummaryCard: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  paymentLabel: {
    fontSize: 12,
    color: '#15803d',
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentRowLabel: {
    fontSize: 16,
    color: '#374151',
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#15803d',
  },
});

export default DeliveryDetails;