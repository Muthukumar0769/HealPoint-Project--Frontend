import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AdminDoctor } from "../../types/doctor";
import API from "../../api/axios";

type AdminDoctorsState = {
  doctors: AdminDoctor[];
  loading: boolean;
  firstLoad: boolean;
  totalDoctors: number;
  totalPages: number;
  currentPage: number;
  direction: number;
  searchSpecialization: string;
};

const initialState: AdminDoctorsState = {
  doctors: [],
  loading: false,
  firstLoad: true,
  totalDoctors: 0,
  totalPages: 1,
  currentPage: 1,
  direction: 1,
  searchSpecialization: "",
};

export const fetchAdminDoctors = createAsyncThunk("adminDoctors/fetchAdminDoctors",
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { adminDoctors: AdminDoctorsState };
    const { currentPage, searchSpecialization } = state.adminDoctors;

    try {
      const res = await API.get("/doctors", {
        params: {
          page: currentPage,
          limit: 6,
          specialization: searchSpecialization.trim() || undefined,
        },
      });

      const data =
        res.data?.data?.doctors ||
        res.data?.doctors ||
        res.data?.data ||
        [];

      return {
        doctors: Array.isArray(data) ? data : [],
        totalPages: res.data?.data?.totalPages || res.data?.totalPages || 1,
        totalDoctors: res.data?.data?.total || res.data?.total || data.length || 0,
      };
    } catch (error) {
      return rejectWithValue("Failed to fetch doctors");
    }
  }
);

export const deleteAdminDoctor = createAsyncThunk(
  "adminDoctors/deleteAdminDoctor",
  async (doctorId: number, { dispatch, rejectWithValue }) => {
    try {
      await API.delete(`/doctors/${doctorId}`);
      dispatch(fetchAdminDoctors()); 
      return doctorId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete doctor"
      );
    }
  }
);

const adminDoctorsSlice = createSlice({
  name: "adminDoctors",
  initialState,
  reducers: {
    setSearchSpecialization: (state, action: PayloadAction<string>) => {
      state.searchSpecialization = action.payload;
      state.currentPage = 1;
      state.direction = 1;
    },

    clearSearch: (state) => {
      state.searchSpecialization = "";
      state.currentPage = 1;
      state.direction = 1;
    },

    setPage: (
      state,
      action: PayloadAction<{ page: number; dir: number }>
    ) => {
      state.currentPage = action.payload.page;
      state.direction = action.payload.dir;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDoctors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminDoctors.fulfilled, (state, action) => {
        state.doctors = action.payload.doctors;
        state.totalPages = action.payload.totalPages;
        state.totalDoctors = action.payload.totalDoctors;
        state.loading = false;
        state.firstLoad = false;
      })
      .addCase(fetchAdminDoctors.rejected, (state) => {
        state.doctors = [];
        state.totalPages = 1;
        state.totalDoctors = 0;
        state.loading = false;
        state.firstLoad = false;
      });
  },
});

export const {setSearchSpecialization,clearSearch,setPage} = adminDoctorsSlice.actions;
export default adminDoctorsSlice.reducer;