import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import API from "../../api/axios";
import { isBookableSlot } from "../../utils/slotHelpers";
import type {
  AdminReportsState, PaginatedDoctors, LeaveDoctor,
  AvailableDoctor, UnavailableDoctor, ReportsDashboardData,
} from "../../types/admin";

const today = new Date().toISOString().split("T")[0]
const initialState: AdminReportsState = {
  data: null,
  loading: false,
  error: null,
  selectedDate: today,
  activeTab: "available",
  page: 1,
  pageSize: 10,
};

const paginate = <T>(rows: T[], page: number, pageSize: number): PaginatedDoctors<T> => ({
  totalRecords: rows.length,
  currentPage: page,
  totalPages: Math.max(1, Math.ceil(rows.length / pageSize)),
  rows: rows.slice((page - 1) * pageSize, page * pageSize),
});

//---------Thunk for fetch the doctor available,unavailable based on slot and leave ------------

export const fetchAvailabilityDashboard = createAsyncThunk(
  "adminReports/fetch",
  async ({ date }: { date: string }, { rejectWithValue, getState }) => {
    try {
      // Use the current pageSize from state instead of a hardcoded value,
      // so the user's page-size selection survives a refetch.
      const state = getState() as { adminReports: AdminReportsState };
      const currentPageSize = state.adminReports.pageSize;

      const res = await API.get("/admin/doctor-availability-dashboard", {
        params: { date, page: 1, limit: 1000 },
      });
      const base = res.data.data;

      const allLeave: LeaveDoctor[] = (base.unavailableDoctors?.rows ?? []).map((d: any) => ({
        doctor_id: d.doctor_id,
        doctor_name: d.doctor_name,
        profile_picture: d.profile_picture,
        specialization: d.specialization,
        unavailable_date: d.unavailable_date,
        reason: d.reason,
        is_full_day: d.is_full_day,
        start_time: d.start_time,
        end_time: d.end_time,
        status: "on_leave" as const,
      }));

      const notOnLeaveRows: any[] = [
        ...(base.availableDoctors?.rows ?? []),
        ...(base.unavailableDoctors?.rows ?? []),
      ];
      const slotResults = await Promise.allSettled(
        notOnLeaveRows.map(async (doctor: any) => {
          try {
            const slotRes = await API.get(`/slots/${doctor.doctor_id}`, { params: { date } });
            const raw: any[] =
              slotRes.data?.slots || slotRes.data?.data?.slots ||
              slotRes.data?.data || slotRes.data || [];
            const slots = Array.isArray(raw) ? raw : [];
            const bookable = slots.filter(isBookableSlot).length;
            const total = slots.length;
            return { doctor, bookable, total };
          } catch {
            return { doctor, bookable: 0, total: 0 };
          }
        })
      );

      const allAvailable: AvailableDoctor[] = [];
      const allUnavailable: UnavailableDoctor[] = [];
      slotResults.forEach((result) => {
        if (result.status === "fulfilled") {
          const { doctor, bookable, total } = result.value;
          if (bookable > 0) {
            allAvailable.push({
              doctor_id: doctor.doctor_id, doctor_name: doctor.doctor_name,
              profile_picture: doctor.profile_picture, specialization: doctor.specialization,
              date, status: "available", slots_status: "has_slots",
            });
          } else if (total > 0 && bookable === 0) {
            allAvailable.push({
              doctor_id: doctor.doctor_id, doctor_name: doctor.doctor_name,
              profile_picture: doctor.profile_picture, specialization: doctor.specialization,
              date, status: "available", slots_status: "slots_full",
            });
          } else {
            allUnavailable.push({
              doctor_id: doctor.doctor_id, doctor_name: doctor.doctor_name,
              profile_picture: doctor.profile_picture, specialization: doctor.specialization,
              date, status: "unavailable",
            });
          }
        }
      });

      const data: ReportsDashboardData = {
        summary: {
          totalDoctors: base.summary.totalDoctors,
          availableDoctors: allAvailable.length,
          unavailableDoctors: allUnavailable.length,
          onLeaveDoctors: allLeave.length,
        },
        availableDoctors: paginate(allAvailable, 1, currentPageSize),
        unavailableDoctors: paginate(allUnavailable, 1, currentPageSize),
        onLeaveDoctors: paginate(allLeave, 1, currentPageSize),
        chartData: {
          available: allAvailable.filter(d => d.slots_status === "has_slots").length,
          unavailable: allUnavailable.length,
          onLeave: allLeave.length,
        },
        quickSummary: {
          availableToday: allAvailable.filter(d => d.slots_status === "has_slots").length,
          unavailableToday: allUnavailable.length,
          onLeaveToday: allLeave.length,
        },
        _allAvailable: allAvailable,
        _allUnavailable: allUnavailable,
        _allLeave: allLeave,
      };

      return data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? "Failed to load report");
    }
  }
);

