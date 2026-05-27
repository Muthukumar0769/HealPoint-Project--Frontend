import { Routes, Route } from "react-router-dom";
import "./App.css";
import { Navbar } from "./components/Navbar/Navbar";
import { Home } from "./pages/Patient/Home";
import { Footer } from "./components/Header/Footer";
import { Login } from "./pages/Auth/Login";
import { Register } from "./pages/Auth/Register";
import { About } from "./pages/Patient/About";
import { Contact } from "./pages/Patient/Contact";
import { ForgotPassword } from "./pages/Auth/ForgotPassword";
import { DoctorListing } from "./pages/Patient/DoctorListing";
import { DoctorDetails } from "./pages/Patient/DoctorDetails";
import { BookAppointment } from "./pages/Patient/BookAppointment";
import { AdminDashboard } from "./pages/Admin/AdminDashboard";
import { AddDoctor } from "./pages/Admin/AddDoctor";
import { MyProfile } from "./pages/Patient/MyProfile";
import { Doctors } from "./pages/Admin/Doctors";
import { DoctorDashboard } from "./pages/Doctor/DoctorDashboard";
import { AdminSpecialization } from "./pages/Admin/AdminSpecialization";
import { AdminAppointments } from "./pages/Admin/AdminAppointments";
import { DoctorAppointmentSummary } from "./pages/Admin/DoctorAppointmentSummary";
import { AdminPatients } from "./pages/Admin/AdminPatients";
import { DoctorAppointments } from "./pages/Doctor/DoctorAppointments";
import { ProtectedRoute } from "./pages/Auth/ProtectedRoute";
import { DoctorProfile } from "./pages/Doctor/DoctorProfile";
import { DoctorSchedule } from "./pages/Doctor/DoctorSchedule";
import { DoctorPatients } from "./pages/Doctor/DoctorPatients";


function App() {
  return (
    <div>
      <Navbar />
      {/**Patient dashboard routes */}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        <Route path="/doctors" element={<DoctorListing />} />
        <Route path="/doctors/speciality/:speciality" element={<DoctorListing />} />
        <Route path="/doctor-details/:id" element={<DoctorDetails />} />
        <Route path="/doctors/doctor-details/book-appointment/:doctorId" element={<BookAppointment />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
        <Route path="/my-profile" element={<MyProfile />} />
        </Route>
       {/**Admin dashboard routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/add-doctor" element={<AddDoctor />} />
          <Route path="/admin/doctors" element={<Doctors />} />
          <Route path="/admin/update-doctor/:id" element={<AddDoctor />} />
          <Route path="/admin/specializations" element={<AdminSpecialization />} />
          <Route path="/admin/appointments" element={<AdminAppointments />} />
          <Route path="/admin/appointments/doctor-summary" element={<DoctorAppointmentSummary />} />
          <Route path="/admin/patients" element={<AdminPatients />} />
        </Route>
        {/**Doctor dashboard routes */}
        <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/my-profile" element={<DoctorProfile/>}/>
          <Route path="/doctor/schedule" element={<DoctorSchedule />} />
          <Route path="/doctor/patients" element={<DoctorPatients/>}/>
        </Route>
      </Routes>

      <Footer />
    </div>
  );
}

export default App;