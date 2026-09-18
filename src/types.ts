export type MeshType = 'monofilamento' | 'multifilamento';

export type PropertyType = 'departamento' | 'casa' | 'oficina' | 'otro';

export type QuoteStatus = 'pendiente' | 'cotizada' | 'aceptada' | 'rechazada';

export interface WindowItem {
  id: string;
  name: string;
  height: number; // in meters
  width: number;  // in meters
  unit: 'm' | 'cm';
  meshType: MeshType;
  area: number;   // calculated in square meters
  notes?: string;
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
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientCity: string;
  propertyType: PropertyType;
  windows: WindowItem[];
  totalAreaM2: number;
  clientComments?: string;
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
  // Technical execution by installer
  technicianExecution?: TechnicianExecution;
}

export type UserRole = 'admin' | 'cliente' | 'tecnico';

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  provisionalPassword?: string;
  provisionalPasswordCreatedAt?: string;
  mustChangePassword?: boolean;
}

export interface PasswordRecoveryMail {
  id: string;
  toEmail: string;
  provisionalPassword: string;
  sentAt: string;
  expiresInMinutes: number;
}

