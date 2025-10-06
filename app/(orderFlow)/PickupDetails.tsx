import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  sku?: string;
  notes?: string;
}

interface PickupDetailsProps {
  onNext: () => void;
}

const PickupDetails: React.FC<PickupDetailsProps> = ({ onNext }) => {
  const [code, setCode] = useState<string>("");
  const [itemsExpanded, setItemsExpanded] = useState<boolean>(true);
  const [notesExpanded, setNotesExpanded] = useState<boolean>(true);

  // Sample order data - replace with actual props
  const orderData = {
    orderNumber: "ORD-56789",
    customerName: "John Smith",
    customerPhone: "+1 (555) 123-4567",
    pickupAddress: "123 Main Street, Downtown",
    storeName: "Fresh Market Store",
    totalItems: 3,
    Distance: "2.5 Km",
    specialInstructions: "Handle with care - contains fragile items",
    items: [
      { id: "1", name: "Fresh Organic Tomatoes", quantity: 2, sku: "VEG-001", notes: "Red, ripe" },
      { id: "2", name: "Whole Grain Bread", quantity: 1, sku: "BAK-045" },
      { id: "3", name: "Glass Bottle Milk", quantity: 3, sku: "DAI-012", notes: "Keep upright" }
    ]
  };

  const toggleItems = () => setItemsExpanded(!itemsExpanded);
  const toggleNotes = () => setNotesExpanded(!notesExpanded);

  return (
    // <SafeAreaView>
    <ScrollView contentContainerStyle={{ flexGrow: 1}}>
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>READY FOR PICKUP</Text>
          </View>
          <Text style={styles.orderNumber}>{orderData.orderNumber}</Text>
        </View>

        {/* Store Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Pickup Location</Text>
          <Text style={styles.storeName}>{orderData.storeName}</Text>
          <Text style={styles.address}>{orderData.pickupAddress}</Text>
        </View>

        
                {/* Verification Code Input */}
        <View style={styles.verificationCard}>
          <Text style={styles.verificationTitle}>🔐 Ask for the Verification Pin</Text>
          <Text style={styles.verificationSubtext}>Enter the pickup code provided by the store</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 4-digit code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>

                {/* Action Buttons */}
      <TouchableOpacity 
        style={[
          styles.button, 
          styles.primaryButton, 
          code.length !== 4 && styles.buttonDisabled
        ]} 
        onPress={onNext}
        disabled={code.length !== 4} // disabled unless 6 digits are entered
      >
        <Text style={styles.buttonText}>✓ Verify & Confirm Pickup</Text>
      </TouchableOpacity>

        
        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦 Order Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{orderData.totalItems}</Text>
              <Text style={styles.summaryLabel}>Total Items</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{orderData.Distance}</Text>
              <Text style={styles.summaryLabel}>Est. Distance</Text>
            </View>
          </View>
        </View> 

        {/* Items List - Expandable */}
        <TouchableOpacity style={styles.card} onPress={toggleItems} activeOpacity={0.7}>
          <View style={styles.expandHeader}>
            <Text style={styles.cardTitle}>📋 Items to Pickup</Text>
            <Text style={styles.expandIcon}>{itemsExpanded ? '▼' : '▶'}</Text>
          </View>
          
          {itemsExpanded && (
            <View style={styles.expandedContent}>
              {orderData.items.map((item, index) => (
                <View key={item.id} style={[styles.itemRow, index !== orderData.items.length - 1 && styles.itemBorder]}>
                  <View style={styles.itemQuantity}>
                    <Text style={styles.quantityText}>{item.quantity}x</Text>
  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.sku && <Text style={styles.itemSku}>SKU: {item.sku}</Text>}
                    {item.notes && <Text style={styles.itemNotes}>Note: {item.notes}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>


        {/* Customer Information */}
        {/* <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Customer Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{orderData.customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone:</Text>
            <TouchableOpacity>
              <Text style={[styles.value, styles.phoneLink]}>{orderData.customerPhone}</Text>
            </TouchableOpacity>
          </View>
        </View> */}


        {/* Special Instructions - Expandable */}
        {orderData.specialInstructions && (
          <TouchableOpacity style={styles.card} onPress={toggleNotes} activeOpacity={0.7}>
            <View style={styles.expandHeader}>
              <Text style={styles.cardTitle}>⚠️ Special Instructions</Text>
              <Text style={styles.expandIcon}>{notesExpanded ? '▼' : '▶'}</Text>
            </View>
            
            {notesExpanded && (
              <View style={styles.expandedContent}>
                <Text style={styles.instructionsText}>{orderData.specialInstructions}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacing} />
      </View>
      {/* <View style={{ height: 230 }} /> */}
    </ScrollView>
    // </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  orderNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  phoneLink: {
    color: '#3b82f6',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  expandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandIcon: {
    fontSize: 16,
    color: '#9ca3af',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemQuantity: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quantityText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  itemSku: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  itemNotes: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  instructionsText: {
    fontSize: 14,
    color: '#dc2626',
    lineHeight: 20,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
  },
  verificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  verificationSubtext: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 16,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 4,
    backgroundColor: '#f9fafb',
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 17,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default PickupDetails;