import React, { useRef, useEffect } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import Colors from '../../assets/theme/Colors';

interface Props {
  focused: boolean;
  iconName: string;
  label: string;
  size: number;
  color: string;
}

const AnimatedTabIcon: React.FC<Props> = ({ focused, iconName, label, size, color }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.2 : 1,
        useNativeDriver: false,
      }),
      Animated.timing(bgAnim, {
        toValue: focused ? 1 : 0,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
  }, [focused]);

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', 'black'],
  });

  return (
    <Animated.View
      style={{
        backgroundColor,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        width: 55,
        height: 55,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Ionicons name={iconName} size={focused ? 28 : 21} color={color} />
      <Text
        style={{
          fontSize: focused ? 10 : 8,
          marginTop: 2,
          color: focused ? 'black' : 'black',
          fontWeight: focused ? 'bold' : 'normal',
          fontFamily: 'Oswald-Regular',
        }}
      >
        {label}
      </Text>
    </Animated.View>
  );
};

export default AnimatedTabIcon;
