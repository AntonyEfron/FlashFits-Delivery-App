import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import AnimatedTabIcon from '../components/AnimatedTabIcon';
// import Colors from '../../assets/theme/Colors';

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    height: Platform.OS === 'ios' ? 70 : 70,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 18,
    paddingTop: Platform.OS === 'ios' ? 18 : 10,
  },
});

function TabsWithCart() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: 'black',
        tabBarInactiveTintColor: 'black',
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = 'home-outline';
          let label = 'Home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
            label = 'Home';
          } else if (route.name === 'Earnings') {
            iconName = focused ? 'cash' : 'cash-outline';
            label = 'Earnings';
          } else if (route.name === 'More') {
            iconName = focused ? 'menu' : 'menu-outline';
            label = 'More';
          }

          return <AnimatedTabIcon focused={focused} iconName={iconName} size={size} color={color} label={label} />;
        },
      })}
    >
      <Tabs.Screen name="Home" options={{ title: 'Home' }} />
      <Tabs.Screen name="Earnings" options={{ title: 'Earnings' }} />
      <Tabs.Screen name="More" options={{ title: 'More' }} />
    </Tabs>
  );
}

export default function TabLayout() {
  return <TabsWithCart />;
}
