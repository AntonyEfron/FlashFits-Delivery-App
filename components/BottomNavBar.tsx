import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const BottomNavBar = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.bottomNavBar}>
      <TouchableOpacity 
        style={[styles.navItem, activeTab === 'Home' && styles.activeNavItem]}
        onPress={() => onTabChange('Home')}
      >
        <Text style={[styles.navIcon, activeTab === 'Home' && styles.activeNavText]}>🏠</Text>
        <Text style={[styles.navLabel, activeTab === 'Home' && styles.activeNavText]}>Home</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.navItem, activeTab === 'Accounts' && styles.activeNavItem]}
        onPress={() => onTabChange('Accounts')}
      >
        <Text style={[styles.navIcon, activeTab === 'Accounts' && styles.activeNavText]}>👤</Text>
        <Text style={[styles.navLabel, activeTab === 'Accounts' && styles.activeNavText]}>Accounts</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 20,
    paddingTop: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    marginHorizontal: 10,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    color: '#666',
  },
  activeNavText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default BottomNavBar;