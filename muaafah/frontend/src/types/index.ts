export type Language = 'en' | 'ar';

export interface User {
  id: string;
  email: string;
  full_name_en: string;
  full_name_ar?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  role: 'patient' | 'provider_admin' | 'insurer_admin' | 'system_admin';
  is_active: boolean;
  nafath_verified: boolean;
  national_id?: string;
  preferences?: Record<string, unknown>;
  created_at?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type ReportStatus = 'pending' | 'processing' | 'analyzed' | 'action_required' | 'error';
export type ResultStatus = 'normal' | 'borderline' | 'abnormal';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type Urgency = 'routine' | 'priority' | 'urgent';

export interface LabResult {
  id: string;
  report_id: string;
  biomarker_en: string;
  biomarker_ar?: string;
  value?: number;
  value_text?: string;
  unit?: string;
  normal_range_text?: string;
  status: ResultStatus;
  interpretation_en?: string;
  interpretation_ar?: string;
}

export interface Recommendation {
  specialty_en: string;
  specialty_ar: string;
  reason_en: string;
  reason_ar: string;
  urgency: Urgency;
  suggested_tests_en: string[];
  suggested_tests_ar: string[];
}

export interface LabReport {
  id: string;
  user_id: string;
  file_name: string;
  file_type?: string;
  status: ReportStatus;
  lab_name?: string;
  report_date?: string;
  summary_en?: string;
  summary_ar?: string;
  recommendations?: Recommendation[];
  ai_analysis?: {
    overall_risk: RiskLevel;
    requires_urgent_care: boolean;
  };
  results?: LabResult[];
  created_at?: string;
  analyzed_at?: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  slot_id?: string;
  lab_report_id?: string;
  scheduled_date: string;
  scheduled_time: string;
  status: AppointmentStatus;
  appointment_type: string;
  reason?: string;
  notes?: string;
  insurance_policy_id?: string;
  pre_auth_number?: string;
  co_payment?: string;
  created_at?: string;
}

export interface ProviderSlot {
  id: string;
  provider_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  appointment_type: string;
}

export interface Provider {
  id: string;
  organization_name_en: string;
  organization_name_ar?: string;
  doctor_name_en: string;
  doctor_name_ar?: string;
  specialty_en: string;
  specialty_ar?: string;
  specialty_code?: string;
  photo_url?: string;
  rating: number;
  review_count: number;
  address_en?: string;
  address_ar?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  insurance_networks?: string[];
  languages?: string[];
  is_active: boolean;
  consultation_fee?: number;
  available_slots?: ProviderSlot[];
}

export interface InsurancePolicy {
  id: string;
  user_id: string;
  insurer_name_en: string;
  insurer_name_ar?: string;
  policy_number: string;
  member_id?: string;
  plan_name?: string;
  coverage_type?: string;
  network_providers?: string[];
  coverage_details?: Record<string, unknown>;
  effective_date?: string;
  expiry_date?: string;
  is_active: boolean;
  nphies_verified: boolean;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
