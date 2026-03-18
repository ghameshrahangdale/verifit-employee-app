export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  text: string;
  error: string;
  success: string;
  warning: string;
}

export interface ProfileData {
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
}

export interface OrganizationData {
  id: string;
  name: string;
  mobileNumber: string;
  businessEmail: string;
  companyWebsite: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  panNumber: string;
  companyType: string;
  cinNumber: string | null;
  udyamNumber: string | null;
  companySize: string;
  logoUrl: string | null;
  isOnboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserData {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  profileImage?: string;
  phone?: string;
  organization?: OrganizationData;
}

export interface Discrepancy {
  id: string;
  fieldName: string;
  employeeClaimedValue: string;
  teamworkRaring:number;
  actualValue: string;
  remarks?: string;
  createdAt: string;
}

export interface BehaviorReport {
  teamworkRating: number;
  leadershipRating: number;
  communicationRating: number;
  integrityRating: number;
  performanceRating: number;
  policyViolation: boolean;
  disciplinaryAction: boolean;
  rehireRecommendation: boolean;
  remarks: string;
}

export interface ReviewData {
  status: 'APPROVED' | 'REJECTED' | 'DISCREPANCIES';
  verificationMethod: 'MANUAL' | 'AUTO' | 'PARTIAL';
  comments: string;
  discrepancies: Discrepancy[];
  behaviorReport: BehaviorReport;
}

export interface FieldStatus {
  [key: string]: {
    confirmed: boolean | null;
    actualValue: string;
    showInput: boolean;
  };
}

export interface SalaryRecord {
  id: string;
  salaryType: string;
  amount: string;
  currency: string;
  frequency: string;
  bonusAmount: string | null;
  stockOptions: string | null;
  effectiveDate: string;
  verified: boolean;
}

export interface Document {
  id: string;
  title: string;
  documentType: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  verified: boolean;
  uploadedAt: string;
}

export interface Candidate {
  employeeId: string;
  name: string;
  email: string;
  phone: string | null;
  designation: string;
  department: string;
  linkedinUrl: string | null;
}

export interface EmploymentRecord {
  id: string;
  companyName: string;
  designation: string;
  department: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  location: string;
  managerName: string;
  managerEmail: string;
  hrEmail: string;
  reasonForLeaving: string;
  rehireEligible: boolean;
  verificationStatus: string;
  verifiedAt: string | null;
}

export interface VerificationRequestDetails {
  verificationResponse: any;
  verificationRequest: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_REVIEW' | 'DISCREPANCIES';
    requestedAt: string;
    completedAt: string | null;
    verificationMethod: string | null;
    isPending: boolean;
    isCompleted: boolean;
    timeToComplete: string | null;
    verificationResponse: any;
  };
  employmentRecord: EmploymentRecord;
  candidate: Candidate;
  salaryRecords: SalaryRecord[];
  discrepancies: any[];
  documents: Document[];
}

export interface BehaviorReport {
  id: string;
  employmentRecordId: string;
  teamworkRating: number;
  leadershipRating: number;
  communicationRating: number;
  integrityRating: number;
  performanceRating: number;
  policyViolation: boolean;
  disciplinaryAction: boolean;
  rehireRecommendation: boolean;
  remarks: string;
  createdBy: string;
  createdAt: string;
}
export interface VerificationResponse {
  id: string;
  employmentConfirmed: boolean;
  designationConfirmed: boolean;
  salaryConfirmed: boolean;
  tenureConfirmed: boolean;
  behaviorConfirmed: boolean;
  companyNameConfirmed: boolean;
  departmentConfirmed: boolean;
  employmentTypeConfirmed: boolean;
  locationConfirmed: boolean;
  startDateConfirmed: boolean;
  endDateConfirmed: boolean;
  documentsConfirmed: boolean;
  reasonForLeavingConfirmed: boolean;
  comments: string;
  status: string;
  verifiedAt: string;
  verifiedByUserId: string;
}
