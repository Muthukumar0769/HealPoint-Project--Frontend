import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import API from "../../api/axios";
import type { AppointmentStatus, AppointmentType, DoctorAppointmentItem, DoctorAppointmentsState, } from "../../types/doctor";

const initialState: DoctorAppointmentsState = {
  appointments: [],
  stats: {
    total: 0,
    accepted: 0,
    completed: 0,
    cancelled: 0,
  },
  loading: false,
  statsLoading: false,
  actionLoadingId: null,
  error: null,
  activeTab: "All",
  search: "",
  debouncedSearch: "",
  selectedMonth: "",
  currentPage: 1,
  totalCount: 0,
  limit: 10,
  slideDirection: "right",
  viewAppointment: null,
};

const formatDate = (date?: string) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (time?: string) => {
  if (!time) return "N/A";
  return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const normalizeStatus = (status?: string): AppointmentStatus => {
  const s = status?.toLowerCase();
  if (s === "confirmed" || s === "accepted") return "Accepted";
  if (s === "completed") return "Completed";
  if (s === "cancelled" || s === "canceled" || s === "rejected") return "Cancelled";
  if (s === "no_show" || s === "missed" || s === "no-show") return "Missed";
  return "Pending";
};

const normalizeType = (item: any): AppointmentType => {
  const rawType =
    item.consultation_type ||
    item.consultationType ||
    item.appointment_type ||
    item.appointmentType ||
    item.type ||
    "";

  const type = String(rawType)
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .trim();

  if (
    type.includes("video") ||
    type.includes("online") ||
    type.includes("virtual") ||
    !!item.meeting_room
  ) {
    return "Video Call";
  }

  return "Clinic Visit";
};

const getPatientName = (item: any): string => {
  return (
    item.patientName ||
    item.patient_name ||
    item.patient?.user?.name ||
    item.Patient?.User?.name ||
    item.Patient?.user?.name ||
    item.patient?.name ||
    item.Patient?.name ||
    item.user?.name ||
    item.User?.name ||
    "Patient"
  );
};

const getPatientInfo = (item: any): string => {
  const user =
    item.patient?.user ||
    item.Patient?.User ||
    item.Patient?.user ||
    item.patient ||
    item.Patient ||
    item.user ||
    item.User ||
    {};
  const gender = user.gender || user.gender_name || "N/A";
  const email = user.email || "Email N/A";
  return `${gender}, ${email}`;
};

const mapAppointment = (item: any): DoctorAppointmentItem => {
  const consultationStatus = item.consultation_status || item.consultationStatus || "";
  const isMissed = consultationStatus === "no_show" || consultationStatus === "missed" || consultationStatus === "no-show";

  return {
    id: item.id,
    patientName: getPatientName(item),
    patientInfo: getPatientInfo(item),
    date: formatDate(item.appointment_date || item.date),
    time: formatTime(item.start_time || item.time),
    type: normalizeType(item),
    problem: item.reason || item.problem || "Not specified",
    status: isMissed ? "Missed" : normalizeStatus(item.status),
  };
};

const extractRows = (res: any): any[] => {
  const d = res.data;
  if (Array.isArray(d?.appointments)) return d.appointments; 
  if (Array.isArray(d?.data?.rows)) return d.data.rows;
  if (Array.isArray(d?.rows)) return d.rows;
  if (Array.isArray(d?.data?.appointments)) return d.data.appointments;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d)) return d;
  return [];
};

const extractTotal = (res: any): number => {
  const d = res.data;
  if (d?.totalRecords !== undefined) return Number(d.totalRecords);  
  if (d?.data?.count !== undefined) return Number(d.data.count);
  if (d?.count !== undefined) return Number(d.count);
  if (d?.data?.total !== undefined) return Number(d.data.total);
  if (d?.total !== undefined) return Number(d.total);
  return extractRows(res).length;
};

export const fetchDoctorAppointments = createAsyncThunk(
  "doctorAppointments/fetchDoctorAppointments",
  async (
    params: {
      page: number;
      limit: number;
      patientName?: string;
      month?: number;
      year?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await API.get("/doctor/my-appointments", { params });
      console.log("res.data:", res.data);
      return {
        appointments: extractRows(res).map(mapAppointment),
        totalCount: extractTotal(res),
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch appointments"
      );
    }
  }
);

export const fetchDoctorAppointmentStats = createAsyncThunk(
  "doctorAppointments/fetchDoctorAppointmentStats",
  async (
    params: { month?: number; year?: number },
    { rejectWithValue }
  ) => {
    try {
      const res = await API.get("/doctor/my-appointments", {
        params: { page: 1, limit: 9999, month: params.month, year: params.year },
      });
      const all: DoctorAppointmentItem[] = extractRows(res).map(mapAppointment);
      return {
        total: all.length,
        accepted: all.filter((item) => item.status === "Accepted").length,
        completed: all.filter((item) => item.status === "Completed").length,
        cancelled: all.filter((item) => item.status === "Cancelled").length,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch stats"
      );
    }
  }
);

export const updateDoctorAppointmentStatus = createAsyncThunk(
  "doctorAppointments/updateDoctorAppointmentStatus",
  async (
    payload: { appointmentId: number; status: "accepted" | "rejected" },
    { rejectWithValue }
  ) => {
    try {
      await API.patch(`/appointments/${payload.appointmentId}/status`, {
        status: payload.status,
      });
      return payload.appointmentId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update status"
      );
    }
  }
);

const doctorAppointmentsSlice = createSlice({
  name: "doctorAppointments",
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<"All" | AppointmentStatus>) => {
      state.activeTab = action.payload;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setDebouncedSearch: (state, action: PayloadAction<string>) => {
      state.debouncedSearch = action.payload;
      state.currentPage = 1;
    },
    setSelectedMonth: (state, action: PayloadAction<string>) => {
      state.selectedMonth = action.payload;
      state.currentPage = 1;
    },
    clearSelectedMonth: (state) => {
      state.selectedMonth = "";
      state.currentPage = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.slideDirection = action.payload > state.currentPage ? "right" : "left";
      state.currentPage = action.payload;
    },
    setViewAppointment: (
      state,
      action: PayloadAction<DoctorAppointmentItem | null>
    ) => {
      state.viewAppointment = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctorAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctorAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload.appointments;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(fetchDoctorAppointments.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
        state.appointments = [];
        state.totalCount = 0;
      });

    builder
      .addCase(fetchDoctorAppointmentStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchDoctorAppointmentStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDoctorAppointmentStats.rejected, (state) => {
        state.statsLoading = false;
      });

    builder
      .addCase(updateDoctorAppointmentStatus.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg.appointmentId;
      })
      .addCase(updateDoctorAppointmentStatus.fulfilled, (state) => {
        state.actionLoadingId = null;
      })
      .addCase(updateDoctorAppointmentStatus.rejected, (state) => {
        state.actionLoadingId = null;
      });
  },
});

export const {setActiveTab,setSearch,setDebouncedSearch,setSelectedMonth,clearSelectedMonth,
  setPage,setViewAppointment,} = doctorAppointmentsSlice.actions;
export default doctorAppointmentsSlice.reducer;