import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Import all components
import TopBar from './components/TopBar';
import HomeScreen from './components/HomeScreen';
import AccountsScreen from './components/AccountsScreen';
import BottomNavBar from './components/BottomNavBar';

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [isOnline, setIsOnline] = useState(false);

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const renderCurrentScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen isOnline={isOnline} onToggle={handleToggleOnline} />;
      case 'Accounts':
        return <AccountsScreen isOnline={isOnline} onToggle={handleToggleOnline} />;
      default:
        return <HomeScreen isOnline={isOnline} onToggle={handleToggleOnline} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />
      
      {/* Top Bar - Transparent only on Home screen */}
      <TopBar 
        isOnline={isOnline} 
        onToggle={handleToggleOnline}
        isTransparent={activeTab === 'Home'}
      />
      
      {/* Current Screen */}
      {renderCurrentScreen()}
      
      {/* Bottom Navigation */}
      <BottomNavBar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});