import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';

interface SearchInputProps {
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  onSearch?: () => void;
  onClear?: () => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  placeholder = 'Search...',
  onChangeText,
  onSearch,
  onClear,
}) => {
  const { colors } = useTheme();

  return (
    <View
      className="flex-row items-center bg-white rounded-xl px-3 py-2 shadow-sm"
      style={{
        borderWidth: 1,
        borderColor: '#E5E7EB',
      }}
    >
      <TextInput
        className="flex-1 font-rubik text-gray-900"
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
      />

      {value.length > 0 && (
        <TouchableOpacity
          onPress={onClear}
          className="mr-2"
        >
          <Icon name="close-circle" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={onSearch}
        className="rounded-lg"
        
      >
        <Icon name="magnify" size={26} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

export default SearchInput;