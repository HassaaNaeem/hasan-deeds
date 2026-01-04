// Entity Types - Aligned with Backend OpenAPI Spec

export type UserRole = 'purchaser' | 'service_provider' | 'admin' | 'legal';

export interface User {
  _id: string;
  email: string;
  role: UserRole;
  purchaserId?: string | Purchase; // Can be ID or populated object
  serviceProviderId?: string | ServiceProvider; // Can be ID or populated object
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  _id: string;
  name: string;
  cnicNumber: string;
  phoneNumber: string;
  fatherName: string;
  balance: number;
  imageUri?: string;
}

export interface ServiceProvider {
  _id: string;
  name: string;
  cnicNumber: string;
  phoneNumber: string;
  balance: number;
  imageUri?: string;
}

export type PlotStatus = 'available' | 'reserved' | 'sold' | 'on_hold';

export interface Plot {
  _id: string;
  plotNumber: string;
  area: string; // e.g., "10 marla"
  location: string; // e.g., "Hasan Gardens Phase 1"
  documentType?: string;
  totalValue: number;
  status: PlotStatus;
  purchaserId?: string;
  serviceProviderId?: string;
  documentId?: string;
  dateOfPreparation?: string;
  dateOfSale?: string;
  createdAt: string;
  updatedAt: string;
  plotDetails?: PlotDetails;
}

export interface PlotDetails {
  _id: string;
  plotId: string;
  plotNumber: string;
  name?: string; // Sometimes redundant with Purchase name but present in spec
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  documentId?: string;
  plotMapUri?: string;
  purchaserCnicCopyUri?: string;
  purchaserBankStatementUri?: string;
  companyFormUri?: string;
  allotmentDocUri?: string;
  allocationDocUri?: string;
  possessionDocUri?: string;
  clearanceDocUri?: string;
  allotmentStatus?: 'pending' | 'approved';
  allocationStatus?: 'pending' | 'approved';
  possessionStatus?: 'pending' | 'approved';
  clearanceStatus?: 'pending' | 'approved';
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'partial' | 'failed';

export interface PaymentSchedule {
  _id: string;
  plotId: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  installmentNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInstallment {
  _id: string;
  paymentScheduleId: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  amountPaid: number;
  balance: number;
  dateOfPayment?: string;
  receiptUri?: string;
  proofUri?: string;
  createdAt: string;
  updatedAt: string;
}

export type CaseStatus = 'recorded' | 'filed' | 'in_progress' | 'resolved' | 'closed';

export interface FailedPayment {
  _id: string;
  plotId: string;
  amount: number;
  date: string;
  status: CaseStatus;
  caseId?: string;
  courtDate?: string;
  chargeCode?: string;
  amountCharged?: number;
  description?: string;
  gracePeriodEnd: string;
  filedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneDocument {
  _id: string;
  plotId: string;
  percentage: number;
  documentType: 'ALLOTMENT' | 'ALLOCATION' | 'POSSESSION' | 'CLEARANCE';
  status: 'ready' | 'generated' | 'approved';
  generatedUri?: string;
  generatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  approvalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  token?: string;
  count?: number;
}

// User Session Wrapper (frontend specific)
export interface UserSession {
  userId: string;
  role: UserRole;
  name?: string;
  email: string;
}
