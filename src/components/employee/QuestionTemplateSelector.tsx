import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import Input from '../ui/Input';
import http from '../../services/http.api';
import Toast from 'react-native-toast-message';

interface Template {
  id: string;
  name: string;
  description: string;
}

interface QuestionTemplateSelectorProps {
  organizationId?: string;
  onTemplateSelect?: (templateId: string | undefined) => void;
  initialTemplateId?: string; // Add this
}

const QuestionTemplateSelector: React.FC<QuestionTemplateSelectorProps> = ({
  organizationId,
  onTemplateSelect,
  initialTemplateId,
}) => {
  const { colors } = useTheme();
  const [templates, setTemplates] = useState<Template[]>([]);
   const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId || '');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await http.get('/api/verification/questions');
      
      setTemplates(response.data?.templates || []);
      
    } catch (error) {
      console.error('Error fetching templates:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Templates',
        text2: 'Unable to fetch question templates',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    console.log(templateId);  
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    
    // Notify parent component with templateId or undefined if empty
    if (onTemplateSelect) {
      onTemplateSelect(templateId || undefined);
    }
  };

  const templateOptions = templates.map(template => ({
    label: template.name,
    value: template.id,
  }));

  return (
    <View className="mb-6">
      {/* Optional Badge */}
      <View className="flex-row items-center mb-3">
        <View className="bg-indigo-100 px-3 py-1 rounded-full">
          <Text className="text-indigo-600 font-rubik-medium text-xs">
            Optional
          </Text>
        </View>
        <Text className="text-gray-400 font-rubik text-xs ml-2">
          Question template (optional)
        </Text>
      </View>

      {/* Template Selector */}
      <Input
        label="Question Template"
        value={selectedTemplateId}
        onChangeText={handleTemplateSelect}
        placeholder="Select a question template"
        type="select"
        options={templateOptions}
      />

      {/* Loading State */}
      {loading && (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text className="font-rubik text-gray-500 text-sm mt-2">
            Loading templates...
          </Text>
        </View>
      )}

      {/* Selected Template Info */}
      {selectedTemplate && !loading && (
        <View className="mt-3 bg-indigo-50 rounded-xl p-3">
          <View className="flex-row items-start">
            <Feather name="file-text" size={16} color={colors.primary} />
            <View className="flex-1 ml-2">
              <Text className="font-rubik-medium text-gray-800 text-sm">
                {selectedTemplate.name}
              </Text>
              {selectedTemplate.description && (
                <Text className="font-rubik text-gray-600 text-xs mt-0.5">
                  {selectedTemplate.description}
                </Text>
              )}
              <View className="flex-row items-center mt-1">
                <Feather name="info" size={12} color="#9CA3AF" />
                <Text className="font-rubik text-xs text-gray-500 ml-1">
                  Questions will be sent to verifier
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* No Templates Message */}
      {!loading && templates.length === 0 && (
        <View className="bg-gray-50 rounded-xl p-4 items-center">
          <Feather name="file-text" size={24} color="#9CA3AF" />
          <Text className="font-rubik text-gray-500 text-sm mt-1">
            No templates available
          </Text>
        </View>
      )}
    </View>
  );
};

export default QuestionTemplateSelector;