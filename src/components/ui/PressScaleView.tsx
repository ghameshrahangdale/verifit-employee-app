// components/common/PressScaleView.tsx

import React, { useRef } from 'react';
import { TouchableOpacity, Animated } from 'react-native';

interface PressScaleViewProps {
  onPress: () => void;
  children: React.ReactNode;
  scaleIn?: number;
  scaleOut?: number;
}

const PressScaleView: React.FC<PressScaleViewProps> = ({
  onPress,
  children,
  scaleIn = 0.88,
  scaleOut = 1,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  
  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: scaleIn,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  
  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: scaleOut,
      useNativeDriver: true,
      damping: 12,
      stiffness: 250,
    }).start();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default PressScaleView;