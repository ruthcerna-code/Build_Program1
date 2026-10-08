import type {
  FinishType,
  HeightRange,
  LengthRange,
  SurfaceType,
  TimelineType,
  WorkType,
} from './constants/guidedQuote';

export type MeshType = 'monofilamento' | 'multifilamento';

export interface GuidedQuoteDetails {
  regionCode: string;
  regionName: string;
  commune: string;
  workType: WorkType;
  surfaceType: SurfaceType;
  lengthRange: LengthRange;
  heightRange: HeightRange;
  finishType: FinishType;
  finishColor?: string;
  timeline: TimelineType;
  acceptedTerms: boolean;
  commercialOptIn: boolean;
}

export type PropertyType = 'departamento' | 'casa' | 'oficina' | 'otro';

export type QuoteStatus =
  | 'pendiente'
  | 'en_revision'
  | 'cotizada'
  | 'aceptada'
  | 'rechazada'
  | 'cancelada';

export interface InternalPermissions {
  viewQuotes: boolean;
  editQuotes: boolean;
  deleteQuotes: boolean;
  viewSales: boolean;
}

export interface QuoteChangeEvent {
  id: string;
  at: string;
  actorEmail: string;
  actorName: string;
  action: string;
  detail: string;
}

export interface PaymentRecord {
  id: string;
  quoteId: string;
  amount: number;
  method?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface WindowItem {
  id: string;
  name: string;
  height: number; // in meters (derived)
  width: number;  // in meters (derived)
  unit: 'm' | 'cm';
  meshType: MeshType;
  area: number;   // calculated in square meters, unrounded
  notes?: string;
  order?: number;
  widthCm?: number;
  heightCm?: number;
}

export type ScheduleOption = 'opcion_1' | 'opcion_2' | 'personalizada';

export interface AdminQuoteDetails {
  pricePerM2: number;
  meshTotalCost: number;
  profilesAndFixingsCost: number;
  laborAndInstallCost: number;
  discountPercentage: number;
  discountAmount: number;
  subtotal: number;
  includeTax: boolean;
  taxAmount: number;
  total: number;
  warrantyYears: number;
  estimatedTime: string;
  adminNotes: string;
  sentAt?: string;
  sentToEmail?: string;
  // Schedule accepted or proposed by admin
  selectedScheduleOption?: ScheduleOption;
  confirmedInstallationDate?: string;
  confirmedInstallationTime?: string;
}

export interface InstallerAssignment {
  technicianName: string;
  technicianPhone: string;
  technicianRole?: string;
  assignedAt: string;
  installationStatus: 'por_instalar' | 'en_camino' | 'instalado';
  assignmentNotes?: string;
}

export type TechnicianWorkStatus = 'pendiente_aceptar' | 'solicitud_aceptada' | 'trabajo_realizado';

export interface TechnicianExecution {
  status: TechnicianWorkStatus;
  notes: string;
  acceptedAt?: string;
  completedAt?: string;
  technicianName?: string;
}

export interface QuoteRequest {
  id: string;
  folio: string;
  createdAt: string;
  clientName: string;
  clientRut?: string; // Chilean RUT of client (ej: 14.582.910-K)
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientCity: string;
  propertyType: PropertyType;
  windows: WindowItem[];
  totalAreaM2: number;
  clientComments?: string;
  clientPhotoName?: string;
  // Two tentative installation dates & times requested by user
  tentativeDate1?: string;
  tentativeTime1?: string;
  tentativeDate2?: string;
  tentativeTime2?: string;
  status: QuoteStatus;
  adminQuote?: AdminQuoteDetails;
  // Assignment of installer for approved quotes
  installerAssignment?: InstallerAssignment;
  acceptedAt?: string;
  // Payment tracking for dashboard
  paidAmount?: number;
  paymentStatus?: 'pendiente' | 'abono_parcial' | 'pagado_total';
  paymentMethod?: string;
  paymentNotes?: string;
  payments?: PaymentRecord[];
  deletedAt?: string;
  changeHistory?: QuoteChangeEvent[];
  ownerEmail?: string;
  quoteSource?: 'classic' | 'guided';
  guidedQuote?: GuidedQuoteDetails;
  // Technical execution by installer
  technicianExecution?: TechnicianExecution;
  // Automated email dispatch to nydo.mallas@gmail.com and client copy
  emailDispatch?: QuoteEmailDispatch;
}

export interface QuoteEmailDispatch {
  toCompany: string; // nydo.mallas@gmail.com
  toClient: string;  // client email
  sentAt: string;
  companyDelivered: boolean;
  clientDelivered: boolean;
  formattedContent: string;
}

export type UserRole = 'admin' | 'cliente' | 'tecnico' | 'interno';

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  rut?: string;
  createdAt: string;
  provisionalPassword?: string;
  provisionalPasswordCreatedAt?: string;
  mustChangePassword?: boolean;
  active?: boolean;
  permissions?: InternalPermissions;
  authProvider?: 'password' | 'google';
}

export interface PasswordRecoveryMail {
  id: string;
  toEmail: string;
  provisionalPassword: string;
  sentAt: string;
  expiresInMinutes: number;
}

export type AccessActionType = 'login' | 'connectivity_ping' | 'quote_created' | 'logout';

export interface UserAccessLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: UserRole;
  connectedAt: string; // ISO 8601 date-time
  connectivityTimestamp: number; // ms
  action: AccessActionType;
  actionDescription: string;
  quotesCount: number;
  quoteFolios: string[];
  deviceInfo?: string;
  ipAddress?: string;
}

