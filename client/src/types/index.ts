export type UserRole = 'member' | 'manager' | 'ceo';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  domain: string;
  reportsTo?: {
    _id: string;
    name: string;
    email: string;
    designation?: string;
  } | string | null;
  skills: string[];
  phone: string;
  joinDate: string;
  status: 'active' | 'inactive';
  totpEnabled: boolean;
  onboardingCompleted?: boolean;
  onboardingSkipped?: boolean;
  isTemporaryPassword?: boolean;
}

export type NavTab = 
  | 'Home'
  | 'People'
  | 'Organisation'
  | 'Attendance'
  | 'Work'
  | 'Contributions'
  | 'Salary'
  | 'Bulletin'
  | 'Approvals'
  | 'Wiki'
  | 'CRM Access';

export interface DirectoryEntry {
  _id: string;
  email: string;
  name: string;
  designation: string;
  department: string;
  status: 'active' | 'revoked';
  registered: boolean;
  onboardingCompleted: boolean;
  registeredUserId: string | null;
  addedByEmail: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetails {
  companyName: string;
  scaleMetric: string;
  industry: string;
  tier: 'Enterprise (10k+ shifts)' | 'Growth (2k-10k shifts)' | 'Pilot (<2k shifts)';
  contactPerson?: string;
  contactEmail?: string;
  website?: string;
  privacyPolicyUrl?: string;
  privacyPolicySummary?: string;
  slaTerms?: string;
  headquarters?: string;
  activeCities?: string[];
  status: 'active' | 'onboarding' | 'contract_pending' | 'churned';
}

export interface WikiArticleItem {
  _id: string;
  title: string;
  slug: string;
  category: 'Enterprise Customer' | 'Case Study' | 'Privacy & Compliance' | 'Operations & SLA' | 'General';
  summary: string;
  content: string;
  isCustomerCase: boolean;
  customerDetails?: CustomerDetails;
  visibility: 'everyone' | 'executive_only';
  tags: string[];
  pinned: boolean;
  authorId: string;
  authorName: string;
  authorRole: string;
  lastUpdatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  status: 'totp_setup_required' | 'totp_required';
  message: string;
  tempToken: string;
  qrCode?: string;
  manualSecret?: string;
  email: string;
}
