import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import API from "../../api/axios";
import type { ApiPatient, Patient } from "../../types/patient";

type AdminPatientsState = {
  patients: Patient[];
  loading: boolean;
  totalPatients: number;
  totalPages: number;
  currentPage: number;
  direction: number;

  search: string;
  genderFilter: string;
  bloodGroupFilter: string;
  statusFilter: string;
};

const initialState: AdminPatientsState = {
  patients: [],
  loading: false,
  totalPatients: 0,
  totalPages: 1,
  currentPage: 1,
  direction: 1,

  search: "",
  genderFilter: "All",
  bloodGroupFilter: "All",
  statusFilter: "All",
};

const formatDateOnly = (date?: string) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizePatient = (patient: ApiPatient): Patient => {
  const isActive = patient.is_active || patient.user?.is_active;

  return {
    id: patient.id,
    name: patient.name || patient.user?.name || "Unknown",
    email: patient.email || patient.user?.email || "N/A",

    phone: String(
      patient.phone_number ||
        patient.phone ||
        patient.user?.phone_number ||
        patient.user?.phone ||
        "N/A"
    ),

    gender: patient.gender || patient.user?.gender || "N/A",

    blood_group:
      patient.blood_group ||
      patient.user?.blood_group ||
      "N/A",

    dob: patient.dob || patient.user?.dob || "N/A",

    registeredOn: formatDateOnly(
      patient.created_at ||
        patient.createdAt ||
        patient.user?.created_at ||
        patient.user?.createdAt
    ),

    status: isActive ? "Active" : "Inactive",
  };
};

export const fetchAdminPatients = createAsyncThunk(
  "adminPatients/fetchAdminPatients",

  async (_, { getState, rejectWithValue }) => {
    const state = getState() as {
      adminPatients: AdminPatientsState;
    };

    const {
      currentPage,
      search,
      genderFilter,
      bloodGroupFilter,
      statusFilter,
    } = state.adminPatients;

    try {
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (genderFilter !== "All") {
        params.gender = genderFilter;
      }

      if (bloodGroupFilter !== "All") {
        params.blood_group = bloodGroupFilter;
      }

      if (statusFilter !== "All") {
        params.is_active = statusFilter === "Active";
      }

      const res = await API.get("/patients", {
        params,
      });

      const patientsData =
        res.data?.data?.patients ||
        res.data?.patients ||
        res.data?.data ||
        [];

      const patientsArray = Array.isArray(patientsData)
        ? patientsData
        : [];

      return {
        patients: patientsArray.map(normalizePatient),

        totalPatients:
          res.data?.data?.total ||
          res.data?.total ||
          patientsArray.length,

        totalPages:
          res.data?.data?.totalPages ||
          res.data?.totalPages ||
          1,
      };
    } catch (error) {
      return rejectWithValue(
        "Failed to fetch patients"
      );
    }
  }
);

const adminPatientsSlice = createSlice({
  name: "adminPatients",

  initialState,

  reducers: {
    setSearch: (
      state,
      action: PayloadAction<string>
    ) => {
      state.search = action.payload;
      state.currentPage = 1;
      state.direction = 1;
    },

    setGenderFilter: (
      state,
      action: PayloadAction<string>
    ) => {
      state.genderFilter = action.payload;
      state.currentPage = 1;
    },

    setBloodGroupFilter: (
      state,
      action: PayloadAction<string>
    ) => {
      state.bloodGroupFilter = action.payload;
      state.currentPage = 1;
    },

    setStatusFilter: (
      state,
      action: PayloadAction<string>
    ) => {
      state.statusFilter = action.payload;
      state.currentPage = 1;
    },

    setPage: (
      state,
      action: PayloadAction<{
        page: number;
        dir: number;
      }>
    ) => {
      state.currentPage = action.payload.page;
      state.direction = action.payload.dir;
    },

    clearFilters: (state) => {
      state.search = "";
      state.genderFilter = "All";
      state.bloodGroupFilter = "All";
      state.statusFilter = "All";

      state.currentPage = 1;
      state.direction = 1;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminPatients.pending, (state) => {
        state.loading = true;
      })

      .addCase(
        fetchAdminPatients.fulfilled,
        (state, action) => {
          state.loading = false;
          state.patients = action.payload.patients;
          state.totalPatients =action.payload.totalPatients;
          state.totalPages =action.payload.totalPages;
        }
      )

      .addCase(fetchAdminPatients.rejected, (state) => {
        state.loading = false;
        state.patients = [];
        state.totalPatients = 0;
        state.totalPages = 1;
      });
  },
});

export const {setSearch,setGenderFilter,setBloodGroupFilter,setStatusFilter,
  setPage,clearFilters,} = adminPatientsSlice.actions;
export default adminPatientsSlice.reducer;

