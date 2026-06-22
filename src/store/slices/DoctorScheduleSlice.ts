import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import API from "../../api/axios";
import type { InitialState } from "../../types/doctor";

const initialState: InitialState = {
  loading: false,
  fetchLoading: false,
  normalSchedules: [],
  specialSchedules: [],
  leaves: [],
  error: null,
};

export const createAvailability = createAsyncThunk("schedule/createAvailability",
  async (
    data: {
      day_of_week: string;
      start_time: string;
      end_time: string;
      slot_duration: number;
      break_start?: string | null;
      break_end?: string | null;
    },
    thunkAPI
  ) => {
    try {
      const response = await API.post("/availability", data);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to create schedule"
      );
    }
  }
);

export const createSpecialAvailability = createAsyncThunk("schedule/createSpecialAvailability",
  async (
    data: {
      date: string;
      start_time: string;
      end_time: string;
      slot_duration: number;
    },
    thunkAPI
  ) => {
    try {
      const response = await API.post("/special-availability", data);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to create special schedule"
      );
    }
  }
);

export const createUnavailability = createAsyncThunk("schedule/createUnavailability",
  async (
    data: {
      unavailable_date: string;
      reason: string;
      is_full_day: boolean;
      start_time?: string | null;
      end_time?: string | null;
    }[],
    thunkAPI
  ) => {
    try {
      const responses = await Promise.all(
        data.map((item) => API.post("/unavailability", item))
      );
      return responses.map((res) => res.data);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to apply leave"
      );
    }
  }
);

export const fetchNormalSchedules = createAsyncThunk("schedule/fetchNormalSchedules",
  async (_, thunkAPI) => {
    try {
      const response = await API.get("/availability");
      const raw =
        response.data?.data?.availabilities ||
        response.data?.availabilities ||
        response.data?.data ||
        response.data ||
        [];
      return Array.isArray(raw) ? raw : [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch schedules"
      );
    }
  }
);

export const fetchSpecialSchedules = createAsyncThunk("schedule/fetchSpecialSchedules",
  async (_, thunkAPI) => {
    try {
      const response = await API.get("/special-availability");
      const raw = response.data?.data?.specialAvailabilities ||
        response.data?.specialAvailabilities ||
        response.data?.data ||
        response.data ||
        [];
      return Array.isArray(raw) ? raw : [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch special schedules"
      );
    }
  }
);

export const fetchLeaves = createAsyncThunk("schedule/fetchLeaves",
  async (_, thunkAPI) => {
    try {
      const response = await API.get("/unavailability");
      const raw = response.data?.data?.unavailabilities ||
        response.data?.unavailabilities ||
        response.data?.data ||
        response.data ||
        [];
      return Array.isArray(raw) ? raw : [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch leaves"
      );
    }
  }
);

export const fetchAllSchedules = createAsyncThunk("schedule/fetchAllSchedules",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const results = await Promise.allSettled([
        dispatch(fetchNormalSchedules()),
        dispatch(fetchSpecialSchedules()),
        dispatch(fetchLeaves()),
      ]);
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length === results.length) {
        return rejectWithValue("Failed to fetch all schedules");
      }
    } catch (error: any) {
      return rejectWithValue("Failed to fetch schedules");
    }
  }
);

export const deleteNormalSchedule = createAsyncThunk("schedule/deleteNormalSchedule",
  async (id: number, thunkAPI) => {
    try {
      await API.delete(`/availability/${id}`);
      return id;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete schedule"
      );
    }
  }
);

export const deleteSpecialSchedule = createAsyncThunk("schedule/deleteSpecialSchedule",
  async (id: number, thunkAPI) => {
    try {
      await API.delete(`/special-availability/${id}`);
      return id;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete special schedule"
      );
    }
  }
);

export const deleteLeave = createAsyncThunk("schedule/deleteLeave",
  async (id: number, thunkAPI) => {
    try {
      await API.delete(`/unavailability/${id}`);
      return id;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete leave"
      );
    }
  }
);

const doctorScheduleSlice = createSlice({
  name: "doctorSchedule",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAvailability.fulfilled, (state, action: any) => {
        state.loading = false;
        const created =
          action.payload?.availability ||
          action.payload?.data ||
          action.payload;
        if (created?.id) state.normalSchedules.push(created);
      })
      .addCase(createAvailability.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      });
    builder
      .addCase(createSpecialAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSpecialAvailability.fulfilled, (state, action: any) => {
        state.loading = false;
        const created =
          action.payload?.specialAvailability ||
          action.payload?.data ||
          action.payload;
        if (created?.id) state.specialSchedules.push(created);
      })
      .addCase(createSpecialAvailability.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      });
    builder
      .addCase(createUnavailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUnavailability.fulfilled, (state, action: any) => {
        state.loading = false;
        const items = Array.isArray(action.payload)
          ? action.payload.map(
            (r: any) => r?.unavailability || r?.data || r
          )
          : [];
        state.leaves.push(...items.filter((i: any) => i?.id));
      })
      .addCase(createUnavailability.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      });
    builder
      .addCase(fetchNormalSchedules.pending, (state) => {
        state.fetchLoading = true;
      })
      .addCase(fetchNormalSchedules.fulfilled, (state, action: any) => {
        state.fetchLoading = false;
        state.normalSchedules = Array.isArray(action.payload)
          ? action.payload
          : [];
      })
      .addCase(fetchNormalSchedules.rejected, (state, action: any) => {
        state.fetchLoading = false;
        state.error = action.payload;
      });
    builder
      .addCase(fetchSpecialSchedules.pending, (state) => {
        state.fetchLoading = true;
      })
      .addCase(fetchSpecialSchedules.fulfilled, (state, action: any) => {
        state.fetchLoading = false;
        state.specialSchedules = Array.isArray(action.payload)
          ? action.payload
          : [];
      })
      .addCase(fetchSpecialSchedules.rejected, (state, action: any) => {
        state.fetchLoading = false;
        state.error = action.payload;
      });
    builder
      .addCase(fetchLeaves.pending, (state) => {
        state.fetchLoading = true;
      })
      .addCase(fetchLeaves.fulfilled, (state, action: any) => {
        state.fetchLoading = false;
        state.leaves = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchLeaves.rejected, (state, action: any) => {
        state.fetchLoading = false;
        state.error = action.payload;
      });
    builder.addCase(deleteNormalSchedule.fulfilled, (state, action) => {
      state.normalSchedules = state.normalSchedules.filter(
        (s) => s.id !== action.payload
      );
    });
    builder.addCase(deleteSpecialSchedule.fulfilled, (state, action) => {
      state.specialSchedules = state.specialSchedules.filter(
        (s) => s.id !== action.payload
      );
    });
    builder.addCase(deleteLeave.fulfilled, (state, action) => {
      state.leaves = state.leaves.filter((l) => l.id !== action.payload);
    });
  },
});

export default doctorScheduleSlice.reducer;