// App.tsx
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // MUST be at the root
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { StatusBar, View } from 'react-native';
import './global.css';
import { store } from './src/store/store';
import Navigation from './src/navigation/Navigation';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/ui/toast';

const linking = {
  prefixes: ['verifiit://', 'https://verifiit-nextjs.vercel.app'],
  config: {
    screens: {
      VerifyEmail: 'verify-email',
      ResetPassword: 'reset-password',
    },
  },
};

export default function App() {
  return (
    <Provider store={store}>

      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>

            <NavigationContainer linking={linking}>

              <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />

              <Navigation />

              <Toast config={toastConfig} />
            </NavigationContainer>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}