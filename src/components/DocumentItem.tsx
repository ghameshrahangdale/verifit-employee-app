// components/DocumentItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-message';
import Input from './ui/Input';
import { getDocumentTypeLabel } from '../utils/verificationHelpers'; 
import { Document, FieldStatus } from '../types';

interface DocumentItemProps {
  document: Document;
  fieldStatus: FieldStatus;
  activeField: string | null;
  onConfirm: (documentId: string) => void;
  onReject: (documentId: string) => void;
  onSubmitIssue: (document: Document, issueDescription: string) => void;
  onCancelInput: (documentId: string) => void;
  onActualValueChange: (documentId: string, value: string) => void;
  onOpenDocument: (document: Document) => void;
  onRemoveDiscrepancy: (fieldName: string) => void;
}

export const DocumentItem: React.FC<DocumentItemProps> = ({
  document,
  fieldStatus,
  activeField,
  onConfirm,
  onReject,
  onSubmitIssue,
  onCancelInput,
  onActualValueChange,
  onOpenDocument,
  onRemoveDiscrepancy,
}) => {
  const documentKey = `document_${document.id}`;
  const status = fieldStatus[documentKey];

  return (
    <View className="border border-gray-100 rounded-xl">
      <TouchableOpacity
        onPress={() => onOpenDocument(document)}
        className="bg-gray-50 rounded-t-xl p-4 flex-row items-center"
        style={status?.confirmed !== null ? { borderBottomWidth: 1, borderBottomColor: '#E5E7EB' } : {}}
      >
        <View className="w-10 h-10 bg-indigo-100 rounded-lg items-center justify-center mr-3">
          <Feather
            name={document.contentType.includes('pdf') ? 'file-text' : 'image'}
            size={20}
            color="#6366F1"
          />
        </View>
        <View className="flex-1">
          <Text className="font-rubik-medium text-sm text-gray-800">
            {document.title}
          </Text>
          <Text className="font-rubik text-xs text-gray-500 mt-1">
            {getDocumentTypeLabel(document.documentType)} • {formatFileSize(document.fileSize)}
          </Text>
        </View>
        <Feather name="eye" size={20} color="#94A3B8" />
      </TouchableOpacity>

      {status?.confirmed === true ? (
        <View className="bg-green-50 px-4 py-3 rounded-b-xl border-t border-green-200 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Feather name="check-circle" size={16} color="#10B981" />
            <Text className="font-rubik-medium text-xs text-green-700 ml-2">
              Document Verified - Correct
            </Text>
          </View>
          <TouchableOpacity onPress={() => onRemoveDiscrepancy(`Document: ${document.title}`)}>
            <Feather name="x" size={16} color="#10B981" />
          </TouchableOpacity>
        </View>
      ) : status?.confirmed === false ? (
        <View className="bg-red-50 px-4 py-3 rounded-b-xl border-t border-red-200">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Feather name="alert-circle" size={16} color="#EF4444" />
              <Text className="font-rubik-medium text-xs text-red-700 ml-2">
                Document Issue Reported
              </Text>
            </View>
            <TouchableOpacity onPress={() => onRemoveDiscrepancy(`Document: ${document.title}`)}>
              <Feather name="x" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
          {status.actualValue && (
            <Text className="font-rubik text-xs text-red-600">
              Issue: {status.actualValue}
            </Text>
          )}
        </View>
      ) : (
        !status?.showInput && (
          <View className="flex-row gap-2 p-3 bg-gray-50/50 rounded-b-xl border-t border-gray-100">
            <TouchableOpacity
              onPress={() => onConfirm(document.id)}
              className="flex-1 flex-row items-center justify-center bg-green-50 py-2.5 rounded-lg border border-green-200"
            >
              <Feather name="check" size={16} color="#10B981" />
              <Text className="font-rubik-medium text-xs text-green-700 ml-1.5">
                Correct
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onReject(document.id)}
              className="flex-1 flex-row items-center justify-center bg-red-50 py-2.5 rounded-lg border border-red-200"
            >
              <Feather name="x" size={16} color="#EF4444" />
              <Text className="font-rubik-medium text-xs text-red-700 ml-1.5">
                Issue
              </Text>
            </TouchableOpacity>
          </View>
        )
      )}

      {status?.showInput && (
        <View className="bg-gray-50 p-4 rounded-b-xl border-t border-gray-200">
          <Text className="font-rubik-medium text-sm text-gray-700 mb-2">
            Describe the issue with this document
          </Text>
          <Input
            label="Issue Description"
            value={status.actualValue || ''}
            onChangeText={(text) => onActualValueChange(document.id, text)}
            placeholder="e.g., Document is illegible, wrong document uploaded, expired, etc."
            type="text"
            multiline
            numberOfLines={3}
          />

          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              onPress={() => {
                if (!status.actualValue.trim()) {
                  Toast.show({
                    type: 'error',
                    text1: 'Description Required',
                    text2: 'Please describe the issue with this document',
                  });
                  return;
                }
                onSubmitIssue(document, status.actualValue);
              }}
              className="flex-1 bg-purple-500 py-3 rounded-lg items-center"
            >
              <Text className="font-rubik-medium text-sm text-white">Submit Issue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onCancelInput(document.id)}
              className="flex-1 bg-gray-200 py-3 rounded-lg items-center"
            >
              <Text className="font-rubik-medium text-sm text-gray-700">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};