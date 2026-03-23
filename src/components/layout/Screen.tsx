import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}

export const Screen = ({ children, style,  }: ScreenProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container, 
      { 
        paddingTop: insets.top, 
        backgroundColor:'#fff'
 
      }, 
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});