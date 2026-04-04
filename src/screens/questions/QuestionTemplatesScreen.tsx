import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Switch,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/ui/Header';
import Toast from 'react-native-toast-message';
import http from '../../services/http.api';
import Loader from '../../components/ui/Loader';
import SearchInput from '../../components/ui/SearchInput';
import ConfirmationPopup from '../../components/ui/ConfirmationPopup';
import Button from '../../components/ui/Button';

// Question Types
type QuestionType = 'text' | 'multiple_choice' | 'boolean' | 'rating';

interface Question {
  id: string;
  templateId: string;
  question: string;
  questionType: QuestionType;
  options: string[] | null;
  required: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface Template {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
}

interface CreateTemplateData {
  name: string;
  description: string;
  questions: Omit<Question, 'id' | 'templateId' | 'createdAt' | 'updatedAt'>[];
}

interface CreateQuestionData {
  question: string;
  questionType: QuestionType;
  options?: string[];
  required: boolean;
  order: number;
}

const QuestionTypeLabels: Record<QuestionType, string> = {
  text: 'Text Answer',
  multiple_choice: 'Multiple Choice',
  boolean: 'Yes / No',
  rating: 'Rating (1-5)',
};

const QuestionTypeIcons: Record<QuestionType, string> = {
  text: 'edit-2',
  multiple_choice: 'list',
  boolean: 'toggle-left',
  rating: 'star',
};

const QuestionTemplatesScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Modal States
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [questions, setQuestions] = useState<CreateQuestionData[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Question Editor Modal
  const [isQuestionModalVisible, setIsQuestionModalVisible] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('text');
  const [questionRequired, setQuestionRequired] = useState(true);
  const [questionOptions, setQuestionOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState('');

  // Delete Confirmation
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View Template Modal
  const [viewTemplateModalVisible, setViewTemplateModalVisible] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Fetch templates on mount and when search changes
  useEffect(() => {
    fetchTemplates();
  }, [debouncedSearchQuery]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await http.get('/api/verification/questions');
      
      if (response.success) {
        let fetchedTemplates = response.data.templates;
        
        // Filter by search query
        if (debouncedSearchQuery) {
          fetchedTemplates = fetchedTemplates.filter((template: Template) =>
            template.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            (template.description && template.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
          );
        }
        
        // Sort questions by order
        fetchedTemplates = fetchedTemplates.map((template: Template) => ({
          ...template,
          questions: [...template.questions].sort((a, b) => a.order - b.order),
        }));
        
        setTemplates(fetchedTemplates);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Templates',
        text2: error.response?.data?.message || 'Unable to fetch templates',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchTemplates();
  }, [debouncedSearchQuery]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Template CRUD Operations
  const openCreateTemplateModal = () => {
    setIsEditing(false);
    setSelectedTemplate(null);
    setTemplateName('');
    setTemplateDescription('');
    setQuestions([]);
    setIsTemplateModalVisible(true);
  };

  const openEditTemplateModal = (template: Template) => {
    setIsEditing(true);
    setSelectedTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description || '');
    // Convert existing questions to CreateQuestionData format
    const existingQuestions: CreateQuestionData[] = template.questions.map((q) => ({
      question: q.question,
      questionType: q.questionType,
      options: q.options || undefined,
      required: q.required,
      order: q.order,
    }));
    setQuestions(existingQuestions);
    setIsTemplateModalVisible(true);
  };

  const openViewTemplateModal = (template: Template) => {
    setViewingTemplate(template);
    setViewTemplateModalVisible(true);
  };

  const addQuestion = () => {
    setEditingQuestionIndex(null);
    setQuestionText('');
    setQuestionType('text');
    setQuestionRequired(true);
    setQuestionOptions([]);
    setOptionInput('');
    setIsQuestionModalVisible(true);
  };

  const editQuestion = (index: number) => {
    const question = questions[index];
    setEditingQuestionIndex(index);
    setQuestionText(question.question);
    setQuestionType(question.questionType);
    setQuestionRequired(question.required);
    setQuestionOptions(question.options || []);
    setOptionInput('');
    setIsQuestionModalVisible(true);
  };

  const saveQuestion = () => {
    if (!questionText.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a question',
      });
      return;
    }

    if (questionType === 'multiple_choice' && questionOptions.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please add at least one option for multiple choice question',
      });
      return;
    }

