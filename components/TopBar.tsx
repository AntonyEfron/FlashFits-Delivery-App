import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnlineToggle from './OnlineToggle';

type TopBarProps = {
  isOnline: boolean;
  onToggle: () => void;
  isTransparent?: boolean;
};

const TopBar: React.FC<TopBarProps> = ({ isOnline, onToggle, isTransparent = false }) => {
  return (
    <View
      style={[
        styles.topBar,
        { backgroundColor: isTransparent ? 'transparent' : '#ffffff' }
      ]}
    >
      <SafeAreaView style={styles.topBarContent}>
        <OnlineToggle
          isOnline={isOnline}
          onToggle={onToggle}
          style={styles.topBarToggle as ViewStyle}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 20,
  },
  topBarContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topBarToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});

export default TopBar;
