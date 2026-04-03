import React, { useState } from 'react';
import { TextInput, View, Text, TouchableOpacity, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

interface InputProps {
  label?: string;
  value: any;
  onChangeText: (text: any) => void;
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
  
  isIssue?: boolean; // New prop for issue state
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
  isIssue = false, // Default to false
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

  // Determine border and background colors based on error and isIssue states
  const getBorderColor = () => {
    if (error || isIssue) return 'border-red-600';
    return 'border-gray-300';
  };

  const getBackgroundColor = () => {
    if (isIssue && !disabled) return 'bg-red-50';
    if (disabled) return 'bg-gray-100';
    return '';
  };

  const getTextColor = () => {
    if (isIssue && !disabled) return 'text-red-500';
    if (disabled) return 'text-gray-500';
    return colors.text;
  };

  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <View className="flex-row items-center justify-between mb-2">
          <Text className={`font-rubik-medium ${isIssue ? 'text-red-500' : 'text-gray-700'}`}>
            {label}
            {required && <Text className="text-red-500"> *</Text>}
          </Text>
          
          {/* Correction Badge */}
          {isIssue && !error && (
            <View className="flex-row items-center bg-red-100 px-2 py-1 rounded-full">
              <MaterialCommunityIcons name="alert-circle" size={14} color="#EF4444" />
              <Text className="text-red-600 text-xs font-rubik-medium ml-1">
                Needs correction
              </Text>
            </View>
          )}
        </View>
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
                  className={`border font-rubik rounded-lg px-2 ${getBorderColor()} ${getBackgroundColor()}`}
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
                          ? (isIssue ? '#EF4444' : colors.text)   // ✅ selected value color
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
                          color: value === opt.value ? (isIssue ? '#EF4444' : colors.primary) : '#000',
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
                  className={`border rounded-lg px-4 pr-12 text-base font-rubik ${getBorderColor()} ${getBackgroundColor()}`}
                  value={value}
                  onChangeText={onChangeText}
                  placeholder={placeholder}
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={showPassword}
                  keyboardType={keyboardType}
                  autoCapitalize={autoCapitalize}
                  autoCorrect={autoCorrect}
                  style={{
                    color: getTextColor(),
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

      {/* Error message - takes priority over hint */}
      {error && (
        <Text className="mt-1 text-red-500 text-sm font-rubik">{error}</Text>
      )}

      {/* Hint message - shows when no error, and applies red styling if isIssue is true */}
      {!error && hint && (
        <Text className={`mt-1 text-sm font-rubik ${isIssue ? 'text-red-500' : 'text-gray-400'}`}>
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