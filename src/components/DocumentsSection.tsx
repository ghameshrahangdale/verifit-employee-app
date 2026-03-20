// components/DocumentsSection.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { DocumentItem } from './DocumentItem';
import { Document, FieldStatus } from '../types';

interface DocumentsSectionProps {
  documents: Document[];
  isExpanded: boolean;
  onToggle: () => void;
  fieldStatus: FieldStatus;
  activeField: string | null;
  onConfirmDocument: (documentId: string) => void;
  onRejectDocument: (documentId: string) => void;
  onSubmitDocumentIssue: (document: Document, issueDescription: string) => void;
  onCancelDocumentInput: (documentId: string) => void;
  onDocumentValueChange: (documentId: string, value: string) => void;
  onOpenDocument: (document: Document) => void;
  onRemoveDiscrepancy: (fieldName: string) => void;
}

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  documents,
  isExpanded,
  onToggle,
  fieldStatus,
  activeField,
  onConfirmDocument,
  onRejectDocument,
  onSubmitDocumentIssue,
  onCancelDocumentInput,
  onDocumentValueChange,
  onOpenDocument,
  onRemoveDiscrepancy,
}) => {
  if (documents.length === 0) return null;

  return (
    <View className="bg-white rounded-2xl mx-4 mt-4 p-5 shadow-sm border border-gray-100">
      <TouchableOpacity
        onPress={onToggle}
        className="flex-row items-center justify-between"
      >
        <Text className="font-rubik-bold text-base text-gray-800">
          Documents ({documents.length})
        </Text>
        <Feather
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#64748B"
        />
      </TouchableOpacity>

      {isExpanded && (
        <View className="mt-4 gap-3">
          {documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              document={doc}
              fieldStatus={fieldStatus}
              activeField={activeField}
              onConfirm={onConfirmDocument}
              onReject={onRejectDocument}
              onSubmitIssue={onSubmitDocumentIssue}
              onCancelInput={onCancelDocumentInput}
              onActualValueChange={onDocumentValueChange}
              onOpenDocument={onOpenDocument}
              onRemoveDiscrepancy={onRemoveDiscrepancy}
            />
          ))}
        </View>
      )}
    </View>
  );
};