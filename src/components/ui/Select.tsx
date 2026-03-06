// components/ui/Select.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  required = false,
  error,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View className="mb-4">
      <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className={`border rounded-lg px-4 py-3 flex-row justify-between items-center bg-white
          ${error ? 'border-red-500' : 'border-gray-300'}`}
      >
        <Text className={`font-rubik ${!value ? 'text-gray-400' : 'text-gray-900'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Icon name="chevron-down" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      {error && (
        <Text className="text-red-500 text-xs font-rubik mt-1">
          {error}
        </Text>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl">
            <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
              <Text className="text-lg font-rubik-bold">{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="x" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                  className={`p-4 border-b border-gray-100 ${
                    item.value === value ? 'bg-blue-50' : ''
                  }`}
                >
                  <Text className={`font-rubik ${
                    item.value === value ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Select;