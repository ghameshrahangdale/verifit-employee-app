// components/employee/EmployeeDocumentUpload.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Toast from 'react-native-toast-message';
import http from '../../services/http.api';
import Icon from 'react-native-vector-icons/Feather';
import { pick } from '@react-native-documents/picker';

// ─── Types ────────────────────────────────────────────────────────────────────

export enum DocumentType {
  RESUME = "resume",
  EXPERIENCE_LETTER = "experience_letter",
  OFFER_LETTER = "offer_letter",
  RELIEVING_LETTER = "relieving_letter",
  PAYSLIP = "payslip",
  ID_PROOF = "id_proof",
  ADDRESS_PROOF = "address_proof",
  EDUCATION_CERTIFICATE = "education_certificate",
  OTHER = "other",
}

interface EmployeeDocument {
  id: string;
  documentType: DocumentType | string;
  title: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  createdAt: string;
}

interface EmployeeProfileResponse {
  documents?: EmployeeDocument[];
}

interface UploadResponse {
  success: boolean;
  message: string;
  data?: EmployeeDocument;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Section separator with title */
const SectionSeparator = ({ title }: { title: string }) => (
  <View className="flex-row items-center gap-2.5 my-2">
    <View className="flex-1 h-px bg-gray-200" />
    <Text className="font-rubik-medium text-xs text-gray-400 uppercase tracking-widest">
      {title}
    </Text>
    <View className="flex-1 h-px bg-gray-200" />
  </View>
);

/** Document type selector pill */
const DocumentTypePill = ({
  type,
  label,
  selected,
  onSelect,
}: {
  type: DocumentType | string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) => (
  <TouchableOpacity
    onPress={onSelect}
    className={`px-4 py-2 rounded-full border ${selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
      }`}
  >
    <Text
      className={`font-rubik-medium text-sm ${selected ? 'text-indigo-600' : 'text-gray-600'
        }`}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

/** Format file size */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/** Get icon based on content type */
const getFileIcon = (contentType: string): string => {
  if (contentType.includes('pdf')) return 'file-text';
  if (contentType.includes('image')) return 'image';
  if (contentType.includes('word') || contentType.includes('document')) return 'file-text';
  return 'file';
};

/** Document item component for displaying uploaded documents */
const DocumentItem = ({
  document,
  onRemove,
  isUploading
}: {
  document: EmployeeDocument;
  onRemove: () => void;
  isUploading?: boolean;
}) => {
  const getDocumentTypeLabel = (type: DocumentType | string) => {
    switch (type) {
      case DocumentType.RESUME:
        return 'Resume';
      case DocumentType.EXPERIENCE_LETTER:
        return 'Experience Letter';
      case DocumentType.OFFER_LETTER:
        return 'Offer Letter';
      case DocumentType.RELIEVING_LETTER:
        return 'Relieving Letter';
      case DocumentType.PAYSLIP:
        return 'Payslip';
      case DocumentType.ID_PROOF:
        return 'ID Proof';
      case DocumentType.ADDRESS_PROOF:
        return 'Address Proof';
      case DocumentType.EDUCATION_CERTIFICATE:
        return 'Education Certificate';
      case DocumentType.OTHER:
        return 'Other';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleOpenFile = () => {
    Linking.openURL(document.fileUrl).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Cannot Open File',
        text2: 'Unable to open the document',
      });
    });
  };

  const fileName = document.fileUrl.split('/').pop()?.split('?')[0] || 'document';

  return (
    <View className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100">
      <View className="flex-row justify-between items-start">
        <TouchableOpacity
          onPress={handleOpenFile}
          className="flex-1 flex-row"
          activeOpacity={0.7}
        >
          <View className="mr-3">
            <View className="w-10 h-10 bg-indigo-100 rounded-lg items-center justify-center">
              <Icon name={getFileIcon(document.contentType)} size={20} color="#6366F1" />
            </View>
          </View>
          <View className="flex-1">
            <Text className="font-rubik-medium text-base text-gray-800 mb-1">
              {document.title}
            </Text>
            <Text className="font-rubik text-sm text-gray-600 mb-1">
              {getDocumentTypeLabel(document.documentType)}
            </Text>
            <View className="flex-row items-center">
              <Text className="font-rubik text-xs text-gray-400">
                {formatFileSize(document.fileSize)}
              </Text>
              <Text className="font-rubik text-xs text-gray-400 mx-1">•</Text>
              <Text className="font-rubik text-xs text-gray-400">
                {formatDate(document.createdAt)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {!isUploading && (
          <TouchableOpacity
            onPress={onRemove}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="ml-2"
          >
            <Icon name="trash-2" size={18} color="#EF4444" />
          </TouchableOpacity>
        )}

        {isUploading && (
          <ActivityIndicator size="small" color="#6366F1" />
        )}
      </View>
    </View>
  );
};

/** Empty state component */
const EmptyState = ({ onAddPress }: { onAddPress: () => void }) => (
  <View className="bg-white mx-4 rounded-2xl p-8 items-center justify-center shadow-sm">
    <Icon name="file" size={48} color="#9CA3AF" />
    <Text className="font-rubik-medium text-base text-gray-700 mt-4 text-center">
      No Documents Uploaded
    </Text>
    <Text className="font-rubik text-sm text-gray-400 mt-1 text-center mb-6">
      Upload your documents to complete your employee profile
    </Text>
    <Button
      title="Upload Document"
      onPress={onAddPress}
    />
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface EmployeeDocumentUploadProps {
  onUploadComplete?: () => void;
}

const EmployeeDocumentUpload: React.FC<EmployeeDocumentUploadProps> = ({
  onUploadComplete,
}) => {
  const { colors } = useTheme();

  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Form state for new document
  const [documentForm, setDocumentForm] = useState({
    documentType: DocumentType.RESUME,
    title: '',
  });

  const [selectedFile, setSelectedFile] = useState<any>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsFetching(true);
      const response = await http.get<EmployeeProfileResponse>('api/employees/profile');

      if (response.data?.documents) {
        setDocuments(response.data?.documents);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Documents',
        text2: error?.response?.data?.message || 'Unable to fetch documents',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handlePickFile = async () => {
    try {
      const res = await pick({
        type: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        allowMultiSelection: false,
      });

      const file = res[0];

      setSelectedFile({
        uri: file.uri,
        name: file.name || 'document.pdf',
        type: file.type || 'application/pdf',
      });

    } catch (err: any) {
      if (err?.code === 'DOCUMENT_PICKER_CANCELED') return;

      Toast.show({
        type: 'error',
        text1: 'File Selection Failed',
        text2: 'Unable to select file',
      });
    }
  };

  const handleUpload = async () => {
    // Validate form
    if (!documentForm.title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Title Required',
        text2: 'Please enter a document title',
      });
      return;
    }

    if (!selectedFile) {
      Toast.show({
        type: 'error',
        text1: 'File Required',
        text2: 'Please select a file to upload',
      });
      return;
    }

    try {
      setIsUploading(true);

      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.type,
      } as any);
      formData.append('documentType', documentForm.documentType);
      formData.append('title', documentForm.title.trim());

      // Make API call
      const response = await http.post<UploadResponse>('api/employees/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Document Uploaded',
          text2: 'Your document was uploaded successfully.',
        });

        // Refresh documents from profile
        await fetchDocuments();
        setShowUploadForm(false);
        resetForm();
        onUploadComplete?.();
      }

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error?.response?.data?.message || 'Failed to upload document',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    try {
      setIsLoading(true);

      // Remove from UI optimistically
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));

      await http.delete(`api/employees/documents/${documentId}`);

      Toast.show({
        type: 'success',
        text1: 'Document Removed',
        text2: 'Document was deleted successfully.',
      });

    } catch (error: any) {
      // If delete failed, refresh to get the correct list
      await fetchDocuments();

      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: error?.response?.data?.message || 'Failed to delete document',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setDocumentForm({
      documentType: DocumentType.RESUME,
      title: '',
    });
    setSelectedFile(null);
  };

  const handleCancelUpload = () => {
    setShowUploadForm(false);
    resetForm();
  };

  const getDocumentTypeLabel = (type: DocumentType): string => {
    switch (type) {
      case DocumentType.RESUME:
        return 'Resume';
      case DocumentType.EXPERIENCE_LETTER:
        return 'Experience Letter';
      case DocumentType.OFFER_LETTER:
        return 'Offer Letter';
      case DocumentType.RELIEVING_LETTER:
        return 'Relieving Letter';
      case DocumentType.PAYSLIP:
        return 'Payslip';
      case DocumentType.ID_PROOF:
        return 'ID Proof';
      case DocumentType.ADDRESS_PROOF:
        return 'Address Proof';
      case DocumentType.EDUCATION_CERTIFICATE:
        return 'Education Certificate';
      case DocumentType.OTHER:
        return 'Other';
      default:
        return type;
    }
  };

  // Loading state
  if (isFetching) {
    return (
      <View className="mt-4">
        <View className="bg-white mx-4 rounded-2xl p-8 items-center justify-center shadow-sm">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text className="font-rubik text-sm text-gray-400 mt-3">
            Loading documents...
          </Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (documents.length === 0 && !showUploadForm) {
    return (
      <View className="mt-4">
        <EmptyState onAddPress={() => setShowUploadForm(true)} />
      </View>
    );
  }

  return (
    <View className="mt-4">
      <View className="bg-white mx-4 rounded-2xl shadow-sm overflow-hidden">
        {/* Header with Add button */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
          <Text className="font-rubik-medium text-base text-gray-800">
            Documents
          </Text>
          {!showUploadForm && (
            <TouchableOpacity
              onPress={() => setShowUploadForm(true)}
              className="p-2 bg-indigo-500 rounded-full"
              style={{
                backgroundColor: `${colors.primary}0D`,
                borderColor: `${colors.primary}25`,
              }}
              activeOpacity={0.7}
            >
              <Icon name="plus" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {showUploadForm ? (
          // Upload Form View
          <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
            <Text className="font-rubik-medium text-sm text-gray-700 mb-3">
              Upload New Document
            </Text>

            {/* Document Type Selection */}
            <View className="mb-4">
              <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-2">
                Document Type
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {Object.values(DocumentType).map((type) => (
                    <DocumentTypePill
                      key={type}
                      type={type}
                      label={getDocumentTypeLabel(type as DocumentType)}
                      selected={documentForm.documentType === type}
                      onSelect={() => setDocumentForm(prev => ({ ...prev, documentType: type }))}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Title Input */}
            <Input
              label="Document Title"
              value={documentForm.title}
              onChangeText={(text) => setDocumentForm(prev => ({ ...prev, title: text }))}
              placeholder="e.g., Updated Resume 2026"
            />

            {/* File Selection */}
            <View className="mb-6">
              <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-2">
                File
              </Text>

              {selectedFile ? (
                <View className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Icon name="file" size={20} color="#6366F1" />
                    <Text className="font-rubik text-sm text-gray-700 ml-2 flex-1" numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedFile(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon name="x" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handlePickFile}
                  className="border border-gray-200 border-dashed rounded-xl p-6 items-center"
                >
                  <Icon name="upload-cloud" size={32} color="#9CA3AF" />
                  <Text className="font-rubik-medium text-sm text-gray-600 mt-2">
                    Tap to select file
                  </Text>
                  <Text className="font-rubik text-xs text-gray-400 mt-1">
                    PDF, JPEG, PNG, DOC (Max 10MB)
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mt-2">
              <Button
                title="Cancel"
                variant="outline"
                className="flex-1"
                onPress={handleCancelUpload}
                disabled={isUploading}
              />
              <Button
                title="Upload"
                className="flex-1"
                loading={isUploading}
                onPress={handleUpload}
              />
            </View>
          </ScrollView>
        ) : (
          // Display Documents List
          <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
            {documents.map((document) => (
              <DocumentItem
                key={document.id}
                document={document}
                onRemove={() => handleRemoveDocument(document.id)}
              />
            ))}

            {documents.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowUploadForm(true)}
                style={{
                  backgroundColor: `${colors.primary}0D`,
                  borderColor: `${colors.primary}25`,
                }}
                className="border flex-row rounded-xl p-4 justify-center items-center mt-2"
              >
                <Icon name="plus" size={20} color={colors.primary} />
                <Text
                  className="text-sm font-rubik-medium"
                  style={{ color: colors.primary }}
                >
                  Upload Another Document
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default EmployeeDocumentUpload;