import type { ReactNode, ChangeEvent } from "react";

{/** Admin page types */}

export type Department = {
  id: number;
  name: string;
  description?: string;
  doctors?: number;
};

export type InputBoxProps = {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  type?: string;
  icon: ReactNode;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
};

export type SelectBoxProps = {
  label: string;
  name: string;
  value: string;
  icon: ReactNode;
  options: string[];
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
};

export type Appointment = {
  id: number;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  reason: string;
  status: "Confirmed" | "Pending" | "Cancelled";
  payment: "Paid" | "Pending" | "Refunded";
};

export type StatCardProps = {
  icon: ReactNode;
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  gradient: string;
};

export type ChartLabelProps = {
  color: string;
  label: string;
  value: string;
};

export type InfoItemProps = {
  label: string;
  value: string;
};

export type PatientStatCardProps = {
  icon: ReactNode;
  title: string;
  value: string;
  description: string;
};

export type FilterDropdownProps = {
  label: string;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
};

export type Specialization = {
  id: number;
  name: string;
  description: string;
  doctors: number;
};

export type AdminSpecializationState = {
  specializations: Specialization[];
  loading: boolean;
  search: string;
  currentPage: number;
  totalPages: number;
  totalDepartments: number;
  direction: number;
};

//Admin appointments types

export interface DashboardOverview {
  totalAppointments: number;
  todayAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
}

interface DoctorStat {
  doctor_id: number;
  doctor_name: string;
  specialization: string;
  total: number;
}

export interface DashboardInsights {
  doctorStats: DoctorStat[];
  completionRate: string;
}

export interface AppointmentRow {
  id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  reason: string;
  status: string;
  payment_status: string;
  consultation_Status: string;
  doctor: {
    id: number;
    name: string;
    email: string;
    specialization: string;
    profile_picture: string;
    consultation_fee: string;
    experience_years: number;
  };
  patient: {
    id: number;
    name: string;
    email: string;
    gender: string;
  };
}

//doctor summary types

export interface DoctorSummaryRow {
  doctor_id: number;
  doctor_name: string;
  profile_picture: string;
  specialization: string;
  total: number;
  missed: number;
  completed: number;
  cancelled: number;
}

interface DoctorSummaryPage {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  rows: DoctorSummaryRow[];
}

// renamed from DashboardData to avoid conflict with ReportsDashboardData
export interface DoctorSummaryDashboardData {
  doctorSummary: DoctorSummaryPage;
  insights: {
    completionRate: string;
    doctorStats: { doctor_id: number; total: number }[];
  };
}

//admin dashboard types

interface DashboardSummary {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number;
}

export interface AppointmentTrendItem {
  month: number;
  appointments: number;
}

interface RecentAppointment {
  patientName: string | null;
  doctorName: string | null;
  appointmentDate: string | null;
  consultationType: string | null;
  amount: number;
  paymentStatus: string | null;
  status: string;
}

export interface AdminDashboardData {
  summary: DashboardSummary;
  appointmentTrend: AppointmentTrendItem[];
  recentAppointments: RecentAppointment[];
}

//admin doctor earnings types

export interface DoctorRow {
  doctor_id: number;
  doctor_name: string;
  profile_picture: string;
  specialization: string;
  total: number;
  completed: number;
  cancelled: number;
  missed: number;
  earnings: number;
}

interface DoctorSummary {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  rows: DoctorRow[];
}

export interface DoctorStats {
  doctor_id: number;
  doctor_name: string;
  specialization: string;
  total: number;
}

export interface Insights {
  doctorStats: DoctorStats[];
  completionRate: string;
}

export interface ApiData {
  doctorSummary: DoctorSummary;
  insights: Insights;
}

//earnings slice types

export interface Summary {
  totalRevenue: number;
  totalConsultations: number;
  videoCallRevenue: number;
  clinicVisitRevenue: number;
  avgPerConsultation: number;
  revenueChange: number;
  consultationChange: number;
  videoCallChange: number;
  clinicVisitChange: number;
  avgChange: number;
}

export interface CategoryData {
  videoCall: number;
  clinicVisit: number;
  videoCallCount: number;
  clinicVisitCount: number;
}

export interface TrendPoint {
  label: string;
  videoCall: number;
  clinicVisit: number;
}

export interface TopDoctor {
  doctor_id: number;
  doctor_name: string;
  specialization: string;
  profile_picture: string;
  total_earnings: number;
  video_call_count: number;
  clinic_visit_count: number;
}

export interface RecentConsultation {
  id: number;
  patient_name: string;
  patient_profile: string;
  doctor_name: string;
  doctor_profile: string;
  specialization: string;
  consultation_type: "video_call" | "clinic_visit";
  consultation_date: string;
  amount: number;
  payment_status: "paid" | "pending" | "refunded";
}

interface PaginatedConsultations {
  rows: RecentConsultation[];
  totalPages: number;
  currentPage: number;
  totalRecords: number;
}

interface EarningsData {
  summary: Summary;
  categoryData: CategoryData;
  trendData: TrendPoint[];
  topDoctors: TopDoctor[];
  recentConsultations: PaginatedConsultations;
}

export interface EarningsState {
  data: EarningsData | null;
  loading: boolean;
  error: string | null;
  filter: "week" | "month" | "year";
  page: number;
}

// ── Admin reports page types ──────────────────────────────────────────────────

export interface AvailableDoctor {
  doctor_id: number;
  doctor_name: string;
  profile_picture: string;
  specialization: string;
  date: string;
  status: "available";
  slots_status: "has_slots" | "slots_full";
}

export interface UnavailableDoctor {
  doctor_id: number;
  doctor_name: string;
  profile_picture: string;
  specialization: string;
  date: string;
  status: "unavailable";
}

export interface LeaveDoctor {
  doctor_id: number;
  doctor_name: string;
  profile_picture: string;
  specialization: string;
  unavailable_date: string;
  reason: string | null;  
  is_full_day: boolean;
  start_time: string | null | undefined;
  end_time: string | null | undefined; 
  status: "on_leave";
}

export interface PaginatedDoctors<T> {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  rows: T[];
}

// *** renamed from DashboardData → ReportsDashboardData to avoid duplicate ***
export interface ReportsDashboardData {
  summary: {
    totalDoctors: number;
    availableDoctors: number;
    unavailableDoctors: number;
    onLeaveDoctors: number;
  };
  availableDoctors: PaginatedDoctors<AvailableDoctor>;
  unavailableDoctors: PaginatedDoctors<UnavailableDoctor>;
  onLeaveDoctors: PaginatedDoctors<LeaveDoctor>;
  chartData: {
    available: number;
    unavailable: number;
    onLeave: number;
  };
  quickSummary: {
    availableToday: number;
    unavailableToday: number;
    onLeaveToday: number;
  };
  _allAvailable: AvailableDoctor[];
  _allUnavailable: UnavailableDoctor[];
  _allLeave: LeaveDoctor[];
}

export interface AdminReportsState {
  data: ReportsDashboardData | null;
  loading: boolean;
  error: string | null;
  selectedDate: string;
  activeTab: "available" | "unavailable" | "leave";
  page: number;
  pageSize: number;
}