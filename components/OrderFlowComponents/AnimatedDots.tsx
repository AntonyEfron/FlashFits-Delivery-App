import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View, StyleSheet } from 'react-native';

export const AnimatedDots = () => {
  const dot1Opacity = useRef(new Animated.Value(0)).current;
  const dot2Opacity = useRef(new Animated.Value(0)).current;
  const dot3Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dotOpacity, delay) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
    };

    const loopAnimation = Animated.loop(
      Animated.parallel([
        animateDot(dot1Opacity, 0),
        animateDot(dot2Opacity, 300),
        animateDot(dot3Opacity, 600),
      ])
    );

    loopAnimation.start();

    return () => loopAnimation.stop();
  }, []);

  return (
    <View style={{ flexDirection: 'row', marginLeft: 4 }}>
      <Animated.Text style={[styles.dot, { opacity: dot1Opacity }]}>
        •
      </Animated.Text>
      <Animated.Text style={[styles.dot, { opacity: dot2Opacity }]}>
        •
      </Animated.Text>
      <Animated.Text style={[styles.dot, { opacity: dot3Opacity }]}>
        •
      </Animated.Text>
    </View>
  );
};



const styles = StyleSheet.create({
  buttonGreenLarge: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    // your existing text styles
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dot: {
    color: '#fff',
    fontSize: 20,
    marginHorizontal: 2,
  },
});