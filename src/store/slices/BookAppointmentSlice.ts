import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import API from "../../api/axios";
import type { Slot, DateItem, BookAppointmentState, ConsultationType,} from "../../types/patient";

const getDayLabel = (dateStr: string, index: number): string => {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";

  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
  });
};

export const generateNext7Days = (): DateItem[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);

    const dateStr = d.toISOString().split("T")[0];

    return {
      date: dateStr,
      day: getDayLabel(dateStr, i),
    };
  });
};

const initialState: BookAppointmentState = {
  dateItems: generateNext7Days(),
  slots: [],
  slotsLoading: false,
  slotsError: null,
  selectedDateIndex: 0,
  selectedSlot: null,
  consultationType: "Video Call",
  paymentMethod: "online",
  consultationReason: "",
  bookingLoading: false,
  bookingError: null,
  appointmentId: null,
  razorpayOrderId: null,
  orderLoading: false,
  orderError: null,
  paymentSuccess: false,
};

export const fetchSlotsForDate = createAsyncThunk(
  "bookAppointment/fetchSlotsForDate",
  async (
    { doctorId, date }: { doctorId: string; date: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await API.get(`/slots/${doctorId}`, {
        params: { date },
      });

      const raw: Slot[] =
        res.data?.slots ||
        res.data?.data?.slots ||
        res.data?.data ||
        res.data ||
        [];

      return Array.isArray(raw) ? raw : [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch slots"
      );
    }
  }
);

export const submitBooking = createAsyncThunk(
  "bookAppointment/submitBooking",
  async (
    payload: {
      doctorId: string;
      date: string;
      start_time: string;
      end_time: string;
      consultation_type: ConsultationType;
      reason: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await API.post("/appointments/book", {
        doctor_id: Number(payload.doctorId),
        appointment_date: payload.date,
        start_time: payload.start_time,
        end_time: payload.end_time,
        consultation_type: payload.consultation_type,
        reason: payload.reason,
      });

      const appointment = res.data?.appointment || res.data?.data || res.data;

      return appointment.id as number;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Booking failed");
    }
  }
);

export const createRazorpayOrder = createAsyncThunk(
  "bookAppointment/createRazorpayOrder",
  async (appointmentId: number, { rejectWithValue }) => {
    try {
      const res = await API.post("/payments/create-order", {
        appointment_id: appointmentId,
      });

      const order = res.data?.order || res.data?.data || res.data;

      return {
        orderId: order.id as string,
        amount: order.amount as number,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create payment order"
      );
    }
  }
);

export const verifyRazorpayPayment = createAsyncThunk(
  "bookAppointment/verifyRazorpayPayment",
  async (
    payload: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await API.post("/payments/verify", payload);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Payment verification failed"
      );
    }
  }
);

const bookAppointmentSlice = createSlice({
  name: "bookAppointment",
  initialState,
  reducers: {
    setSelectedDateIndex: (state, action: PayloadAction<number>) => {
      state.selectedDateIndex = action.payload;
      state.selectedSlot = null;
      state.slots = [];
      state.slotsError = null;
    },

    setSelectedSlot: (state, action: PayloadAction<Slot>) => {
      state.selectedSlot = action.payload;
    },

    setConsultationType: (
      state,
      action: PayloadAction<ConsultationType>
    ) => {
      state.consultationType = action.payload;

      if (action.payload === "Video Call") {
        state.paymentMethod = "online";
      }
    },

    setPaymentMethod: (state, action: PayloadAction<"online" | "clinic">) => {
      state.paymentMethod = action.payload;
    },

    setConsultationReason: (state, action: PayloadAction<string>) => {
      state.consultationReason = action.payload;
    },

    setPaymentSuccess: (state, action: PayloadAction<boolean>) => {
      state.paymentSuccess = action.payload;
    },

    resetBooking: (state) => {
      Object.assign(state, {
        ...initialState,
        dateItems: generateNext7Days(),
      });
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchSlotsForDate.pending, (state) => {
        state.slotsLoading = true;
        state.slotsError = null;
        state.slots = [];
        state.selectedSlot = null;
      })
      .addCase(fetchSlotsForDate.fulfilled, (state, action) => {
        state.slotsLoading = false;
        state.slots = action.payload;
        state.selectedSlot = null;
      })
      .addCase(fetchSlotsForDate.rejected, (state, action: any) => {
        state.slotsLoading = false;
        state.slotsError = action.payload;
        state.slots = [];
      });

    builder
      .addCase(submitBooking.pending, (state) => {
        state.bookingLoading = true;
        state.bookingError = null;
        state.appointmentId = null;
      })
      .addCase(submitBooking.fulfilled, (state, action) => {
        state.bookingLoading = false;
        state.appointmentId = action.payload;
      })
      .addCase(submitBooking.rejected, (state, action: any) => {
        state.bookingLoading = false;
        state.bookingError = action.payload;
      });

    builder
      .addCase(createRazorpayOrder.pending, (state) => {
        state.orderLoading = true;
        state.orderError = null;
        state.razorpayOrderId = null;
      })
      .addCase(createRazorpayOrder.fulfilled, (state, action) => {
        state.orderLoading = false;
        state.razorpayOrderId = action.payload.orderId;
      })
      .addCase(createRazorpayOrder.rejected, (state, action: any) => {
        state.orderLoading = false;
        state.orderError = action.payload;
      });

    builder
      .addCase(verifyRazorpayPayment.pending, (state) => {
        state.paymentSuccess = false;
      })
      .addCase(verifyRazorpayPayment.fulfilled, (state) => {
        state.paymentSuccess = true;
      })
      .addCase(verifyRazorpayPayment.rejected, (state) => {
        state.paymentSuccess = false;
      });
  },
});

export const {setSelectedDateIndex,setSelectedSlot,setConsultationType,setPaymentMethod,
  setConsultationReason,setPaymentSuccess,resetBooking} = bookAppointmentSlice.actions;
export default bookAppointmentSlice.reducer;