import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import API from "../../api/axios";
import type { TabKey, PaginatedResponse, VideoAppointment, ConsultationMode } from "../../types/doctor";

export const VIDEO_UNSEEN_KEY = "doctor_video_unseen_ids";
export const PAGE_SIZE = 5;

const isNoShow = (a: VideoAppointment) =>
  String(a.consultation_status).toLowerCase() === "no_show" ||
  String(a.consultation_status).toLowerCase() === "missed";

const isCompleted = (a: VideoAppointment) =>
  String(a.consultation_status).toLowerCase() === "completed" ||
  String(a.status).toLowerCase() === "completed";

const isCancelled = (a: VideoAppointment) =>
  String(a.status).toLowerCase() === "cancelled" ||
  String(a.status).toLowerCase() === "canceled";

const isUpcoming = (a: VideoAppointment) =>
  String(a.status).toLowerCase() === "confirmed" &&
  !isCompleted(a) &&
  !isCancelled(a) &&
  !isNoShow(a);

const normalizeResponse = (d: any, page: number, limit: number): PaginatedResponse => {
  const payload = d?.appointments !== undefined ? d
    : d?.data?.appointments !== undefined ? d.data
      : d?.rows !== undefined ? {
        totalRecords: d.count ?? d.rows.length,
        currentPage: page,
        totalPages: Math.ceil((d.count ?? d.rows.length) / limit),
        appointments: d.rows,
      } : d;

  return {
    totalRecords: payload.totalRecords ?? payload.count ?? 0,
    currentPage: payload.currentPage ?? page,
    totalPages:
      payload.totalPages ??
      Math.max(1, Math.ceil((payload.totalRecords ?? payload.count ?? 0) / limit)),
    appointments: payload.appointments ?? payload.rows ?? [],
  };
};

const isModeAppointment = (a: VideoAppointment, mode: ConsultationMode) => {
  if (mode === "video") return !!a.meeting_room;
  return !a.meeting_room;
};

const filterByTab = (appointments: VideoAppointment[], tab: TabKey) => {
  if (tab === "completed") return appointments.filter(isCompleted);
  if (tab === "missed") return appointments.filter(isNoShow);
  if (tab === "cancelled") return appointments.filter(isCancelled);
  if (tab === "upcoming") return appointments.filter(isUpcoming);
  return appointments;
};

const paginate = (appointments: VideoAppointment[], page: number) => {
  const start = (page - 1) * PAGE_SIZE;
  return appointments.slice(start, start + PAGE_SIZE);
};

const getUnseenIds = (): number[] => {
  try {
    return JSON.parse(localStorage.getItem(VIDEO_UNSEEN_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveUnseenIds = (ids: number[]) => {
  localStorage.setItem(VIDEO_UNSEEN_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("video-unseen-updated"));
};

export const fetchDoctorVideoAppointments = createAsyncThunk("doctorVideo/fetchAppointments",
  async (
    { tab, page, mode, silent = false }: {
      tab: TabKey;
      page: number;
      mode: ConsultationMode;
      silent?: boolean;
    }, { rejectWithValue }) => {
    try {
      const res = await API.get("/doctor/my-appointments", { params: { page: 1, limit: 1000 } });
      const data = normalizeResponse(res.data, 1, 1000);
      const modeAppointments = data.appointments.filter((a) => isModeAppointment(a, mode));
      const tabAppointments = filterByTab(modeAppointments, tab);
      const paginatedAppointments = paginate(tabAppointments, page);
      if (mode === "video") {
        const today = new Date().toISOString().split("T")[0];
        const todayIds = paginatedAppointments.filter((a) =>
          a.appointment_date.split("T")[0] === today &&
          (a.status === "confirmed" || a.consultation_status === "ongoing")
        ).map((a) => a.id);
        saveUnseenIds(Array.from(new Set([...getUnseenIds(), ...todayIds])));
      }
      return {
        appointments: paginatedAppointments,
        totalRecords: tabAppointments.length,
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(tabAppointments.length / PAGE_SIZE)),
        silent,
      };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? e.message ?? "Failed to load appointments");
    }
  }
);

export const fetchDoctorVideoTabCounts = createAsyncThunk("doctorVideo/fetchTabCounts",
  async ({ mode }: { mode: ConsultationMode }) => {
    const res = await API.get("/doctor/my-appointments", { params: { page: 1, limit: 1000 } });
    const data = normalizeResponse(res.data, 1, 1000);
    const modeAppointments = data.appointments.filter((a) => isModeAppointment(a, mode));
    return {
      all: modeAppointments.length,
      upcoming: modeAppointments.filter(isUpcoming).length,
      completed: modeAppointments.filter(isCompleted).length,
      missed: modeAppointments.filter(isNoShow).length,
      cancelled: modeAppointments.filter(isCancelled).length,
    };
  }
);

export const joinDoctorVideoMeeting = createAsyncThunk("doctorVideo/joinMeeting",
  async (appointment: VideoAppointment, { rejectWithValue }) => {
    try {
      try {
        await API.patch(`/appointments/${appointment.id}/start`);
      } catch (startErr: any) {
        console.warn("Start endpoint failed, proceeding to join:", startErr?.response?.data?.message);
      }

      const joinRes = await API.get(`/appointments/${appointment.id}/join`);
      const payload = joinRes.data?.data ?? joinRes.data;
      const meetingRoom = payload.meeting_room ?? appointment.meeting_room;

      if (!meetingRoom) {
        throw new Error("Meeting room not assigned yet");
      }

      return { appointment, meetingRoom };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? e.message ?? "Could not join meeting");
    }
  }
);

export const completeDoctorVideoConsultation = createAsyncThunk("doctorVideo/complete",
  async (appointment: VideoAppointment, { rejectWithValue }) => {
    try {
      await API.patch(`/appointments/${appointment.id}/complete`);
      return appointment.id;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? e.message ?? "Could not complete consultation");
    }
  }
);

