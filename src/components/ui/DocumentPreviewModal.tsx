// components/ui/DocumentPreviewModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { WebView } from 'react-native-webview';
import RNFetchBlob from 'react-native-blob-util'
import Toast from 'react-native-toast-message';

interface Document {
  id: string;
  title: string;
  documentType: string;
  contentType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: string;
}

interface DocumentPreviewModalProps {
  visible: boolean;
  document: Document | null;
  onClose: () => void;
  onDownload?: (document: Document) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  visible,
  document,
  onClose,
  onDownload,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!document) return;
    
    try {
      const { config, fs } = RNFetchBlob;
      const date = new Date();
      const fileExtension = document.contentType.split('/')[1] || 'pdf';
      const fileName = `${document.title.replace(/\s/g, '_')}_${date.getTime()}.${fileExtension}`;
      
      const downloadDir = Platform.OS === 'ios' 
        ? fs.dirs.DocumentDir 
        : fs.dirs.DownloadDir;
      
      const filePath = `${downloadDir}/${fileName}`;
      
      const response = await config({
        fileCache: true,
        path: filePath,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: filePath,
          description: `Downloading ${document.title}`,
        },
      }).fetch('GET', document.fileUrl);
      
      if (Platform.OS === 'ios') {
        // On iOS, show share options after download
        await Share.share({
          url: response.path(),
          title: document.title,
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Download Complete',
          text2: `File saved to Downloads folder`,
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      Toast.show({
        type: 'error',
        text1: 'Download Failed',
        text2: 'Unable to download the document',
      });
    }
  };

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

  if (!document) return null;

  const isPDF = document.contentType.includes('pdf');
  const isImage = document.contentType.includes('image');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-12 pb-4 border-b border-gray-200 bg-white">
          <TouchableOpacity onPress={onClose} className="p-2">
            <Feather name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          
          <Text className="font-rubik-bold text-lg text-gray-800 flex-1 text-center mx-2" numberOfLines={1}>
            {document.title}
          </Text>
          
          <TouchableOpacity onPress={handleDownload} className="p-2">
            <Feather name="download" size={22} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Document Info Bar */}
        <View className="flex-row justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
          <View className="flex-row items-center">
            <Feather name={getDocumentIcon(document.contentType)} size={16} color="#6B7280" />
            <Text className="font-rubik text-xs text-gray-500 ml-2">
              {document.contentType.split('/')[1].toUpperCase()} • {formatFileSize(document.fileSize)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => Linking.openURL(document.fileUrl)}
            className="flex-row items-center"
          >
            <Feather name="external-link" size={14} color="#3B82F6" />
            <Text className="font-rubik text-xs text-blue-500 ml-1">Open in Browser</Text>
          </TouchableOpacity>
        </View>

        {/* Document Preview */}
        <View className="flex-1">
          {isLoading && (
            <View className="absolute top-1/2 left-0 right-0 items-center">
              <ActivityIndicator size="large" color="#6366F1" />
              <Text className="font-rubik text-sm text-gray-400 mt-3">
                Loading document...
              </Text>
            </View>
          )}
          
          {error && (
            <View className="flex-1 items-center justify-center px-8">
              <View className="w-20 h-20 rounded-2xl bg-red-100 items-center justify-center mb-4">
                <Feather name="alert-circle" size={36} color="#EF4444" />
              </View>
              <Text className="font-rubik-bold text-lg text-gray-800 text-center">
                Failed to Load Document
              </Text>
              <Text className="font-rubik text-sm text-gray-400 text-center mt-2">
                {error}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setError(null);
                  setIsLoading(true);
                }}
                className="mt-6 bg-indigo-50 px-6 py-3 rounded-xl"
              >
                <Text className="font-rubik-medium text-indigo-600">Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {!error && (
            <>
              {isPDF && (
                <WebView
                  source={{ uri: document.fileUrl }}
                  onLoadStart={() => setIsLoading(true)}
                  onLoadEnd={() => setIsLoading(false)}
                  onError={(syntheticEvent:any) => {
                    const { nativeEvent } = syntheticEvent;
                    setError('Failed to load PDF. Please try again or open in browser.');
                    setIsLoading(false);
                  }}
                  style={{ flex: 1 }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View className="flex-1 items-center justify-center">
                      <ActivityIndicator size="large" color="#6366F1" />
                    </View>
                  )}
                />
              )}
              
              {isImage && (
                <WebView
                  source={{ uri: document.fileUrl }}
                  onLoadStart={() => setIsLoading(true)}
                  onLoadEnd={() => setIsLoading(false)}
                  onError={() => {
                    setError('Failed to load image. Please try again.');
                    setIsLoading(false);
                  }}
                  style={{ flex: 1 }}
                />
              )}
              
              {!isPDF && !isImage && (
                <View className="flex-1 items-center justify-center p-8">
                  <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-4">
                    <Feather name={getDocumentIcon(document.contentType)} size={48} color="#9CA3AF" />
                  </View>
                  <Text className="font-rubik-bold text-lg text-gray-800 text-center">
                    {document.title}
                  </Text>
                  <Text className="font-rubik text-sm text-gray-400 text-center mt-2">
                    Preview not available for this file type
                  </Text>
                  <TouchableOpacity
                    onPress={handleDownload}
                    className="mt-6 bg-indigo-50 px-6 py-3 rounded-xl flex-row items-center"
                  >
                    <Feather name="download" size={18} color="#6366F1" />
                    <Text className="font-rubik-medium text-indigo-600 ml-2">
                      Download to View
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};