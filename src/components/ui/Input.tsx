import React, { useState } from 'react';
import { TextInput, View, Text, TouchableOpacity, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  hint?: string;

  className?: string;
  required?: boolean;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;

  type?: 'text' | 'date' | 'select';
  options?: { label: string; value: string }[];

  rightButtonIcon?: string;
  onRightButtonPress?: () => void;
}

const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  keyboardType = 'default',
  autoCapitalize = 'none',
  className = '',
  required = false,
  maxLength,
  multiline = false,
  numberOfLines = 3,
  disabled = false,
  type = 'text',
  options = [],
  rightButtonIcon,
  onRightButtonPress,
  autoCorrect = false,
  hint,
}) => {
  const { colors } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const showPassword = secureTextEntry && !isPasswordVisible;

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      onChangeText(`${year}-${month}-${day}`);
    }
  };

  const handlePress = () => {
    if (type === 'date' && !disabled) {
      setShowDatePicker(true);
    }
  };

  const inputHeight = multiline && numberOfLines ? numberOfLines * 24 : undefined;

  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="mb-2 font-rubik-medium text-gray-700">
          {label}
          {required && <Text className="text-red-500"> *</Text>}
        </Text>
      )}

      <View className="flex-row items-center">
        <View className="flex-1 relative">
          <TouchableOpacity
            activeOpacity={type === 'date' && !disabled ? 0.7 : 1}
            onPress={handlePress}
            disabled={disabled || type !== 'date'}
          >
            <View pointerEvents={type === 'date' && !disabled ? 'none' : 'auto'}>

              {/* SELECT INPUT */}
              {type === 'select' ? (
                <View
                  className={`border font-rubik rounded-lg px-2 ${error ? 'border-red-500' : 'border-gray-300'
                    } ${disabled ? 'bg-gray-100' : ''}`}
                  style={{
                    height: 48,
                    justifyContent: 'center',
                  }}
                >
                  <Picker
                    selectedValue={value}
                    enabled={!disabled}
                    onValueChange={(itemValue: any) => onChangeText(itemValue)}
                    style={{
                      color: disabled
                        ? '#9CA3AF'
                        : value
                          ? colors.text   // ✅ selected value color
                          : '#9CA3AF',       // placeholder color
                      fontFamily: 'Rubik-Regular'
                    }}
                  >
                    <Picker.Item
                      label={placeholder || 'Select option'}
                      value=""
                      style={{ fontSize: 14, fontFamily: 'Rubik-Regular', }}
                    />
                    {options.map((opt) => (
                      <Picker.Item
                        key={opt.value}
                        label={opt.label}
                        value={opt.value}
                        style={{
                          color: value === opt.value ? colors.primary : '#000',
                          fontSize: 14,
                          fontFamily: 'Rubik-Regular'
                        }}
                      />
                    ))}
                  </Picker>
                </View>
              ) : (
                /* TEXT / DATE INPUT */
                <TextInput
                  className={`border rounded-lg px-4 pr-12 text-base font-rubik ${error ? 'border-red-500' : 'border-gray-300'
                    } ${disabled ? 'bg-gray-100 text-gray-500' : ''}`}
                  value={value}
                  onChangeText={onChangeText}
                  placeholder={placeholder}
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={showPassword}
                  keyboardType={keyboardType}
                  autoCapitalize={autoCapitalize}
                  autoCorrect={autoCorrect}
                  style={{
                    color: disabled ? '#9CA3AF' : colors.text,
                    height: inputHeight ? inputHeight : undefined,
                    textAlignVertical: multiline ? 'top' : 'center',
                  }}
                  maxLength={maxLength}
                  multiline={multiline}
                  numberOfLines={multiline ? numberOfLines : undefined}
                  editable={!disabled && type !== 'date'}
                />
              )}

            </View>
          </TouchableOpacity>

          {/* Password toggle */}
          {secureTextEntry && type !== 'select' && (
            <TouchableOpacity
              onPress={() => setIsPasswordVisible(prev => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
              activeOpacity={0.7}
              disabled={disabled}
            >
              <MaterialCommunityIcons
                name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={disabled ? '#D1D5DB' : '#9CA3AF'}
              />
            </TouchableOpacity>
          )}

          {/* Date icon */}
          {type === 'date' && !disabled && (
            <TouchableOpacity
              onPress={handlePress}
              className="absolute right-4 top-1/2 -translate-y-1/2"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="calendar" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Right Action Button */}
        {rightButtonIcon && (
          <TouchableOpacity
            onPress={onRightButtonPress}
            activeOpacity={0.8}
            disabled={disabled}
            className="ml-2 h-11 w-11 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <MaterialCommunityIcons name={rightButtonIcon} size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text className="mt-1 text-red-500 text-sm font-rubik">{error}</Text>
      )}

      {!error && hint && (
        <Text className="mt-1 text-gray-400 text-sm font-rubik">
          {hint}
        </Text>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

export default Input;