    const newQuestion: CreateQuestionData = {
      question: questionText.trim(),
      questionType,
      required: questionRequired,
      order: editingQuestionIndex !== null ? questions[editingQuestionIndex].order : questions.length,
      options: questionType === 'multiple_choice' ? questionOptions : undefined,
    };

    if (editingQuestionIndex !== null) {
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = newQuestion;
      setQuestions(updatedQuestions);
    } else {
      setQuestions([...questions, newQuestion]);
    }

    setIsQuestionModalVisible(false);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    // Reorder remaining questions
    updatedQuestions.forEach((q, idx) => {
      q.order = idx;
    });
    setQuestions(updatedQuestions);
  };

  const addOption = () => {
    if (optionInput.trim()) {
      setQuestionOptions([...questionOptions, optionInput.trim()]);
      setOptionInput('');
    }
  };

  const removeOption = (index: number) => {
    const updatedOptions = [...questionOptions];
    updatedOptions.splice(index, 1);
    setQuestionOptions(updatedOptions);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedQuestions = [...questions];
    [updatedQuestions[index], updatedQuestions[newIndex]] = [updatedQuestions[newIndex], updatedQuestions[index]];
    
    // Update order property
    updatedQuestions.forEach((q, idx) => {
      q.order = idx;
    });
    
    setQuestions(updatedQuestions);
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a template name',
      });
      return;
    }

    if (questions.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please add at least one question',
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const templateData: CreateTemplateData = {
        action:"create_template",
        name: templateName.trim(),
        description: templateDescription.trim(),
        questions: questions.map((q, idx) => ({
          ...q,
          order: idx,
        })),
      };

      if (isEditing && selectedTemplate) {
        // Update existing template
        await http.put(`/api/verification/questions/${selectedTemplate.id}`, templateData);
        Toast.show({
          type: 'success',
          text1: 'Template Updated',
          text2: `${templateName} has been updated successfully`,
        });
      } else {
        // Create new template
        await http.post('/api/verification/questions', templateData);
        Toast.show({
          type: 'success',
          text1: 'Template Created',
          text2: `${templateName} has been created successfully`,
        });
      }
      
      setIsTemplateModalVisible(false);
      fetchTemplates();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: isEditing ? 'Failed to Update Template' : 'Failed to Create Template',
        text2: error.response?.data?.message || 'Unable to save template',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteTemplate = (template: Template) => {
    setTemplateToDelete(template);
    setDeleteModalVisible(true);
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      setIsDeleting(true);
      // Change this line to use query parameter instead of path parameter
      await http.delete(`/api/verification/questions`, {
        params: { templateId: templateToDelete.id }
      });
      
      // await http.delete(`/api/verification/questions?templateId=${templateToDelete.id}`);
      
      Toast.show({
        type: 'success',
        text1: 'Template Deleted',
        text2: `${templateToDelete.name} has been deleted`,
      });
      setDeleteModalVisible(false);
      setTemplateToDelete(null);
      fetchTemplates();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Delete Template',
        text2: error.response?.data?.message || 'Unable to delete template',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getQuestionCountText = (count: number) => {
    return `${count} question${count !== 1 ? 's' : ''}`;
  };

  const renderTemplateCard = ({ item }: { item: Template }) => {
    return (
      <TouchableOpacity
        className="bg-white rounded-xl mx-4 mb-3 p-4 shadow-sm border border-slate-100"
        onPress={() => openViewTemplateModal(item)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View className="flex-row justify-between items-start">
          <View className="flex-1 mr-3">
            <Text className="font-rubik-bold text-base text-slate-900 tracking-tight">
              {item.name}
            </Text>
            {item.description ? (
              <Text className="font-rubik text-xs text-slate-500 mt-1" numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => openEditTemplateModal(item)}
              className="w-8 h-8 rounded-lg bg-slate-100 items-center justify-center"
            >
              <Feather name="edit-2" size={14} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => confirmDeleteTemplate(item)}
              className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center"
            >
              <Feather name="trash-2" size={14} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View className="h-px bg-slate-100 my-3" />

        {/* Stats */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Feather name="file-text" size={12} color="#94A3B8" />
            <Text className="font-rubik text-xs text-slate-500 ml-1.5">
              {getQuestionCountText(item.questions.length)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Feather name="calendar" size={12} color="#94A3B8" />
            <Text className="font-rubik text-xs text-slate-500 ml-1.5">
              Created {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>

        {/* Question Preview */}
        {item.questions.length > 0 && (
          <View className="mt-3 pt-2 border-t border-slate-50">
            <View className="flex-row items-center mb-1">
              <Feather name="help-circle" size={10} color="#94A3B8" />
              <Text className="font-rubik-medium text-[10px] text-slate-400 ml-1">
                PREVIEW QUESTIONS
              </Text>
            </View>
            {item.questions.slice(0, 2).map((q, idx) => (
              <View key={q.id} className="flex-row items-center mt-1.5">
                <View className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-purple-400' : 'bg-slate-300'} mr-2`} />
                <Text className="font-rubik text-xs text-slate-600 flex-1" numberOfLines={1}>
                  {q.question}
                </Text>
                <Feather name={QuestionTypeIcons[q.questionType]} size={10} color="#94A3B8" />
              </View>
            ))}
            {item.questions.length > 2 && (
              <Text className="font-rubik text-[10px] text-slate-400 mt-1 ml-2.5">
                +{item.questions.length - 2} more questions
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View className="pt-4 px-4 pb-2">
      <SearchInput
        value={searchQuery}
        placeholder="Search templates by name..."
        onChangeText={handleSearchChange}
        onSearch={() => {
          fetchTemplates();
        }}
        onClear={clearSearch}
      />

      <View className="flex-row justify-between items-center mt-4 mb-2">
        <Text className="font-rubik text-xs text-slate-400 tracking-wide">
          {templates.length} template{templates.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity
          onPress={openCreateTemplateModal}
          style={{
            backgroundColor: colors.primary + '12',
            borderWidth: 1,
            borderColor: colors.primary + '40',
          }}
          className="flex-row items-center px-3 py-1.5 rounded-lg"
        >
          <Feather name="plus" size={14} color={colors.primary || '#8B5CF6'} />
          <Text
            style={{ color: colors.primary }}
            className="font-rubik-medium text-xs ml-1.5"
          >
            New Template
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading && templates.length === 0) return null;
    return (
      <View className="flex-1 items-center justify-center py-16 px-8">
        <View className="w-20 h-20 rounded-2xl bg-slate-100 items-center justify-center mb-4">
          <Feather name="clipboard" size={36} color="#CBD5E1" />
        </View>
        <Text className="font-rubik-bold text-lg text-slate-900 text-center">
          {searchQuery ? 'No templates found' : 'No question templates'}
        </Text>
        <Text className="font-rubik text-sm text-slate-400 text-center mt-2 leading-5">
          {searchQuery
            ? `No templates matching "${searchQuery}"`
            : 'Create templates with custom questions for employee verification'}
        </Text>
        {!searchQuery && (
          <Button
            title="Create Template"
            className="mt-4"
            onPress={openCreateTemplateModal}
          />
        )}
      </View>
    );
  };

  // Template Editor Modal (Create/Edit)
  const renderTemplateModal = () => (
    <Modal
      visible={isTemplateModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsTemplateModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-black/45">
          <View className="flex-1 mt-12">
            <View className="flex-1 bg-white rounded-t-3xl">
              {/* Header */}
              <View className="flex-row justify-between items-center px-5 pt-5 pb-3 border-b border-slate-100">
                <View>
                  <Text className="font-rubik-bold text-xl text-slate-900">
                    {isEditing ? 'Edit Template' : 'New Template'}
                  </Text>
                  <Text className="font-rubik text-xs text-slate-400 mt-0.5">
                    {isEditing ? 'Update your question template' : 'Create a new question template'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsTemplateModalVisible(false)}
                  className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center"
                >
                  <Feather name="x" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
                {/* Template Name */}
                <View className="mb-4">
                  <Text className="font-rubik-medium text-sm text-slate-700 mb-1.5">
                    Template Name <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className="bg-slate-50 rounded-xl px-4 py-3 font-rubik text-base text-slate-900 border border-slate-200"
                    placeholder="e.g., Standard Engineering Review"
                    placeholderTextColor="#94A3B8"
                    value={templateName}
                    onChangeText={setTemplateName}
                  />
                </View>

                {/* Template Description */}
                <View className="mb-4">
                  <Text className="font-rubik-medium text-sm text-slate-700 mb-1.5">
                    Description <Text className="text-slate-400 text-xs">(optional)</Text>
                  </Text>
                  <TextInput
                    className="bg-slate-50 rounded-xl px-4 py-3 font-rubik text-base text-slate-900 border border-slate-200"
                    placeholder="Brief description of when to use this template..."
                    placeholderTextColor="#94A3B8"
                    value={templateDescription}
                    onChangeText={setTemplateDescription}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {/* Questions Section */}
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="font-rubik-semibold text-base text-slate-900">
                    Questions <Text className="text-red-500">*</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={addQuestion}
                    className="flex-row items-center"
                  >
                    <Feather name="plus-circle" size={18} color={colors.primary || '#8B5CF6'} />
                    <Text style={{ color: colors.primary }} className="font-rubik-medium text-sm ml-1">
                      Add Question
                    </Text>
                  </TouchableOpacity>
                </View>

                {questions.length === 0 ? (
                  <View className="bg-slate-50 rounded-xl p-8 items-center border border-slate-200 border-dashed">
                    <Feather name="help-circle" size={32} color="#CBD5E1" />
                    <Text className="font-rubik text-sm text-slate-400 text-center mt-2">
                      No questions added yet
                    </Text>
                    <Text className="font-rubik text-xs text-slate-300 text-center">
                      Tap "Add Question" to get started
                    </Text>
                  </View>
                ) : (
                  questions.map((q, idx) => (
                    <View
                      key={idx}
                      className="bg-white rounded-xl mb-3 border border-slate-200 overflow-hidden"
                    >
                      {/* Question Header */}
                      <View className="flex-row justify-between items-center p-3 bg-slate-50 border-b border-slate-200">
                        <View className="flex-row items-center">
                          <View className="w-5 h-5 rounded-full bg-purple-100 items-center justify-center mr-2">
                            <Text className="font-rubik-bold text-xs text-purple-600">
                              {idx + 1}
                            </Text>
                          </View>
                          <Feather name={QuestionTypeIcons[q.questionType]} size={14} color="#8B5CF6" />
                          <Text className="font-rubik-medium text-xs text-purple-600 ml-1.5">
                            {QuestionTypeLabels[q.questionType]}
                          </Text>
                          {q.required && (
                            <View className="ml-2 px-1.5 py-0.5 bg-red-50 rounded">
                              <Text className="font-rubik text-[10px] text-red-500">Required</Text>
                            </View>
                          )}
                        </View>
                        <View className="flex-row gap-2">
                          <TouchableOpacity onPress={() => moveQuestion(idx, 'up')}>
                            <Feather name="arrow-up" size={16} color="#94A3B8" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => moveQuestion(idx, 'down')}>
                            <Feather name="arrow-down" size={16} color="#94A3B8" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => editQuestion(idx)}>
                            <Feather name="edit-2" size={16} color="#64748B" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => removeQuestion(idx)}>
                            <Feather name="trash-2" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Question Content */}
                      <View className="p-3">
                        <Text className="font-rubik-medium text-sm text-slate-900">
                          {q.question}
                        </Text>
                        {q.questionType === 'multiple_choice' && q.options && (
                          <View className="mt-2 flex-row flex-wrap gap-1.5">
                            {q.options.map((opt, optIdx) => (
                              <View key={optIdx} className="px-2 py-1 bg-slate-100 rounded-full">
                                <Text className="font-rubik text-xs text-slate-600">{opt}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  ))
                )}

                {/* Spacing for bottom button */}
                <View className="h-6" />
              </ScrollView>

              {/* Footer Buttons */}
              <View className="px-5 py-4 border-t border-slate-100 flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setIsTemplateModalVisible(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100"
                >
                  <Text className="font-rubik-medium text-center text-slate-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveTemplate}
                  disabled={isSaving}
                  style={{ backgroundColor: colors.primary }}
                  className="flex-1 py-3 rounded-xl"
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="font-rubik-semibold text-center text-white">
                      {isEditing ? 'Update Template' : 'Create Template'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Question Editor Modal
  const renderQuestionModal = () => (
    <Modal
      visible={isQuestionModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsQuestionModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-black/45 justify-end">
          <View className="bg-white rounded-t-3xl">
            {/* Header */}
            <View className="flex-row justify-between items-center p-5 border-b border-slate-100">
              <Text className="font-rubik-bold text-lg text-slate-900">
                {editingQuestionIndex !== null ? 'Edit Question' : 'Add Question'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsQuestionModalVisible(false)}
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
              >
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
              {/* Question Text */}
              <View className="mb-4">
                <Text className="font-rubik-medium text-sm text-slate-700 mb-1.5">
                  Question <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="bg-slate-50 rounded-xl px-4 py-3 font-rubik text-base text-slate-900 border border-slate-200"
                  placeholder="Enter question text..."
                  placeholderTextColor="#94A3B8"
                  value={questionText}
                  onChangeText={setQuestionText}
                  multiline
                />
              </View>

              {/* Question Type */}
              <View className="mb-4">
                <Text className="font-rubik-medium text-sm text-slate-700 mb-1.5">
                  Type <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(['text', 'multiple_choice', 'boolean', 'rating'] as QuestionType[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setQuestionType(type)}
                      className={`px-3 py-2 rounded-lg border ${
                        questionType === type
                          ? 'bg-purple-50 border-purple-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <View className="flex-row items-center">
                        <Feather
                          name={QuestionTypeIcons[type]}
                          size={14}
                          color={questionType === type ? '#8B5CF6' : '#94A3B8'}
                        />
                        <Text
                          className={`font-rubik-medium text-sm ml-1.5 ${
                            questionType === type ? 'text-purple-600' : 'text-slate-600'
                          }`}
                        >
                          {QuestionTypeLabels[type]}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Multiple Choice Options */}
              {questionType === 'multiple_choice' && (
                <View className="mb-4">
                  <Text className="font-rubik-medium text-sm text-slate-700 mb-1.5">
                    Options <Text className="text-red-500">*</Text>
                  </Text>
                  {questionOptions.map((opt, idx) => (
                    <View key={idx} className="flex-row items-center mb-2">
                      <View className="flex-1 flex-row items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                        <Feather name="circle" size={12} color="#94A3B8" />
                        <Text className="font-rubik text-sm text-slate-700 ml-2 flex-1">
                          {opt}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeOption(idx)}
                        className="ml-2 w-8 h-8 rounded-lg bg-red-50 items-center justify-center"
                      >
                        <Feather name="x" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <View className="flex-row items-center gap-2">
                    <TextInput
                      className="flex-1 bg-slate-50 rounded-lg px-3 py-2 font-rubik text-sm text-slate-900 border border-slate-200"
                      placeholder="Enter an option"
                      placeholderTextColor="#94A3B8"
                      value={optionInput}
                      onChangeText={setOptionInput}
                      onSubmitEditing={addOption}
                    />
                    <TouchableOpacity
                      onPress={addOption}
                      className="px-3 py-2 rounded-lg bg-purple-50 border border-purple-200"
                    >
                      <Text className="font-rubik-medium text-sm text-purple-600">Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Required Toggle */}
              <View className="flex-row justify-between items-center py-2">
                <View>
                  <Text className="font-rubik-medium text-sm text-slate-700">Required</Text>
                  <Text className="font-rubik text-xs text-slate-400">
                    Make this question mandatory
                  </Text>
                </View>
                <Switch
                  value={questionRequired}
                  onValueChange={setQuestionRequired}
                  trackColor={{ false: '#E2E8F0', true: colors.primary + '80' }}
                  thumbColor={questionRequired ? colors.primary : '#FFFFFF'}
                />
              </View>

              {/* Buttons */}
              <View className="flex-row gap-3 mt-6 mb-4">
                <TouchableOpacity
                  onPress={() => setIsQuestionModalVisible(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100"
                >
                  <Text className="font-rubik-medium text-center text-slate-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveQuestion}
                  style={{ backgroundColor: colors.primary }}
                  className="flex-1 py-3 rounded-xl"
                >
                  <Text className="font-rubik-semibold text-center text-white">
                    {editingQuestionIndex !== null ? 'Update' : 'Add'} Question
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // View Template Modal
  const renderViewTemplateModal = () => {
    if (!viewingTemplate) return null;

    return (
      <Modal
        visible={viewTemplateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setViewTemplateModalVisible(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-12 bg-white rounded-t-3xl">
            {/* Header */}
            <View className="flex-row justify-between items-center p-5 border-b border-slate-100">
              <View className="flex-1 mr-3">
                <Text className="font-rubik-bold text-xl text-slate-900">
                  {viewingTemplate.name}
                </Text>
                {viewingTemplate.description && (
                  <Text className="font-rubik text-xs text-slate-500 mt-0.5">
                    {viewingTemplate.description}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setViewTemplateModalVisible(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center"
              >
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
              {/* Metadata */}
              <View className="flex-row justify-between mb-5 pb-3 border-b border-slate-100">
                <View className="flex-row items-center">
                  <Feather name="file-text" size={14} color="#94A3B8" />
                  <Text className="font-rubik text-xs text-slate-500 ml-1.5">
                    {getQuestionCountText(viewingTemplate.questions.length)}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Feather name="calendar" size={14} color="#94A3B8" />
                  <Text className="font-rubik text-xs text-slate-500 ml-1.5">
                    Created {formatDate(viewingTemplate.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Questions List */}
              <Text className="font-rubik-semibold text-sm text-slate-700 mb-3">
                Questions
              </Text>
              {viewingTemplate.questions.map((q, idx) => (
                <View
                  key={q.id}
                  className="bg-slate-50 rounded-xl p-4 mb-3 border border-slate-100"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center mb-2">
                        <View className="w-5 h-5 rounded-full bg-purple-100 items-center justify-center mr-2">
                          <Text className="font-rubik-bold text-xs text-purple-600">
                            {idx + 1}
                          </Text>
                        </View>
                        <Text className="font-rubik-medium text-sm text-slate-900 flex-1">
                          {q.question}
                        </Text>
                      </View>
                      <View className="flex-row items-center ml-7">
                        <Feather name={QuestionTypeIcons[q.questionType]} size={12} color="#8B5CF6" />
                        <Text className="font-rubik text-xs text-purple-600 ml-1">
                          {QuestionTypeLabels[q.questionType]}
                        </Text>
                        {q.required && (
                          <Text className="font-rubik text-xs text-red-500 ml-2">
                            • Required
                          </Text>
                        )}
                      </View>
                      {q.questionType === 'multiple_choice' && q.options && (
                        <View className="mt-3 ml-7 flex-row flex-wrap gap-1.5">
                          {q.options.map((opt, optIdx) => (
                            <View key={optIdx} className="px-2 py-1 bg-white rounded-full border border-slate-200">
                              <Text className="font-rubik text-xs text-slate-600">{opt}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Footer */}
            <View className="p-5 border-t border-slate-100 flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setViewTemplateModalVisible(false);
                  openEditTemplateModal(viewingTemplate);
                }}
                style={{ backgroundColor: colors.primary }}
                className="flex-1 py-3 rounded-xl"
              >
                <Text className="font-rubik-semibold text-center text-white">Edit Template</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewTemplateModalVisible(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100"
              >
                <Text className="font-rubik-medium text-center text-slate-600">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading && templates.length === 0) {
    return (
      <View className="flex-1 bg-slate-50">
        <Header title="Question Templates" />
        <Loader fullScreen />
      </View>
    );
  }

  return (
    <>
      <View className="flex-1 bg-slate-50">
        <Header title="Question Templates" />

        <FlatList
          data={templates}
          renderItem={renderTemplateCard}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 100,
          }}
        />
      </View>

      {renderTemplateModal()}
      {renderQuestionModal()}
      {renderViewTemplateModal()}

      {/* Delete Confirmation Popup */}
      <ConfirmationPopup
        visible={deleteModalVisible}
        title="Delete Template"
        message={`Are you sure you want to delete "${templateToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteTemplate}
        onCancel={() => {
          setDeleteModalVisible(false);
          setTemplateToDelete(null);
        }}
      />
    </>
  );
};

export default QuestionTemplatesScreen;