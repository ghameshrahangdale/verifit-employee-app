import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/ui/Header';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import contactConfig from '../config/contact.config';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const HelpSupportScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const [photoURL] = useState(user?.photoURL || '');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleEmailPress = async () => {
    if (!contactConfig.email) return;
    try {
      await Linking.openURL(`mailto:${contactConfig.email}`);
    } catch {
      Alert.alert('Error', 'Unable to open email app');
    }
  };

  const handleWebsitePress = async () => {
    if (!contactConfig.website) return;
    try {
      await Linking.openURL(contactConfig.website);
    } catch {
      Alert.alert('Error', 'Unable to open website');
    }
  };

  const handleSubmitQuery = () => {
    if (!name || !email || !message) {
      Alert.alert('Validation', 'Please fill all fields');
      return;
    }

    Alert.alert('Submitted', 'Your query has been submitted successfully');
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Help & Support" avatarImageUrl={photoURL || undefined} />

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Contact Card */}
        {(contactConfig.email ||
          contactConfig.website ||
          contactConfig.phone ||
          contactConfig.address) && (
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <Text className="text-base font-rubik-bold text-gray-900 mb-4">
              Contact {contactConfig.brandName}
            </Text>

            {contactConfig.email && (
              <ContactRow
                icon="mail"
                label="Email"
                value={contactConfig.email}
                color={colors.primary}
                onPress={handleEmailPress}
              />
            )}

            {contactConfig.website && (
              <ContactRow
                icon="globe"
                label="Website"
                value={contactConfig.website}
                color={colors.primary}
                onPress={handleWebsitePress}
              />
            )}

            {contactConfig.phone && (
              <ContactRow
                icon="phone"
                label="Mobile"
                value={contactConfig.phone}
                color={colors.primary}
              />
            )}

            {contactConfig.address && (
              <ContactRow
                icon="map-pin"
                label="Address"
                value={contactConfig.address}
                color={colors.primary}
              />
            )}
          </View>
        )}

        {/* Submit Query */}
        <View className="bg-white rounded-2xl p-5 shadow-sm">
          <Text className="text-base font-rubik-bold text-gray-900 mb-4">
            Submit a Query
          </Text>

          <Input
            label="Your Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
          />

          <Input
            label="Your Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
          />

          <Input
            label="Message"
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your issue"
            className="mb-6"
          />

          <Button title="Submit Query" onPress={handleSubmitQuery} />
        </View>
      </ScrollView>
    </View>
  );
};

interface ContactRowProps {
  icon: string;
  label: string;
  value: string;
  color: string;
  onPress?: () => void;
}

const ContactRow: React.FC<ContactRowProps> = ({
  icon,
  label,
  value,
  color,
  onPress,
}) => {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center py-4 border-b border-gray-200 last:border-b-0"
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: color + '15' }}
      >
        <Feather name={icon as any} size={20} color={color} />
      </View>

      <View className="flex-1">
        <Text className="text-sm font-rubik text-gray-500">{label}</Text>
        <Text
          className={`font-rubik-medium mt-0.5 ${
            onPress ? 'text-blue-600' : 'text-gray-900'
          }`}
        >
          {value}
        </Text>
      </View>
    </Wrapper>
  );
};

export default HelpSupportScreen;
