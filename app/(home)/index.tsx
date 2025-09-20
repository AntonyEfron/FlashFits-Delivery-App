import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import NavBarHomeScreen from '@/components/HomeScreen/NavBarHomeScreen';
import DeliveryStatusCard from '@/components/HomeScreen/DeliveryStatusCard';
import DailyProgressCard from '@/components/HomeScreen/DailyProgressCard';

export default function HomeScreen() {
  const [isOnline, setIsOnline] = useState(false);

  const handleToggleOnline = (status) => {
    setIsOnline(status);
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