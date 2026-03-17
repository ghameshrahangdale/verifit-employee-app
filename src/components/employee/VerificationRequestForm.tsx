import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';
import Toast from 'react-native-toast-message';
import Input from '../ui/Input';
import { pick } from '@react-native-documents/picker';
import axios from 'axios';
import http from '../../services/http.api';

interface VerificationRequestFormProps {
  onSubmit: (data: VerificationFormData, documents: DocumentFile[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: VerificationFormData;
  isEdit?: boolean;
}

export interface SalaryRecord {
  salaryType: 'basic' | 'hra' | 'special_allowance' | 'bonus' | 'other';
  amount: number;
  currency: string;
  frequency: 'monthly' | 'annually' | 'quarterly';
  effectiveDate: string;
}

export interface VerificationFormData {
  organizationId: any;
  // companyName: string;
  designation: string;
  department: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary';
  startDate: string;
  endDate?: string;
  hrEmail: string;
  location: string;
  reasonForLeaving?: string;
  salary?: SalaryRecord;
  verificationType: 'organization' | 'hr'; // New field for radio selection
}

export interface DocumentFile {
  uri: string;
  name: string;
  type: string;
  documentType: string;
  title: string;
}

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

interface Company {
  id: string;
  name: string;
}

const employmentTypeOptions = [
  { label: 'Full Time', value: 'full_time' },
  { label: 'Part Time', value: 'part_time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Internship', value: 'internship' },
  { label: 'Temporary', value: 'temporary' },
];

const documentTypeOptions = [
  { label: 'Resume', value: DocumentType.RESUME },
  { label: 'Experience Letter', value: DocumentType.EXPERIENCE_LETTER },
  { label: 'Offer Letter', value: DocumentType.OFFER_LETTER },
  { label: 'Relieving Letter', value: DocumentType.RELIEVING_LETTER },
  { label: 'Payslip', value: DocumentType.PAYSLIP },
  { label: 'ID Proof', value: DocumentType.ID_PROOF },
  { label: 'Address Proof', value: DocumentType.ADDRESS_PROOF },
  { label: 'Education Certificate', value: DocumentType.EDUCATION_CERTIFICATE },
  { label: 'Other', value: DocumentType.OTHER },
];

const salaryTypeOptions = [
  { label: 'Basic', value: 'basic' },
  { label: 'HRA', value: 'hra' },
  { label: 'Special Allowance', value: 'special_allowance' },
  { label: 'Bonus', value: 'bonus' },
  { label: 'Other', value: 'other' },
];

const currencyOptions = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'GBP', value: 'GBP' },
  { label: 'INR', value: 'INR' },
  { label: 'AED', value: 'AED' },
  { label: 'SGD', value: 'SGD' },
];

const frequencyOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Annually', value: 'annual' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'One Time', value: 'one_time' },
];

