import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import API from "../../api/axios";
import type {EarningsState} from '../../types/admin'

const initialState: EarningsState = {
    data: null,
    loading: false,
    error: null,
    filter: "month",
    page: 1,
};

export const fetchEarningsDashboard = createAsyncThunk("adminEarnings/fetchDashboard",
    async ({ filter }: { filter: string; page: number }, { rejectWithValue }) => {
        try {
            const res = await API.get(`/admin/dashboard/earnings-report?period=${filter}`);
            const d = res.data.data;
            const recentConsultations = d.recentConsultations ?? [];
            const videoCall = recentConsultations.filter((r: any) =>
                r.consultationType?.toLowerCase().includes("video")
            );
            const videoCallRevenue = videoCall.reduce((sum: number, r: any) => sum + r.amount, 0);
            return {
                summary: {
                    totalRevenue: d.summary.totalRevenue,
                    totalConsultations: d.summary.totalConsultations,
                    videoCallRevenue,
                    clinicVisitRevenue: 0,
                    avgPerConsultation: d.summary.avgPerVisit ?? 0,
                    revenueChange: 0,
                    consultationChange: 0,
                    videoCallChange: 0,
                    clinicVisitChange: 0,
                    avgChange: 0,
                },
                categoryData: {
                    videoCall: videoCallRevenue,
                    clinicVisit: 0,
                    videoCallCount: videoCall.length,
                    clinicVisitCount: 0,
                },
                trendData: (d.revenueTrend ?? []).map((t: any) => ({
                    label: t.month,
                    videoCall: Number(t.revenue),
                    clinicVisit: 0,
                })),
                topDoctors: [],
                recentConsultations: {
                    rows: recentConsultations.map((r: any) => ({
                        id: Math.random(),
                        patient_name: r.patientName ?? "—",
                        patient_profile: "",
                        doctor_name: r.doctorName ?? "—",
                        doctor_profile: "",
                        specialization: r.specialization ?? "",
                        consultation_type: r.consultationType?.toLowerCase().includes("video")
                            ? "video_call"
                            : "clinic_visit",
                        consultation_date: r.appointmentDate ?? "",
                        amount: r.amount,
                        payment_status: r.paymentStatus ?? "paid",
                    })),
                    totalPages: 1,
                    currentPage: 1,
                    totalRecords: recentConsultations.length,
                },
            };
        } catch (err: any) {
            return rejectWithValue(err?.response?.data?.message ?? "Something went wrong");
        }
    }
);

const adminEarningsSlice = createSlice({
    name: "adminEarnings",
    initialState,
    reducers: {
        setFilter(state, action: PayloadAction<"week" | "month" | "year">) {
            state.filter = action.payload;
            state.page = 1;
        },
        setPage(state, action: PayloadAction<number>) {
            state.page = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchEarningsDashboard.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEarningsDashboard.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchEarningsDashboard.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setFilter, setPage } = adminEarningsSlice.actions;
export default adminEarningsSlice.reducer;