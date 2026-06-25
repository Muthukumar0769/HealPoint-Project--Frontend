export type Doctor = {
  id: number;
  specialization?: string;
  experience_years?: number;
  education?: string | null;
  consultation_fee?: string;
  image?: string | null;
  user?: {
    name?: string;
    profile_picture?: string | null;
  };
};

export type DoctorData = {
  id?: number;
  user_id?: number;
  specialization?: string;
  experience_years?: number;
  consultation_fee?: string | number;
  bio?: string;
  image?: string | null;
  user?: {
    id?: number;
    name?: string;
    email?: string;
    gender?: string;
    role?: string;
    profile_picture?: string | null;
  };
};

export type DoctorAppointment = {
  id: number;
  doctorName: string;
  specialization: string;
  totalAppointments: number;
  completed: number;
  pending: number;
  cancelled: number;
  avatar?: string;
};

export type AdminDoctor = {
  id: number;
  user_id: number;
  education?: string | null;
  specialization?: string;
  experience_years?: number;
  consultation_fee?: string;
  bio?: string;
  image?: string | null;
  user?: {
    id?: number;
    name?: string;
    email?: string;
    gender?: string;
    role?: string;
    phone_number?: number | null;
    profile_picture?: string | null;
  };
};

{/**Doctor Appointment types */}
export type StatCardProps = {
  icon: React.ReactNode;
  title: string;
  value: number;
}

export type AppointmentStatus = "Pending" | "Accepted" | "Completed" | "Cancelled"|"Missed";
export type AppointmentType = "Video Call" | "Clinic Visit";

export type Appointment = {
  id: number;
  patientName: string;
  patientInfo: string;
  date: string;
  time: string;
  type: AppointmentType;
  problem: string;
  amount: number;
  status: AppointmentStatus;

}

export type Patient = {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: string;
  age: number;
  lastAppointment: string;
  status: "Completed" | "Upcoming" | "Cancelled";
};

export type Department = {
  id: number;
  name: string;
};

//Doctor Schedule slices types

export type Availability = {
  id: number;
  day_of_week?: string;
  date?: string;
  start_time: string;
  end_time: string;
  slot_duration: number;
};

export type Leave = {
  id: number;
  unavailable_date: string;
  reason: string;
  is_full_day: boolean;
  start_time?: string | null;
  end_time?: string | null;
};

export type InitialState = {
  loading: boolean;
  fetchLoading: boolean;
  normalSchedules: Availability[];
  specialSchedules: Availability[];
  leaves: Leave[];
  error: string | null;
};

//Doctor appointment slices types


export type DoctorAppointmentItem = {
  id: number;
  patientName: string;
  patientInfo: string;
  date: string;
  time: string;
  type: AppointmentType;
  problem: string;
  status: AppointmentStatus;
};

type Stats = {
  total: number;
  accepted: number;
  completed: number;
  cancelled: number;
  missed: number;
};

export type DoctorAppointmentsState = {
  appointments: DoctorAppointmentItem[];
  stats: Stats;
  loading: boolean;
  statsLoading: boolean;
  actionLoadingId: number | null;
  error: string | null;
  activeTab: "All" | AppointmentStatus;
  search: string;
  debouncedSearch: string;
  selectedMonth: string;
  currentPage: number;
  totalCount: number;
  limit: number;
  slideDirection: "left" | "right";
  viewAppointment: DoctorAppointmentItem | null;
};

//Doctor earnings types

export type Summary = {
  total_earnings: number;
  paid_appointments: number;
  completed_appointments: number;
  video_earnings: number;
  clinic_earnings: number;
};

export type Payment = {
  id: number;
  patient: string;
  date: string;
  time: string;
  amount: number;
  status: string;
  type: "Video Call" | "Clinic Visit";
};

export type MonthlyData = {
  month: string;
  earnings: number;
};

//video slice types

export type TabKey = "all" | "upcoming" | "completed" | "missed" | "cancelled";

export type ConsultationMode = "video" | "clinic";

export type PatientInfo = {
  id: number;
  name: string;
  email: string;
  gender: string;
};

export type VideoAppointment = {
  id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  consultation_status?: string;
  reason: string;
  consultation_type?: string;
  meeting_room?: string;
  patient: PatientInfo;
  
};

export type PaginatedResponse = {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  appointments: VideoAppointment[];
};

//Dashboard types

export interface DashboardSummary {
  totalAppointments: number;
  totalPatients: number;
  averageRating: number;
  totalEarnings: number;
}

export interface TodayAppointment {
  id: number;
  start_time: string;
  end_time: string;
  consultation_type: string;
  patient_name: string;
}

export interface WeeklyLoad {
  day: string;
  appointments: number;
}

export interface MonthlyOverview {
  month: number;
  appointments: number;
  patients: number;
}