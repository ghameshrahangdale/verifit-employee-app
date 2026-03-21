// src/utils/verificationHelpers.ts

interface StatusConfig {
  bg: string;
  border: string;
  text: string;
  label: string;
  icon: string;
}

export const getStatusConfig = (status: string): StatusConfig => {
  const configs: Record<string, StatusConfig> = {
    PENDING: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      label: 'PENDING',
      icon: 'clock',
    },
    VERIFIED: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      label: 'VERIFIED',
      icon: 'check-circle',
    },
    APPROVED: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      label: 'VERIFIED',
      icon: 'check-circle',
    },
    REJECTED: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      label: 'REJECTED',
      icon: 'x-circle',
    },
    DISCREPANCIES: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      label: 'DISCREPANCIES',
      icon: 'alert-triangle',
    },
  };
  return configs[status as keyof typeof configs] || configs.PENDING;
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getEmploymentTypeLabel = (type: string): string => {
  const types: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    internship: 'Internship',
    temporary: 'Temporary',
  };
  return types[type] || type.replace(/_/g, ' ');
};

export const getDocumentTypeLabel = (type: string): string => {
  const types: Record<string, string> = {
    resume: 'Resume',
    experience_letter: 'Experience Letter',
    offer_letter: 'Offer Letter',
    relieving_letter: 'Relieving Letter',
    payslip: 'Payslip',
    id_proof: 'ID Proof',
    address_proof: 'Address Proof',
    education_certificate: 'Education Certificate',
    other: 'Other',
  };
  return types[type] || type.replace(/_/g, ' ');
};

export const getSalaryTypeLabel = (type: string): string => {
  const types: Record<string, string> = {
    basic: 'Basic Salary',
    hra: 'HRA',
    special_allowance: 'Special Allowance',
    bonus: 'Bonus',
    gross: 'Gross Salary',
    other: 'Other',
  };
  return types[type] || type.replace(/_/g, ' ');
};

export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    AED: 'د.إ',
    SGD: 'S$',
  };
  return symbols[currency] || currency;
};

// Optional: Export a default object with all helpers
const verificationHelpers = {
  getStatusConfig,
  formatDate,
  formatDateTime,
  getEmploymentTypeLabel,
  getDocumentTypeLabel,
  getSalaryTypeLabel,
  getCurrencySymbol,
};

export default verificationHelpers;