import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import {name as clientName} from '../../app.json';
import Logo from '../components/common/Logo';

type SplashScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
  const { isLoading } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation<SplashScreenNavigationProp>();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Navigate to Login screen after 3 seconds
      navigation.navigate('Login');
    }, 3000);

    // Clean up the timer if component unmounts
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <View className="items-center">
        <Logo size='3xl'/>
        
        {/* <Text
  className="text-3xl mt-6 font-rubik-semibold mb-2"
  style={{ color: colors.primary }}  
>
  {clientName}
</Text> */}
        {/* <Text className="text-gray-600 font-rubik text-md">Welcome to {clientName} App</Text> */}
        
        {/* {isLoading && (
          <View className="mt-8">
            <Text
            style={{ color: colors.primary }}
             className="text-gray-500 font-rubik">Loading...</Text>
          </View>
        )} */}
      </View>
    </View>
  );
};

export default SplashScreen;