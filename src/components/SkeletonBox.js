import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

const SkeletonBox = ({ width, height, borderRadius = theme.radius.sm, style }) => {
  const opacityValue = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 700,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0.35,
          duration: 700,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacityValue]);

  return (
    <Animated.View
      style={[
        styles.box,
        { width, height, borderRadius, opacity: opacityValue },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  box: {
    backgroundColor: theme.colors.surfaceElevated,
  },
});

export default SkeletonBox;
