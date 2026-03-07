// App.tsx
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { StatusBar } from 'react-native';
import './global.css';
import { store } from './src/store/store';
import Navigation from './src/navigation/Navigation';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext'; // Import AuthProvider
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/ui/toast';

const linking = {
  prefixes: [
    'verifiit://',
    'https://verifiit-nextjs.vercel.app',
  ],
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
          <AuthProvider> {/* Wrap with AuthProvider */}
             <NavigationContainer linking={linking}>
              <StatusBar />
              <Navigation />
              <Toast config={toastConfig} />
            </NavigationContainer>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}