const VerificationRequestForm: React.FC<VerificationRequestFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
  isEdit = false,
}) => {
  const { colors } = useTheme();

  const [currentStep, setCurrentStep] = useState(1);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companyPage, setCompanyPage] = useState(1);
  const [hasMoreCompanies, setHasMoreCompanies] = useState(true);

  const [formData, setFormData] = useState<VerificationFormData>(
    initialData || {
      organizationId: undefined,
      // companyName: '',
      designation: '',
      department: '',
      employmentType: 'full_time',
      startDate: '',
      endDate: '',
      hrEmail: '',
      location: '',
      reasonForLeaving: '',
      salary: undefined,
      verificationType: 'organization', // Default to organization
    }
  );

  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [showDocumentForm, setShowDocumentForm] = useState(false);

  const [documentForm, setDocumentForm] = useState({
    documentType: DocumentType.RESUME,
    title: '',
  });

  const [salaryForm, setSalaryForm] = useState<SalaryRecord>({
    salaryType: 'basic',
    amount: 0,
    currency: 'USD',
    frequency: 'monthly',
    effectiveDate: '',
  });

  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof VerificationFormData, string>>>({});

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async (page: number = 1) => {
    if (loadingCompanies) return;

    setLoadingCompanies(true);
    try {
      const response = await http.get(`api/organization?page=${page}&limit=20`);

      const newCompanies = response.data.data;

      if (page === 1) {
        setCompanies(newCompanies);
      } else {
        setCompanies(prev => [...prev, ...newCompanies]);
      }

      setHasMoreCompanies(response.data.pagination.hasNextPage);
      setCompanyPage(page);

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Companies',
        text2: 'Unable to fetch company list',
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadMoreCompanies = () => {
    if (hasMoreCompanies && !loadingCompanies) {
      fetchCompanies(companyPage + 1);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof VerificationFormData, string>> = {};

    if (step === 1) {
      // Validate based on verification type
      if (formData.verificationType === 'organization') {
        if (!formData.organizationId) {
          newErrors.organizationId = 'Company is required';
        }
        // HR email is hidden for organization type, so no validation needed
      } else {
        // HR type - validate HR email
        if (!formData.hrEmail.trim()) {
          newErrors.hrEmail = 'HR email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.hrEmail)) {
          newErrors.hrEmail = 'Invalid email format';
        }
      }

      // Common validations for both types
      if (!formData.designation.trim()) {
        newErrors.designation = 'Designation is required';
      }
      if (!formData.department.trim()) {
        newErrors.department = 'Department is required';
      }
      if (!formData.startDate) {
        newErrors.startDate = 'Start date is required';
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.startDate)) {
        newErrors.startDate = 'Date must be in YYYY-MM-DD format';
      }
      if (formData.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(formData.endDate)) {
        newErrors.endDate = 'Date must be in YYYY-MM-DD format';
      }
      if (!formData.employmentType) {
        newErrors.employmentType = 'Employment type is required';
      }
      if (!formData.location.trim()) {
        newErrors.location = 'Location is required';
      }
    } else if (step === 2) {
      // Validate salary information if any salary record exists
      if (formData.salary) {
        const salary = formData.salary;
        if (!salary.amount || salary.amount <= 0) {
          newErrors.salary = 'Valid salary amount is required';
        }
        if (!salary.effectiveDate) {
          newErrors.salary = 'Effective date is required';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all required fields correctly',
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    // Get company name from selected company if organization type
    let companyName = '';
    if (formData.verificationType === 'organization' && formData.organizationId) {
      const selectedCompany = companies.find(c => c.id === formData.organizationId);
      companyName = selectedCompany?.name || '';
    }

    const finalData = {
      ...formData,
      ...(formData.verificationType === 'organization' && {
        organizationId: formData.organizationId,
      }),
      salary: formData.salary || undefined,
    };

    try {
      await onSubmit(finalData, documents);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error.response?.data?.message || 'Failed to submit verification request',
      });
    }
  };

  const updateField = (field: keyof VerificationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const updateSalaryField = (field: keyof SalaryRecord, value: any) => {
    setSalaryForm(prev => ({ ...prev, [field]: value }));
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

  const handleAddDocument = () => {
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

    const newDocument: DocumentFile = {
      uri: selectedFile.uri,
      name: selectedFile.name,
      type: selectedFile.type,
      documentType: documentForm.documentType,
      title: documentForm.title.trim(),
    };

    setDocuments(prev => [...prev, newDocument]);

    setDocumentForm({
      documentType: DocumentType.RESUME,
      title: '',
    });
    setSelectedFile(null);
    setShowDocumentForm(false);
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const resetDocumentForm = () => {
    setDocumentForm({
      documentType: DocumentType.RESUME,
      title: '',
    });
    setSelectedFile(null);
    setShowDocumentForm(false);
  };

  const getDocumentTypeLabel = (type: DocumentType): string => {
    const option = documentTypeOptions.find(opt => opt.value === type);
    return option?.label || type;
  };

  const updateSalary = (updatedFields: Partial<SalaryRecord>) => {
    setSalaryForm(prev => {
      const updated = { ...prev, ...updatedFields };

      setFormData(formPrev => ({
        ...formPrev,
        salary: updated, // ✅ always object
      }));

      return updated;
    });
  };

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: 'Employment Details' },
      { number: 2, title: 'Salary Information' },
      { number: 3, title: 'Documents' },
    ];

    return (
      <View className="px-6 pt-4 pb-6">
        <View className="flex-row items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.number;
            const isActive = currentStep === step.number;

            return (
              <React.Fragment key={step.number}>
                {/* Step */}
                <View className="items-center flex-1">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mb-2"
                    style={{
                      backgroundColor: isCompleted || isActive
                        ? colors.primary
                        : '#F3F4F6',
                      borderWidth: isActive ? 3 : 0,
                      borderColor: colors.primary + '30',
                    }}
                  >
                    {isCompleted ? (
                      <Feather name="check" size={18} color="#fff" />
                    ) : (
                      <Text
                        className="font-rubik-medium text-base"
                        style={{
                          color: isActive ? '#fff' : '#9CA3AF',
                        }}
                      >
                        {step.number}
                      </Text>
                    )}
                  </View>

                  <Text
                    className="font-rubik text-xs text-center"
                    style={{
                      color: isCompleted || isActive
                        ? '#1F2937'
                        : '#9CA3AF',
                    }}
                  >
                    {step.title}
                  </Text>
                </View>

                {/* Connector */}
                {index < steps.length - 1 && (
                  <View className="flex-1 items-center">
                    <View
                      className="h-0.5 w-full rounded-full"
                      style={{
                        backgroundColor:
                          currentStep > step.number
                            ? colors.primary
                            : '#E5E7EB',
                      }}
                    />
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>
    );
  };

  const renderVerificationTypeSelector = () => (
    <View className="mb-6">
      <Text className="font-rubik-medium text-sm text-gray-700 mb-3">
        Verification Type <Text className="text-red-500">*</Text>
      </Text>
      <View className="flex-row gap-4">
        {/* Organization */}
        <TouchableOpacity
          onPress={() => {
            setFormData(prev => ({
              ...prev,
              verificationType: 'organization',
              hrEmail: ''
            }));
          }}
          className="flex-1 p-4 rounded-xl border"
          style={{
            borderColor: formData.verificationType === 'organization'
              ? colors.primary
              : '#E5E7EB',
            backgroundColor: formData.verificationType === 'organization'
              ? `${colors.primary}10`
              : 'transparent',
          }}
          activeOpacity={0.8}
        >
          <Text
            className="font-rubik-medium text-base"
            style={{
              color: formData.verificationType === 'organization'
                ? colors.primary
                : '#1F2937',
            }}
          >
            Organization
          </Text>

          <Text className="font-rubik text-xs mt-1 text-gray-500">
            Verify through company
          </Text>
        </TouchableOpacity>

        {/* HR */}
        <TouchableOpacity
          onPress={() => {
            setFormData(prev => ({
              ...prev,
              verificationType: 'hr',
            }));
          }}
          className="flex-1 p-4 rounded-xl border"
          style={{
            borderColor: formData.verificationType === 'hr'
              ? colors.primary
              : '#E5E7EB',
            backgroundColor: formData.verificationType === 'hr'
              ? `${colors.primary}10`
              : 'transparent',
          }}
          activeOpacity={0.8}
        >
          <Text
            className="font-rubik-medium text-base"
            style={{
              color: formData.verificationType === 'hr'
                ? colors.primary
                : '#1F2937',
            }}
          >
            HR
          </Text>

          <Text className="font-rubik text-xs mt-1 text-gray-500">
            Verify directly with HR
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View>
      {renderVerificationTypeSelector()}

      {/* Conditional rendering based on verification type */}
      {formData.verificationType === 'organization' ? (
        <>
          {/* Company Name - Select Input */}
          <Input
            label="Company Name"
            value={formData.organizationId}
            onChangeText={(text) => updateField('organizationId', text)}
            placeholder="Select company"
            error={errors.organizationId}
            required
            type="select"
            options={companies.map(company => ({
              label: company.name,
              value: company.id
            }))}
          />

          {loadingCompanies && (
            <View className="items-center py-2">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </>
      ) : (
        <>
          {/* HR Email - Only shown for HR type */}
          <Input
            label="HR Email"
            value={formData.hrEmail}
            onChangeText={(text) => updateField('hrEmail', text)}
            placeholder="hr@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.hrEmail}
            required
          />


        </>
      )}

      {/* Designation & Department Row */}
      <View className="flex-col">
        <View className="flex-1">
          <Input
            label="Designation"
            value={formData.designation}
            onChangeText={(text) => updateField('designation', text)}
            placeholder="e.g. Software Engineer"
            error={errors.designation}
            required
          />
        </View>

        <View className="flex-1">
          <Input
            label="Department"
            value={formData.department}
            onChangeText={(text) => updateField('department', text)}
            placeholder="e.g. Engineering"
            error={errors.department}
            required
          />
        </View>
      </View>

      {/* Employment Type - Select Input */}
      <Input
        label="Employment Type"
        value={formData.employmentType}
        onChangeText={(text) => updateField('employmentType', text as any)}
        placeholder="Select employment type"
        required
        type="select"
        options={employmentTypeOptions}
      />

      {/* Dates Row */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Input
            label="Start Date"
            value={formData.startDate}
            onChangeText={(text) => updateField('startDate', text)}
            placeholder="YYYY-MM-DD"
            error={errors.startDate}
            required
            type='date'
          />
        </View>

        <View className="flex-1">
          <Input
            label="End Date"
            value={formData.endDate || ''}
            onChangeText={(text) => updateField('endDate', text)}
            placeholder="YYYY-MM-DD (optional)"
            error={errors.endDate}
            type='date'
          />
        </View>
      </View>

      {/* Location */}
      <Input
        label="Location"
        value={formData.location}
        onChangeText={(text) => updateField('location', text)}
        placeholder="e.g. New York, NY"
        error={errors.location}
        required
      />

      {/* Reason for Leaving (Optional) */}
      <Input
        label="Reason for Leaving"
        value={formData.reasonForLeaving || ''}
        onChangeText={(text) => updateField('reasonForLeaving', text)}
        placeholder="Please provide reason for leaving (if applicable)"
        multiline
        numberOfLines={3}
      />
    </View>
  );

  const renderStep2 = () => (
    <View>
      <View className="mt-4">
        <Text className="font-rubik-medium text-base text-gray-800 mb-4">
          Salary Information
        </Text>

        {/* Salary Type */}
        <Input
          label="Salary Type"
          value={salaryForm.salaryType}
          onChangeText={(text) =>
            updateSalary({ salaryType: text as SalaryRecord['salaryType'] })
          }
          placeholder="Select salary type"
          required
          type="select"
          options={salaryTypeOptions}
        />

        {/* Amount */}
        <Input
          label="Amount"
          value={salaryForm.amount ? salaryForm.amount.toString() : ''}
          onChangeText={(text) => {
            const amount = parseFloat(text) || 0;
            updateSalary({ amount });
          }}
          placeholder="0.00"
          keyboardType="numeric"
          required
        />

        {/* Currency */}
        <Input
          label="Currency"
          value={salaryForm.currency}
          onChangeText={(text) =>
            updateSalary({ currency: text })
          }
          placeholder="Select currency"
          required
          type="select"
          options={currencyOptions}
        />

        {/* Frequency */}
        <Input
          label="Frequency"
          value={salaryForm.frequency}
          onChangeText={(text) =>
            updateSalary({ frequency: text as SalaryRecord['frequency'] })
          }
          placeholder="Select frequency"
          required
          type="select"
          options={frequencyOptions}
        />

        {/* Effective Date */}
        <Input
          label="Effective Date"
          value={salaryForm.effectiveDate}
          onChangeText={(text) =>
            updateSalary({ effectiveDate: text })
          }
          placeholder="YYYY-MM-DD"
          required
          type="date"
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      {/* Documents Section */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="font-rubik-medium text-base text-gray-800">
            Supporting Documents
          </Text>
          {!showDocumentForm && (
            <TouchableOpacity
              onPress={() => setShowDocumentForm(true)}
              className="p-2 rounded-full"
              style={{
                backgroundColor: `${colors.primary}0D`,
                borderColor: `${colors.primary}25`,
              }}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {showDocumentForm ? (
          // Document Upload Form
          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <Text className="font-rubik-medium text-sm text-gray-700 mb-3">
              Add Document
            </Text>

            {/* Document Type Selection - Select Input */}
            <Input
              label="Document Type"
              value={documentForm.documentType}
              onChangeText={(text) => setDocumentForm(prev => ({ ...prev, documentType: text as DocumentType }))}
              placeholder="Select document type"
              required
              type="select"
              options={documentTypeOptions}
            />

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
                    <Feather name="file" size={20} color="#6366F1" />
                    <Text className="font-rubik text-sm text-gray-700 ml-2 flex-1" numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedFile(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="x" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handlePickFile}
                  className="border border-gray-200 border-dashed rounded-xl p-6 items-center"
                >
                  <Feather name="upload-cloud" size={32} color="#9CA3AF" />
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
                onPress={resetDocumentForm}
                disabled={isUploading}
              />
              <Button
                title="Add Document"
                className="flex-1"
                onPress={handleAddDocument}
              />
            </View>
          </View>
        ) : (
          // Display Added Documents
          documents.length > 0 && (
            <View className="mb-4">
              {documents.map((doc, index) => (
                <View
                  key={index}
                  className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 flex-row">
                      <View className="mr-3">
                        <View className="w-10 h-10 bg-indigo-100 rounded-lg items-center justify-center">
                          <Feather name="file-text" size={20} color="#6366F1" />
                        </View>
                      </View>
                      <View className="flex-1">
                        <Text className="font-rubik-medium text-base text-gray-800 mb-1">
                          {doc.title}
                        </Text>
                        <Text className="font-rubik text-sm text-gray-600 mb-1">
                          {getDocumentTypeLabel(doc.documentType as DocumentType)}
                        </Text>
                        <Text className="font-rubik text-xs text-gray-400">
                          {doc.name}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleRemoveDocument(index)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      className="ml-2"
                    >
                      <Feather name="trash-2" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )
        )}

        {/* Add Document Button (when not showing form and no documents) */}
        {!showDocumentForm && documents.length === 0 && (
          <TouchableOpacity
            onPress={() => setShowDocumentForm(true)}
            className="border border-gray-200 border-dashed rounded-xl p-6 items-center"
          >
            <Feather name="upload-cloud" size={32} color="#9CA3AF" />
            <Text className="font-rubik-medium text-sm text-gray-600 mt-2">
              Add Supporting Documents
            </Text>
            <Text className="font-rubik text-xs text-gray-400 mt-1">
              Upload resumes, offer letters, experience letters, etc.
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  const renderStepButtons = () => {
    if (currentStep === 3) {
      return (
        <View className="flex-col gap-3 mt-6">
          <Button
            title="Previous"
            onPress={handlePrevious}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            title={isEdit ? 'Update Request' : 'Submit Request'}
            onPress={handleSubmit}
            className="flex-1"
            loading={isLoading}
            disabled={isLoading}
          />
        </View>
      );
    }

    return (
      <View className="flex-col gap-3 mt-6">
        {currentStep > 1 && (
          <Button
            title="Previous"
            onPress={handlePrevious}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          />
        )}
        <Button
          title="Next"
          onPress={handleNext}
          className={currentStep > 1 ? "flex-1" : "w-full"}
          disabled={isLoading}

        />
      </View>
    );
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {renderStepIndicator()}

      <View className="p-6">
        {renderStepContent()}
        {renderStepButtons()}

      </View>
    </ScrollView>
  );
};

export default VerificationRequestForm;