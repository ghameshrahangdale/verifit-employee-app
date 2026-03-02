import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../config/theme'; 
interface ConfirmationPopupProps {
  visible: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  visible,
  title = 'Confirmation',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="w-full rounded-2xl bg-white p-5">
          
          {/* Title */}
          <Text
            className="text-lg mb-2 font-rubik-semibold"
            style={{
              color: theme.text,
            }}
          >
            {title}
          </Text>

          {/* Message */}
          <Text
            className="text-sm mb-5 font-rubik"
            style={{
              color: theme.text,
            }}
          >
            {message}
          </Text>

          {/* Actions */}
          <View className="flex-row justify-end space-x-3">
            <TouchableOpacity
              onPress={onCancel}
              className="px-4 py-2 rounded-lg"
            >
              <Text
                className="font-rubik-medium"
                style={{
                  color: theme.text,
                }}
              >
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: theme.primary }}
            >
              <Text
                className="text-white font-rubik-medium"
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmationPopup;
