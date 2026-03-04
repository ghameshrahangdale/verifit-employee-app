import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/ui/Header';
import Toast from 'react-native-toast-message';

const InviteExEmployeeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendInvitation = async () => {
    // Validate email
    if (!email.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Email required',
        text2: 'Please enter an email address',
        position: 'bottom',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid email',
        text2: 'Please enter a valid email address',
        position: 'bottom',
      });
      return;
    }

    setIsSending(true);

    try {
      // Simulate API call
    //   await new Promise(resolve => setTimeout(resolve, 1500));

      Toast.show({
        type: 'success',
        text1: 'Invitation sent',
        text2: `Invitation has been sent to ${email}`,
        position: 'bottom',
      });

      // Clear form after successful send
      setEmail('');
      setMessage('');

      // Navigate back after short delay
      setTimeout(() => {
        navigation.goBack();
      }, 2000);

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to send',
        text2: 'Please try again later',
        position: 'bottom',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* Header */}
      <Header
        title="Invite Ex-Employee"
        // showBackButton={true}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info Card */}
        <View
          className="bg-white mx-4 mt-6 p-5 rounded-2xl"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <View className="flex-row items-center mb-2">
            <Feather name="info" size={20} color={colors.primary} />
            <Text className="ml-3 text-gray-800 font-rubik-medium">
              Send Invitation
            </Text>
          </View>
          <Text className="text-gray-600 font-rubik text-sm leading-5">
            Invite a former employee to reconnect. They'll receive an email with 
            instructions to join your network.
          </Text>
        </View>

        {/* Form Card */}
        <View
          className="bg-white mx-4 mt-6 rounded-2xl"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          {/* Email Input */}
          <View className="px-5 py-4 border-b border-gray-100">
            <Text className="text-sm font-rubik-medium text-gray-700 mb-2">
              Email Address
            </Text>
            <View className="flex-row items-center">
              <Feather name="mail" size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-gray-900 font-rubik py-2"
                placeholder="Enter employee email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSending}
              />
            </View>
          </View>

          {/* Message Input */}
          <View className="px-5 py-4">
            <Text className="text-sm font-rubik-medium text-gray-700 mb-2">
              Personal Message (Optional)
            </Text>
            <View className="flex-row items-start">
              <Feather name="message-square" size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-gray-900 font-rubik py-2"
                placeholder="Add a personal note..."
                placeholderTextColor="#9CA3AF"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{ minHeight: 100 }}
                editable={!isSending}
              />
            </View>
          </View>
        </View>

     

    
      </ScrollView>

      {/* Send Button - Fixed at bottom */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white px-4 py-4"
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -4 },
          elevation: 10,
        }}
      >
        <TouchableOpacity
          onPress={handleSendInvitation}
          disabled={isSending}
          className="py-4 rounded-xl items-center"
          style={{
            backgroundColor: isSending ? '#9CA3AF' : colors.primary,
            opacity: isSending ? 0.7 : 1,
          }}
          activeOpacity={0.8}
        >
          {isSending ? (
            <View className="flex-row items-center">
              <Feather name="loader" size={20} color="#FFFFFF" />
              <Text className="ml-2 text-white font-rubik-medium text-base">
                Sending...
              </Text>
            </View>
          ) : (
            <Text className="text-white font-rubik-medium text-base">
              Send Invitation
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default InviteExEmployeeScreen;