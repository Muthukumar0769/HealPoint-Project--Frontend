import { configureStore } from "@reduxjs/toolkit";
import doctorListingReducer from "./slices/DoctorListingSlice";
import adminDoctorsReducer from "./slices/AdminDoctorSlice";
import adminPatientsReducer from "./slices/AdminPatientSlice";
import adminSpecializationsReducer from "./slices/AdminSpecializationSlice";
import doctorScheduleReducer from "./slices/DoctorScheduleSlice";
 import bookAppointmentReducer from "./slices/BookAppointmentSlice";
 import doctorAppointmentsReducer from "./slices/DoctorAppointmentSlice";
 import doctorVideoReducer from "./slices/DoctorVideoSlice";
 import doctorNotificationReducer from './slices/NotificationSlice';
 import adminReportsReducer from "./slices/AdminReportsSlice";
 import adminEarningsReducer from "./slices/AdminEarningsSlice";

export const store = configureStore({
  reducer: {
    doctorListing: doctorListingReducer,
     adminDoctors: adminDoctorsReducer,
     adminPatients: adminPatientsReducer,
     adminSpecializations: adminSpecializationsReducer,
    doctorSchedule: doctorScheduleReducer,
    bookAppointment: bookAppointmentReducer,
    doctorAppointments: doctorAppointmentsReducer,
    doctorVideo: doctorVideoReducer,
    doctorNotifications: doctorNotificationReducer,
    adminReports: adminReportsReducer,
    adminEarnings: adminEarningsReducer,
    
    
   
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;