const rebuildSummary = (d: ReportsDashboardData) => {
  d.summary.onLeaveDoctors = d._allLeave.length;
  d.summary.unavailableDoctors = d._allUnavailable.length;
  d.summary.availableDoctors = d._allAvailable.length;
  d.chartData.onLeave = d._allLeave.length;
  d.quickSummary.onLeaveToday = d._allLeave.length;
};

//----------------Reducers-------------------

const adminReportsSlice = createSlice({
  name: "adminReports",
  initialState,
  reducers: {
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
      state.page = 1;
    },
    setActiveTab: (state, action: PayloadAction<"available" | "unavailable" | "leave">) => {
      state.activeTab = action.payload;
      state.page = 1;
      if (state.data) {
        const d = state.data as ReportsDashboardData;
        if (action.payload === "available") {
          d.availableDoctors = paginate(d._allAvailable, 1, state.pageSize);
        } else if (action.payload === "unavailable") {
          d.unavailableDoctors = paginate(d._allUnavailable, 1, state.pageSize);
        } else {
          d.onLeaveDoctors = paginate(d._allLeave, 1, state.pageSize);
        }
      }
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
      if (state.data) {
        const d = state.data as ReportsDashboardData;
        if (state.activeTab === "available") {
          d.availableDoctors = paginate(d._allAvailable, action.payload, state.pageSize);
        } else if (state.activeTab === "unavailable") {
          d.unavailableDoctors = paginate(d._allUnavailable, action.payload, state.pageSize);
        } else {
          d.onLeaveDoctors = paginate(d._allLeave, action.payload, state.pageSize);
        }
      }
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.page = 1;
      if (state.data) {
        const d = state.data as ReportsDashboardData;
        d.availableDoctors = paginate(d._allAvailable, 1, action.payload);
        d.unavailableDoctors = paginate(d._allUnavailable, 1, action.payload);
        d.onLeaveDoctors = paginate(d._allLeave, 1, action.payload);
      }
    },
    removeLeaveByDate: (state, action: PayloadAction<string>) => {
      if (!state.data) return;
      const d = state.data as ReportsDashboardData;
      d._allLeave = d._allLeave.filter(
        (l) => l.unavailable_date !== action.payload
      );
      rebuildSummary(d);
      const curPage = state.activeTab === "leave" ? state.page : 1;
      d.onLeaveDoctors = paginate(d._allLeave, curPage, state.pageSize);
    },
    updateLeaveRecord: (
      state,
      action: PayloadAction<{
        oldDate: string;
        newDate: string;
        is_full_day: boolean;
        start_time: string | null;
        end_time: string | null;
        reason: string;
      }>
    ) => {
      if (!state.data) return;
      const d = state.data as ReportsDashboardData;
      const { oldDate, newDate, is_full_day, start_time, end_time, reason } = action.payload;
      const idx = d._allLeave.findIndex((l) => l.unavailable_date === oldDate);
      if (idx !== -1) {
        d._allLeave[idx] = {
          ...d._allLeave[idx],
          unavailable_date: newDate,
          is_full_day,
          start_time: start_time ?? undefined,
          end_time: end_time ?? undefined,
          reason,
        };
      }
      rebuildSummary(d);
      const curPage = state.activeTab === "leave" ? state.page : 1;
      d.onLeaveDoctors = paginate(d._allLeave, curPage, state.pageSize);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailabilityDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.page = 1;
      })
      .addCase(fetchAvailabilityDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.page = 1;
      })
      .addCase(fetchAvailabilityDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? "Failed to load report");
      });
  },
});

export const { setSelectedDate, setActiveTab, setPage, setPageSize, removeLeaveByDate, updateLeaveRecord } =
  adminReportsSlice.actions;
export default adminReportsSlice.reducer;