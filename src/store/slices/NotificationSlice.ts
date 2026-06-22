import { createSlice } from "@reduxjs/toolkit";

interface NotificationState {
  appointments: boolean;
  consultations: boolean;
  earnings: boolean;
  videoConsultations: {
    video: boolean;
    clinic: boolean;
  };
}

const EARNING_DOT_KEY = "doctor_earning_dot";
const VIDEO_DOT_KEY = "doctor_video_dot";
const CLINIC_DOT_KEY = "doctor_clinic_dot";

const initialState: NotificationState = {
  appointments: false,
  consultations: false,
  earnings: localStorage.getItem(EARNING_DOT_KEY) === "true",
  videoConsultations: {
    video: localStorage.getItem(VIDEO_DOT_KEY) === "true",
    clinic: localStorage.getItem(CLINIC_DOT_KEY) === "true",
  },
};

const doctorNotificationSlice = createSlice({
  name: "doctorNotifications",
  initialState,
  reducers: {
    setAppointmentNotification: (state) => {
      state.appointments = true;
    },
    clearAppointmentNotification: (state) => {
      state.appointments = false;
    },

    setConsultationNotification: (state) => {
      state.consultations = true;
    },
    clearConsultationNotification: (state) => {
      state.consultations = false;
    },

    setEarningNotification: (state) => {
      state.earnings = true;
      localStorage.setItem(EARNING_DOT_KEY, "true");
    },
    clearEarningNotification: (state) => {
      state.earnings = false;
      localStorage.removeItem(EARNING_DOT_KEY);
    },

    setVideoNotification: (state) => {
      state.videoConsultations.video = true;
      localStorage.setItem(VIDEO_DOT_KEY, "true");
    },
    clearVideoNotification: (state) => {
      state.videoConsultations.video = false;
      localStorage.removeItem(VIDEO_DOT_KEY);
    },

    setClinicNotification: (state) => {
      state.videoConsultations.clinic = true;
      localStorage.setItem(CLINIC_DOT_KEY, "true");
    },
    clearClinicNotification: (state) => {
      state.videoConsultations.clinic = false;
      localStorage.removeItem(CLINIC_DOT_KEY);
    },
  },
});

export const {setAppointmentNotification,clearAppointmentNotification,setConsultationNotification,
  clearConsultationNotification,setEarningNotification,clearEarningNotification,setVideoNotification,
  clearVideoNotification,setClinicNotification,clearClinicNotification,} = doctorNotificationSlice.actions;
export default doctorNotificationSlice.reducer;