export const markDoctorAppointmentNoShow = createAsyncThunk("doctorVideo/noShow",
  async (appointment: VideoAppointment, { rejectWithValue }) => {
    try {
      await API.patch(`/appointments/${appointment.id}/no-show`);
      return appointment.id;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? e.message ?? "Could not mark no-show");
    }
  }
);

export const cancelDoctorVideoAppointment = createAsyncThunk("doctorVideo/cancel",
  async (appointment: VideoAppointment, { rejectWithValue }) => {
    try {
      await API.patch(`/appointments/${appointment.id}/cancel`);
      return appointment.id;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? e.message ?? "Could not cancel appointment");
    }
  }
);

interface DoctorVideoState {
  appointments: VideoAppointment[];
  loading: boolean;
  error: string | null;
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  activeTab: TabKey;
  activeMode: ConsultationMode;
  tabCounts: Partial<Record<TabKey, number>>;
  actionLoading: Record<number, string>;
  cancelModal: VideoAppointment | null;
  activeCall: { appt: VideoAppointment; meetingRoom: string } | null;
  toast: { msg: string; type: "success" | "error" } | null;
}

const initialState: DoctorVideoState = {
  appointments: [],
  loading: true,
  error: null,
  totalRecords: 0,
  totalPages: 1,
  currentPage: 1,
  activeTab: "all",
  activeMode: "video",
  tabCounts: {},
  actionLoading: {},
  cancelModal: null,
  activeCall: null,
  toast: null,
};

