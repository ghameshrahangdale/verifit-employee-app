// components/ui/DocumentCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { formatDate, getDocumentTypeLabel } from '../../utils/verificationHelpers';

interface DocumentCardProps {
  document: {
    id: string;
    title: string;
    documentType: string;
    contentType: string;
    fileSize: number;
    fileUrl: string;
    uploadedAt: string;
    verified?: boolean;
  };
  isConfirmed?: boolean;
  showVerificationStatus?: boolean; // Add this prop
  onView: (document: any) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  isConfirmed,
  showVerificationStatus = false, // Default to false
  onView,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocumentIcon = (contentType: string) => {
    if (contentType.includes('pdf')) return 'file-text';
    if (contentType.includes('image')) return 'image';
    if (contentType.includes('word')) return 'file-text';
    if (contentType.includes('excel')) return 'grid';
    return 'file';
  };

  const renderStatusBadge = () => {
    if (isConfirmed === undefined) return null;
    
    if (!isConfirmed) {
      return (
        <View className="bg-red-100 px-2 py-1 rounded-full border border-red-300">
          <View className="flex-row items-center">
            <Feather name="alert-triangle" size={12} color="#DC2626" />
            <Text className="font-rubik-medium text-xs text-red-700 ml-1">
              Incorrect
            </Text>
          </View>
        </View>
      );
    }
    
    return (
      <View className="bg-green-100 px-2 py-1 rounded-full border border-green-300">
        <View className="flex-row items-center">
          <Feather name="check-circle" size={12} color="#059669" />
          <Text className="font-rubik-medium text-xs text-green-700 ml-1">
            Correct
          </Text>
        </View>
      </View>
    );
  };

  // Determine card background and border based on confirmed status (only when showing verification status)
  const getCardStyles = () => {
    if (!showVerificationStatus) {
      return 'bg-gray-50 rounded-xl p-4 border border-gray-100';
    }
    if (isConfirmed === true) {
      return 'bg-green-50 rounded-xl p-4 border border-green-300';
    }
    if (isConfirmed === false) {
      return 'bg-red-50 rounded-xl p-4 border border-red-300';
    }
    return 'bg-gray-50 rounded-xl p-4 border border-gray-100';
  };

  return (
    <View className={getCardStyles()}>
      <View className="flex-row items-start">
        <View className="mr-3">
          <View className="w-10 h-10 bg-indigo-100 rounded-lg items-center justify-center">
            <Feather
              name={getDocumentIcon(document.contentType)}
              size={20}
              color="#6366F1"
            />
          </View>
        </View>
        
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="font-rubik-medium text-base text-gray-800 flex-1">
              {document.title}
            </Text>
            
            <View className="flex-row items-center gap-2 ml-2">
              {/* Only show verification badge when showVerificationStatus is true */}
              {showVerificationStatus && isConfirmed !== undefined && renderStatusBadge()}
              {document.verified && (
                <View className="bg-green-50 px-2 py-1 rounded-full border border-green-200">
                  <Text className="font-rubik-medium text-xs text-green-700">Verified</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => onView(document)}
                className="bg-indigo-50 w-8 h-8 rounded-lg items-center justify-center border border-indigo-200"
              >
                <Feather name="eye" size={16} color="#6366F1" />
              </TouchableOpacity>
            </View>
          </View>

          <Text className="font-rubik text-xs text-gray-500 mt-1">
            {getDocumentTypeLabel(document.documentType)} • {formatFileSize(document.fileSize)}
          </Text>

          <Text className="font-rubik text-xs text-gray-400 mt-1">
            Uploaded {formatDate(document.uploadedAt)}
          </Text>
        </View>
      </View>
    </View>
  );
};