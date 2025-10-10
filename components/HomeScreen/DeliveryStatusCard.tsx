import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const DeliveryStatusCard = ({ isOnline, onGoOnline }) => {
  const renderOfflineContent = () => (
    <View style={styles.contentContainer}>
      {/* <View style={styles.iconContainer}>
        <Text style={styles.offlineIcon}>📱</Text>
      </View> */}
      <Text style={styles.title}>You're Offline</Text>
      <Text style={styles.subtitle}>
        Go online to start receiving delivery orders
      </Text>
      <TouchableOpacity 
        style={styles.actionButton} 
        onPress={onGoOnline}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Go Online</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOnlineContent = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.title}>Looking for Orders</Text>
      <Text style={styles.subtitle}>
        Assigning order soon. Stay nearby for quick pickup!
      </Text>
      <View style={styles.statusIndicator}>
        <View style={styles.pulseContainer}>
          <View style={[styles.pulse, styles.pulse1]} />
          <View style={[styles.pulse, styles.pulse2]} />
          <View style={[styles.pulse, styles.pulse3]} />
        </View>
        <Text style={styles.statusText}>Searching...</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.card, isOnline ? styles.onlineCard : styles.offlineCard]}>
        {isOnline ? renderOnlineContent() : renderOfflineContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 200,
    justifyContent: 'center',
  },
  offlineCard: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  onlineCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: 16,
  },
  offlineIcon: {
    fontSize: 48,
    opacity: 0.6,
  },
  onlineIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    minWidth: 140,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusIndicator: {
    alignItems: 'center',
  },
  pulseContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pulse: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  pulse1: {
    opacity: 1,
  },
  pulse2: {
    opacity: 0.6,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pulse3: {
    opacity: 0.3,
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
});

export default DeliveryStatusCard;