const doctorVideoSlice = createSlice({
  name: "doctorVideo",
  initialState,
  reducers: {
    setActiveMode: (state, action: PayloadAction<ConsultationMode>) => {
      state.activeMode = action.payload;
      state.activeTab = "all";
      state.currentPage = 1;
    },
    setActiveTab: (state, action: PayloadAction<TabKey>) => {
      state.activeTab = action.payload;
      state.currentPage = 1;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setCancelModal: (state, action: PayloadAction<VideoAppointment | null>) => {
      state.cancelModal = action.payload;
    },
    setActiveCall: (
      state,
      action: PayloadAction<{ appt: VideoAppointment; meetingRoom: string } | null>
    ) => {
      state.activeCall = action.payload;
    },
    clearToast: (state) => {
      state.toast = null;
    },
    clearUnseenIds: () => {
      saveUnseenIds([]);
    },
    forceOngoing: (state, action: PayloadAction<number>) => {
      const idx = state.appointments.findIndex((a) => a.id === action.payload);
      if (idx !== -1) {
        state.appointments[idx] = {
          ...state.appointments[idx],
          consultation_status: "ongoing",
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctorVideoAppointments.pending, (state, action) => {
        if (!action.meta.arg.silent) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchDoctorVideoAppointments.fulfilled, (state, action) => {
        state.loading = false;
        const merged = action.payload.appointments.map((incoming) => {
          const existing = state.appointments.find((a) => a.id === incoming.id);
          if (
            existing &&
            String(existing.consultation_status).toLowerCase() === "ongoing" &&
            String(incoming.consultation_status).toLowerCase() !== "ongoing" &&
            String(incoming.consultation_status).toLowerCase() !== "completed" &&
            String(incoming.status).toLowerCase() !== "completed" &&
            String(incoming.status).toLowerCase() !== "cancelled" &&
            String(incoming.status).toLowerCase() !== "canceled"
          ) {
            return { ...incoming, consultation_status: "ongoing" };
          }
          return incoming;
        });

        state.appointments = merged;
        state.totalRecords = action.payload.totalRecords;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchDoctorVideoAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? "Failed to load appointments");
      })
      .addCase(fetchDoctorVideoTabCounts.fulfilled, (state, action) => {
        state.tabCounts = action.payload;
      })
      .addCase(joinDoctorVideoMeeting.pending, (state, action) => {
        state.actionLoading[action.meta.arg.id] = "joining";
      })
      .addCase(joinDoctorVideoMeeting.fulfilled, (state, action) => {
        delete state.actionLoading[action.payload.appointment.id];
        state.activeCall = {
          appt: action.payload.appointment,
          meetingRoom: action.payload.meetingRoom,
        };
        const idx = state.appointments.findIndex(a => a.id === action.payload.appointment.id);
        if (idx !== -1) {
          state.appointments[idx] = {
            ...state.appointments[idx],
            consultation_status: "ongoing",
          };
        }
      })
      .addCase(joinDoctorVideoMeeting.rejected, (state, action) => {
        delete state.actionLoading[action.meta.arg.id];
        state.toast = {
          msg: String(action.payload ?? "Could not join meeting"),
          type: "error",
        };
      })
      .addCase(completeDoctorVideoConsultation.pending, (state, action) => {
        state.actionLoading[action.meta.arg.id] = "completing";
      })
      .addCase(completeDoctorVideoConsultation.fulfilled, (state, action) => {
        delete state.actionLoading[action.payload];
        state.activeCall = null;
        // ✅ immediately mark as completed in local state so buttons update right away
        const idx = state.appointments.findIndex((a) => a.id === action.payload);
        if (idx !== -1) {
          state.appointments[idx] = {
            ...state.appointments[idx],
            consultation_status: "completed",
          };
        }
        state.toast = { msg: "Consultation marked as completed", type: "success" };
      })
      .addCase(completeDoctorVideoConsultation.rejected, (state, action) => {
        delete state.actionLoading[action.meta.arg.id];
        state.toast = {
          msg: String(action.payload ?? "Could not complete consultation"),
          type: "error",
        };
      })
      .addCase(markDoctorAppointmentNoShow.pending, (state, action) => {
        state.actionLoading[action.meta.arg.id] = "no-show";
      })
      .addCase(markDoctorAppointmentNoShow.fulfilled, (state, action) => {
        delete state.actionLoading[action.payload];
        state.toast = { msg: "Patient marked as no-show", type: "success" };
      })
      .addCase(markDoctorAppointmentNoShow.rejected, (state, action) => {
        delete state.actionLoading[action.meta.arg.id];
        state.toast = {
          msg: String(action.payload ?? "Could not mark no-show"),
          type: "error",
        };
      })
      .addCase(cancelDoctorVideoAppointment.pending, (state, action) => {
        state.actionLoading[action.meta.arg.id] = "cancelling";
      })
      .addCase(cancelDoctorVideoAppointment.fulfilled, (state, action) => {
        delete state.actionLoading[action.payload];
        state.cancelModal = null;
        state.toast = { msg: "Appointment cancelled successfully", type: "success" };
      })
      .addCase(cancelDoctorVideoAppointment.rejected, (state, action) => {
        delete state.actionLoading[action.meta.arg.id];
        state.toast = {
          msg: String(action.payload ?? "Could not cancel appointment"),
          type: "error",
        };
      });
  },
});

export const {
  setActiveMode, setActiveTab, setCurrentPage, setCancelModal,
  setActiveCall, clearToast, clearUnseenIds,
  forceOngoing,
} = doctorVideoSlice.actions;

export default doctorVideoSlice.reducer;