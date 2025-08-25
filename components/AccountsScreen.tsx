import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import OnlineToggle from './OnlineToggle';

const AccountsScreen = ({ isOnline, onToggle }) => {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.accountsContent}>
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>D</Text>
          </View>
          <Text style={styles.profileName}>Delivery Partner</Text>
          <Text style={styles.profileEmail}>partner@delivery.com</Text>
        </View>

        <OnlineToggle 
          isOnline={isOnline} 
          onToggle={onToggle}
          style={styles.accountsToggle}
        />

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>📊 Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>📈 Performance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>🚗 Vehicle Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>📞 Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>⚙️ Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingTop: 80, // Account for top bar
  },
  accountsContent: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileInitial: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
  },
  accountsToggle: {
    alignSelf: 'center',
    marginBottom: 30,
  },
  menuSection: {
    flex: 1,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
});

export default AccountsScreen;