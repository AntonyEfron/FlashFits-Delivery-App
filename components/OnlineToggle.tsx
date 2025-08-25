import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const OnlineToggle = ({ isOnline, onToggle, style }) => {
  return (
    <TouchableOpacity 
      style={[styles.toggleContainer, style]} 
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={[
        styles.toggleSwitch, 
        { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }
      ]}>
        <View style={[
          styles.toggleCircle,
          { transform: [{ translateX: isOnline ? 20 : 2 }] }
        ]} />
      </View>
      <Text style={[styles.toggleText, { color: isOnline ? '#4CAF50' : '#F44336' }]}>
        {isOnline ? 'Online' : 'Offline'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    position: 'absolute',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OnlineToggle;