import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { ApiDoctor, Department } from "../../types/patient.ts";
import type { AdminDoctor } from "../../types/doctor.ts";
import API from "../../api/axios";
import { isBookableSlot } from "../../utils/slotHelpers";
import type { Filters } from "../../types/patient.ts";

type DoctorListingState = {
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
  selectedDoctor: AdminDoctor | null;
  detailsLoading: boolean;
  doctorAvailability: Record<string, boolean>;
  availabilityLoading: Record<string, boolean>;
};

const initialState: DoctorListingState = {
  doctors: [],
  departments: [],
  currentPage: 1,
  totalPages: 1,
  totalDoctors: 0,
  direction: 1,
  loading: false,
  firstLoad: true,
  openFilter: null,
  openMobileFilter: false,
  selectedDoctor: null,
  detailsLoading: false,
  doctorAvailability: {},
  availabilityLoading: {},
  filters: {
    search: "",
    selectedSpecialization: "",
    selectedExperience: "",
    selectedGender: "",
    selectedFees: "",
    selectedStatus: "",
  },
};

export const fetchDepartments = createAsyncThunk("doctorListing/fetchDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get("/departments", {
        params: { page: 1, limit: 100 },
      });
      const raw = res.data?.data?.departments ||
        res.data?.data?.specializations ||
        res.data?.departments ||
        res.data?.specializations ||
        res.data?.data ||
        [];

      const list: Department[] = Array.isArray(raw)
        ? raw.map((item: any) => ({
          id: Number(item.id || item.department_id || item._id),
          name: item.name || item.specialization || "",
        })).filter((d: Department) => d.name) : [];
      return list;
    } catch {
      return rejectWithValue("Failed to fetch departments");
    }
  }
);

export const fetchDoctors = createAsyncThunk("doctorListing/fetchDoctors",
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { doctorListing: DoctorListingState };
    const { currentPage, filters } = state.doctorListing;
    const { search, selectedSpecialization, selectedExperience, selectedGender,
      selectedFees } = filters;
    const feesMax = selectedFees ? selectedFees.split("-")[1] : undefined;
    try {
      const res = await API.get("/doctors", {
        params: {
          page: currentPage,
          limit: 6,
          specialization: selectedSpecialization || search.trim() || undefined,
          gender: selectedGender || undefined,
          experience_years: selectedExperience || undefined,
          consultation_fee: feesMax || undefined,
        },
      });

      const data = res.data?.data?.doctors ||
        res.data?.doctors ||
        res.data?.data || [];

      return {
        doctors: Array.isArray(data) ? data : [],
        totalPages: res.data?.data?.totalPages || res.data?.totalPages || 1,
        totalDoctors: res.data?.data?.total || res.data?.total || data.length || 0,
      };
    } catch {
      return rejectWithValue("Failed to fetch doctors");
    }
  }
);

export const fetchDoctorById = createAsyncThunk("doctorListing/fetchDoctorById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await API.get(`/doctors/${id}`);
      const data = res.data?.data?.doctor || res.data?.doctor ||
        res.data?.data || res.data;
      return data as AdminDoctor;
    } catch {
      return rejectWithValue("Failed to fetch doctor details");
    }
  }
);

export const checkDoctorAvailability = createAsyncThunk(
  "doctorListing/checkDoctorAvailability",
  async (doctorId: string, { rejectWithValue }) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await API.get(`/slots/${doctorId}`, {
        params: { date: today },
      });

      const raw: any[] =
        res.data?.slots ||
        res.data?.data?.slots ||
        res.data?.data ||
        res.data ||
        [];

      const hasSlots = Array.isArray(raw) && raw.filter(isBookableSlot).length > 0
      return { doctorId, available: hasSlots };
    } catch {
      return rejectWithValue({ doctorId, available: false });
    }
  }
);

export const checkAllDoctorsAvailability = createAsyncThunk("doctorListing/checkAllDoctorsAvailability",
  async (doctorIds: string[], { dispatch }) => {
    await Promise.allSettled(
      doctorIds.map((id) => dispatch(checkDoctorAvailability(id)))
    );
  }
);

const doctorListingSlice = createSlice({
  name: "doctorListing",
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<{ key: keyof Filters; value: string }>) => {
      state.filters[action.payload.key] = action.payload.value;
      state.currentPage = 1;
      state.direction = 1;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.currentPage = 1;
      state.direction = 1;
      state.openFilter = null;
      state.openMobileFilter = false;
    },
    setOpenFilter: (state, action: PayloadAction<string | null>) => {
      state.openFilter = action.payload;
    },
    setOpenMobileFilter: (state, action: PayloadAction<boolean>) => {
      state.openMobileFilter = action.payload;
    },
    setPage: (state, action: PayloadAction<{ page: number; dir: number }>) => {
      state.currentPage = action.payload.page;
      state.direction = action.payload.dir;
    },
    resetPage: (state) => {
      state.currentPage = 1;
      state.direction = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departments = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state) => {
        state.departments = [];
      });

    builder
      .addCase(fetchDoctors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDoctors.fulfilled, (state, action) => {
        state.doctors = action.payload.doctors;
        state.totalPages = action.payload.totalPages;
        state.totalDoctors = action.payload.totalDoctors;
        state.loading = false;
        state.firstLoad = false;
      })
      .addCase(fetchDoctors.rejected, (state) => {
        state.doctors = [];
        state.totalPages = 1;
        state.totalDoctors = 0;
        state.loading = false;
        state.firstLoad = false;
      });
    builder
      .addCase(fetchDoctorById.pending, (state) => {
        state.detailsLoading = true;
        state.selectedDoctor = null;
      })
      .addCase(fetchDoctorById.fulfilled, (state, action) => {
        state.selectedDoctor = action.payload;
        state.detailsLoading = false;
      })
      .addCase(fetchDoctorById.rejected, (state) => {
        state.selectedDoctor = null;
        state.detailsLoading = false;
      });
    builder
      .addCase(checkDoctorAvailability.pending, (state, action) => {
        const doctorId = action.meta.arg;
        state.availabilityLoading[doctorId] = true;
      })
      .addCase(checkDoctorAvailability.fulfilled, (state, action) => {
        const { doctorId, available } = action.payload;
        state.doctorAvailability[doctorId] = available;
        state.availabilityLoading[doctorId] = false;
      })
      .addCase(checkDoctorAvailability.rejected, (state, action: any) => {
        const doctorId = action.meta.arg;
        state.doctorAvailability[doctorId] = false;
        state.availabilityLoading[doctorId] = false;
      });
  },
});

export const { setFilter, clearFilters, setOpenFilter, setOpenMobileFilter, setPage,
  resetPage } = doctorListingSlice.actions;
export default doctorListingSlice.reducer;