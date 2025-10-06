import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import NavBarHomeScreen from '@/components/HomeScreen/NavBarHomeScreen';
import DeliveryStatusCard from '@/components/HomeScreen/DeliveryStatusCard';
import DailyProgressCard from '@/components/HomeScreen/DailyProgressCard';
import { connectRiderSocket, disconnectRiderSocket } from '../../config/socketConfig';
import startLocationTracking from '@/utils/updateLocation';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

export default function HomeScreen() {
  const [riderId, setRiderId] = useState(null);
  useEffect(() => {
    const fetchRiderId = async () => {
      const id = await SecureStore.getItemAsync("deliveryRiderId");
      console.log(id, "id");
      
      setRiderId(id);
    };
    fetchRiderId();
  }, []);
  const [isOnline, setIsOnline] = useState(false);

  const handleToggleOnline = async (status) => {
    setIsOnline(status);

    if (status) {
      // Ensure GPS is ON before tracking
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== "granted") {
        Alert.alert("Permission denied", "You must allow location access to go online.");
        setIsOnline(false);
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          "Location Services Off",
          "Please turn on GPS to continue using the app.",
          [{ text: "Open Settings", onPress: () => Linking.openSettings() }]
        );
        setIsOnline(false);
        return;
      }

      if (riderId) {
        console.log("workinggg");
        
        connectRiderSocket(riderId);
        startLocationTracking(riderId); // starts background location tracking
      }
    } else {
      disconnectRiderSocket();
    }
  };

  const handleGoOnline = () => {
    setIsOnline(true);
  };

  return (
    <>
      <NavBarHomeScreen 
        isOnline={isOnline} 
        onToggleOnline={handleToggleOnline} 
      />
      <ScrollView 
        style={styles.scrollContent} 
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false} // optional
      >
        <DeliveryStatusCard 
          isOnline={isOnline} 
          onGoOnline={handleGoOnline} 
        />
        
        <DailyProgressCard />

        {/* add more cards/components below */}
      </ScrollView>
      </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 16,
    paddingBottom: 32,
  },
});