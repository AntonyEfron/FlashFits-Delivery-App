import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';

const DeliveryNavbar = ({ isOnline = false, onToggleOnline }) => {
  const translateX = useRef(new Animated.Value(isOnline ? 0 : 60)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: isOnline ? 60 : 0, // Online → left, Offline → right
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  const toggleOnlineStatus = (value: boolean) => {
    if (onToggleOnline) {
      onToggleOnline(value);
    }
    console.log(`Status changed to: ${value ? 'Online' : 'Offline'}`);
  };

  const handleHelp = () => {
    Alert.alert('Help', 'Help center will be opened here');
  };

const handleProfile = () => {
  router.push('/(profile)');
};

  return (
    <View style={styles.navbar}>
      {/* Left Section - Online/Offline Toggle */}
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={[
            styles.toggleContainer,
            { backgroundColor: isOnline ? '#22c55e' : '#babcc0ff' },
          ]}
          onPress={() => toggleOnlineStatus(!isOnline)}
          activeOpacity={0.9}
        >
          {/* Status Text outside the thumb */}
          <View
            style={[
              styles.textWrapper,
              isOnline ? styles.textLeft  : styles.textRight,
            ]}
          >
            <Text style={styles.toggleText}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>

          {/* Animated thumb */}
          <Animated.View
            style={[
              styles.toggleThumb,
              { transform: [{ translateX }] },
            ]}
          />
        </TouchableOpacity>
      </View>

      {/* Right Section - Action Icons */}
      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.iconButton} onPress={handleHelp}>
          <View style={styles.iconContainer}>
            <Text style={styles.alertIcon}>⚠️</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => Alert.alert('Location', 'Location settings')}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.locationIcon}>📍</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={handleProfile}>
          <View style={styles.iconContainer}>
            <Text style={styles.profileIcon}>👤</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#6b7280',
    paddingHorizontal: 20,
    paddingVertical: 12,
    // paddingTop: 50,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  toggleContainer: {
    width: 100,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: 4,
  },
  toggleThumb: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    top: 4,
    left: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  textWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  textLeft: {
    left: 12,
  },
  textRight: {
    right: 12,
  },
  toggleText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#fff',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertIcon: { fontSize: 20 },
  locationIcon: { fontSize: 18 },
  profileIcon: { fontSize: 20 },
});

export default DeliveryNavbar;
