import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import API from "../../api/axios";
import type { Specialization, AdminSpecializationState } from "../../types/admin.ts";

const initialState: AdminSpecializationState = {
  specializations: [],
  loading: false,
  search: "",
  currentPage: 1,
  totalPages: 1,
  totalDepartments: 0,
  direction: 1,
  pageSize: 6,
};

const normalizeDepartment = (item: any): Specialization => ({
  id: Number(item.id || item.department_id || item._id),
  name: item.name || item.specialization || item.department_name || "",
  description: item.description || item.sdescription || "",
  doctors: 0,
});

//Thunk for fetch the specilaization-----------------

export const fetchAdminSpecializations = createAsyncThunk(
  "adminSpecializations/fetchAdminSpecializations",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as {
        adminSpecializations: AdminSpecializationState;
      };

      const { currentPage, search, pageSize } = state.adminSpecializations;
      const limit = pageSize;
      const [deptRes, doctorRes] = await Promise.all([
        API.get("/departments", {
          params: {
            page: currentPage,
            limit,
            search: search.trim() || undefined,
          },
        }),

        API.get("/doctors", {
          params: {
            page: 1,
            limit: 1000,
          },
        }),
      ]);

      const doctors =
        doctorRes.data?.data?.doctors ||
        doctorRes.data?.doctors ||
        doctorRes.data?.data ||
        [];
      const counts: Record<string, number> = {};
      if (Array.isArray(doctors)) {
        doctors.forEach((doctor: any) => {
          const s = doctor.specialization?.trim().toLowerCase();

          if (s) {
            counts[s] = (counts[s] || 0) + 1;
          }
        });
      }
      const rawDepartments =
        deptRes.data?.data?.departments ||
        deptRes.data?.data?.specializations ||
        deptRes.data?.departments ||
        deptRes.data?.specializations ||
        deptRes.data?.data ||
        [];
      const departments = Array.isArray(rawDepartments)
        ? rawDepartments.map((item: any) => {
          const dept = normalizeDepartment(item);
          return {
            ...dept,
            doctors: counts[dept.name.trim().toLowerCase()] || 0,
          };
        })
        : [];

      return {
        specializations: departments,
        totalPages:
          deptRes.data?.data?.totalPages ||
          deptRes.data?.totalPages ||
          1,

        totalDepartments:
          deptRes.data?.data?.total ||
          deptRes.data?.total ||
          departments.length,
      };
    } catch (error) {
      return rejectWithValue("Failed to fetch specializations");
    }
  }
);

//--------Thunk for delete the specialization----------------

export const deleteSpecialization = createAsyncThunk(
  "adminSpecializations/deleteSpecialization",
  async (id: number, { dispatch, rejectWithValue }) => {
    try {
      await API.delete(`/departments/${id}`);
      dispatch(fetchAdminSpecializations());
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Delete failed"
      );
    }
  }
);

//------------Reducers--------------

const adminSpecializationSlice = createSlice({
  name: "adminSpecializations",
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
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
    setPageSize: (state, action: PayloadAction<number>) => {  // ← add this
      state.pageSize = action.payload;
      state.currentPage = 1;
      state.direction = 1;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminSpecializations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminSpecializations.fulfilled, (state, action) => {
        state.loading = false;
        state.specializations = action.payload.specializations;
        state.totalPages = action.payload.totalPages;
        state.totalDepartments = action.payload.totalDepartments;
      })

      .addCase(fetchAdminSpecializations.rejected, (state) => {
        state.loading = false;
        state.specializations = [];
        state.totalPages = 1;
        state.totalDepartments = 0;
      });
  },
});

export const { setSearch, setPage,setPageSize  } = adminSpecializationSlice.actions;
export default adminSpecializationSlice.reducer;