export type Notification = {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  createdAt?: string;
  created_at?: string;
};

export type ApiPatient = {
  id: number;
  name?: string;
  email?: string;
  phone?: string | number | null;
  phone_number?: string | number | null;
  gender?: string;
  blood_group?: string;
  dob?: string;
  created_at?: string;
  createdAt?: string;
  is_active?: boolean;
  user?: {
    name?: string;
    email?: string;
    phone?: string | number | null;
    phone_number?: string | number | null;
    gender?: string;
    blood_group?: string;
    dob?: string;
    created_at?: string;
    createdAt?: string;
    is_active?: boolean;
  };
};

export type Patient = {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: string;
  blood_group: string;
  dob: string;
  registeredOn: string;
  status: "Active" | "Inactive";
};

export type ApiDoctor = {
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

export type Department = {
  id: number;
  name: string;
};

export type DoctorCardProps = {
  doctor: ApiDoctor;
  onView: () => void;
};

export type FilterDropdownProps = {
  title: string;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  scrollable?: boolean;
};

export type Profile = {
  name: string;
  email: string;
  phone_number: string;
  gender: string;
  dob: string;
  blood_group: string;
  profile_picture: string;
};

export type EditableFieldProps = {
  icon: React.ReactNode;
  label: string;
  name: keyof Profile;
  value: string;
  isEdit: boolean;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export type DropdownFieldProps = {
  icon: React.ReactNode;
  label: string;
  name: keyof Profile;
  value: string;
  isEdit: boolean;
  options: string[];
  onSelect: (name: keyof Profile, value: string) => void;
};

export type Filters = {
  search: string;
  selectedSpecialization: string;
  selectedExperience: string;
  selectedGender: string;
  selectedFees: string;
  selectedStatus: string;
};

export type DoctorListingState = {
  doctors: ApiDoctor[];
  departments: Department[];
  currentPage: number;
  totalPages: number;
  totalDoctors: number;
  direction: number;
  loading: boolean;
  firstLoad: boolean;
  openFilter: string | null;
  openMobileFilter: boolean;
  filters: Filters;
  selectedDoctor: ApiDoctor | null;
};

export type FilterContentProps = {
  departments: Department[];
  selectedSpecialization: string;
  selectedExperience: string;
  selectedGender: string;
  selectedFees: string;
  openFilter: string | null;
  onSetOpenFilter: (v: string | null) => void;
  onSetSpecialization: (v: string) => void;
  onSetExperience: (v: string) => void;
  onSetGender: (v: string) => void;
  onSetFees: (v: string) => void;
  onResetPage: () => void;
  onClearFilters: () => void;
  selectedStatus: string;
  onSetStatus: (v: string) => void;
};

// Book appointment slice types
export type Slot = {
  start_time: string;
  end_time: string;
  is_available: boolean;
  status:string;
  appointment_status?: string;
  booking_status?: string;
  slot_status:string;
  appointment_id:number;
};

export type DateItem = {
  date: string;
  day: string;
};

export type ConsultationType = "Video Call" | "Clinic visit";

export type BookAppointmentState = {
  dateItems: DateItem[];
  slots: Slot[];
  slotsLoading: boolean;
  slotsError: string | null;
  selectedDateIndex: number;
  selectedSlot: Slot | null;
  consultationType: ConsultationType;
  paymentMethod: "online" | "clinic";
  consultationReason: string;
  bookingLoading: boolean;
  bookingError: string | null;
  appointmentId: number | null;
  razorpayOrderId: string | null;
  orderLoading: boolean;
  orderError: string | null;
  paymentSuccess: boolean;
};

// Transaction detail type
export type TransactionDetail = {
  id: number;
  appointment_id: number;
  amount: number;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  status: "created" | "paid" | "failed" | "refunded";
  created_at: string;
  updated_at: string;
  appointment?: {
    id: number;
    doctor_id: number;
    patient_id: number;
    appointment_date: string;
    start_time: string;
    end_time: string;
    consultation_type: string;
    reason?: string;
    status: string;
    doctor?: {
      id: number;
      consultation_fee: string;
      user?: {
        name?: string;
      };
    };
    patient?: {
      id: number;
      user?: {
        name?: string;
        email?: string;
        phone_number?: string;
      };
    };
  };
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  gender?: string;
  role: string;
  patientId?: number;
  doctorId?: number | null;
};

//Appointment types

export type AppointmentDetail = {
  id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  consultation_type: string;
  reason?: string;
  status: string;
  doctor?: {
    id: number;
    consultation_fee: string;
    specialization?: string;
    user?: { name?: string };
  };
  patient?: {
    id: number;
    user?: {
      name?: string;
      email?: string;
      phone_number?: string;
    };
  };
};

export type PaymentDetail = {
  id: number;
  appointment_id: number;
  amount: number;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  status: "created" | "paid" | "failed" | "refunded";
  created_at: string;
  updated_at: string;
};

export type TimelineStep = {
  label: string;
  time: string;
  done: boolean;
};


//My appointments page types
type Doctor = {
  id: number;
  name?: string;
  email?: string;
  profile_picture?: string;
  specialization?: string;
  consultation_fee?: string;
  experience_years?: number;
};

export type Appointment = {
  id: number;
  appointment_date?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  reason?: string;
  meeting_link?: string;
  doctor?: Doctor;
  consultation_type?: string;
  meeting_room?: string;
};

interface DoctorInfo {
  id: number;
  name: string;
  email: string;
  profile_picture?: string;
  specialization?: string;
  consultation_fee?: string;
  experience_years?: number;
}

export interface MyAppointment {
  id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  consultation_status?: string;
  reason?: string;
  consultation_type?: string;
  meeting_room?: string;
  doctor?: DoctorInfo;
  doctor_id?: number;
  review_given?: boolean;
}

 export interface PaginatedResponse {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  appointments: MyAppointment[];
}

//Reviews type

export interface Review {
  id: number;
  appointment_id: number;
  doctor_id: number;
  patient_id: number;
  rating: number;
  review: string;
  createdAt: string;
  updated_at: string;
  patientName?: string;
}

//Home blog section types


export interface BlogPost {
  id: number;
  category: string;
  categoryColor: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  emoji: string;
  bgColor: string;
}

