import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { Navbar } from "./components/Navbar/Navbar";
import { Footer } from "./components/Header/Footer";
import { ProtectedRoute } from "./pages/Auth/ProtectedRoute";

// Eager Loading (only truly public + frequently visited first pages)
import { Home } from "./pages/Patient/Home";
import { Login } from "./pages/Auth/Login";
import { Register } from "./pages/Auth/Register";
import { ForgotPassword } from "./pages/Auth/ForgotPassword";

// Lazy Loading — Patient public pages
const DoctorListing = lazy(() => import("./pages/Patient/DoctorListing").then(m => ({ default: m.DoctorListing })));
const DoctorDetails = lazy(() => import("./pages/Patient/DoctorDetails").then(m => ({ default: m.DoctorDetails })));
const BookAppointment = lazy(() => import("./pages/Patient/BookAppointment").then(m => ({ default: m.BookAppointment })));
const About = lazy(() => import("./pages/Patient/About").then(m => ({ default: m.About })));
const Contact = lazy(() => import("./pages/Patient/Contact").then(m => ({ default: m.Contact })));

// Lazy Loading — Patient protected pages
const MyProfile = lazy(() => import("./pages/Patient/MyProfile").then(m => ({ default: m.MyProfile })));
const TransactionDetails = lazy(() => import("./pages/Patient/TransactionDetails").then(m => ({ default: m.TransactionDetails })));
const MyAppointments = lazy(() => import("./pages/Patient/MyAppointments").then(m => ({ default: m.MyAppointments })));

// Lazy Loading — Admin pages
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const AddDoctor = lazy(() => import("./pages/Admin/AddDoctor").then(m => ({ default: m.AddDoctor })));
const Doctors = lazy(() => import("./pages/Admin/Doctors").then(m => ({ default: m.Doctors })));
const AdminSpecialization = lazy(() => import("./pages/Admin/AdminSpecialization").then(m => ({ default: m.AdminSpecialization })));
const AdminAppointments = lazy(() => import("./pages/Admin/AdminAppointments").then(m => ({ default: m.AdminAppointments })));
const DoctorAppointmentSummary = lazy(() => import("./pages/Admin/DoctorAppointmentSummary").then(m => ({ default: m.DoctorAppointmentSummary })));
const AdminPatients = lazy(() => import("./pages/Admin/AdminPatients").then(m => ({ default: m.AdminPatients })));
const AdminReports = lazy(() => import("./pages/Admin/AdminReports"));
const AdminEarningsReport = lazy(() => import("./pages/Admin/AdminEarningsReport").then(m => ({ default: m.AdminEarningsReport })));
const AdminDoctorEarnings = lazy(() => import("./pages/Admin/AdminDoctorEarnings")); // ✅ was eagerly loaded before

// Lazy Loading — Doctor pages
const DoctorDashboard = lazy(() => import("./pages/Doctor/DoctorDashboard").then(m => ({ default: m.DoctorDashboard })));
const DoctorAppointments = lazy(() => import("./pages/Doctor/DoctorAppointments").then(m => ({ default: m.DoctorAppointments })));
const DoctorProfile = lazy(() => import("./pages/Doctor/DoctorProfile").then(m => ({ default: m.DoctorProfile })));
const DoctorSchedule = lazy(() => import("./pages/Doctor/DoctorSchedule").then(m => ({ default: m.DoctorSchedule })));
const DoctorVideoConsultation = lazy(() => import("./pages/Doctor/DoctorVideoConsultation").then(m => ({ default: m.DoctorVideoConsultation })));
const DoctorEarnings = lazy(() => import("./pages/Doctor/DoctorEarnings").then(m => ({ default: m.DoctorEarnings })));

// Role-based redirect helper
const RoleRedirect = () => {
  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("accessToken");
  if (storedUser && token) {
    try {
      const user = JSON.parse(storedUser);
      if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
      if (user.role === "doctor") return <Navigate to="/doctor/dashboard" replace />;
    } catch {
      // invalid JSON in localStorage, fall through to Home
    }
  }
  return <Home />;
};

function App() {
  return (
    <div>
      <Navbar />
      <Suspense fallback={
        <div style={{ padding: "2rem", textAlign: "center", minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          Loading...
        </div>
      }>
        <Routes>
          {/* Public */}
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ForgotPassword />} />
          <Route path="/doctors" element={<DoctorListing />} />
          <Route path="/doctors/speciality/:speciality" element={<DoctorListing />} />
          <Route path="/doctor-details/:id" element={<DoctorDetails />} />
          <Route path="/doctors/doctor-details/book-appointment/:doctorId" element={<BookAppointment />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Patient protected */}
          <Route element={<ProtectedRoute allowedRoles={["patient", "Patient"]} />}>
            <Route path="/my-profile" element={<MyProfile />} />
            <Route path="/my-appointments" element={<MyAppointments />} />
            <Route path="/transactions/:appointmentId" element={<TransactionDetails />} />
          </Route>

          {/* Admin protected */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/add-doctor" element={<AddDoctor />} />
            <Route path="/admin/doctors" element={<Doctors />} />
            <Route path="/admin/update-doctor/:id" element={<AddDoctor />} />
            <Route path="/admin/specializations" element={<AdminSpecialization />} />
            <Route path="/admin/appointments" element={<AdminAppointments />} />
            <Route path="/admin/appointments/doctor-summary" element={<DoctorAppointmentSummary />} />
            <Route path="/admin/patients" element={<AdminPatients />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/earnings" element={<AdminEarningsReport />} />
            <Route path="/admin/earnings/doctors" element={<AdminDoctorEarnings />} />
          </Route>

          {/* Doctor protected */}
          <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/appointments" element={<DoctorAppointments />} />
            <Route path="/doctor/my-profile" element={<DoctorProfile />} />
            <Route path="/doctor/schedule" element={<DoctorSchedule />} />
            <Route path="/doctor/consultations" element={<DoctorVideoConsultation />} />
            <Route path="/doctor/earnings" element={<DoctorEarnings />} />
          </Route>
        </Routes>
      </Suspense>
      <Footer />
    </div>
  );
}

export default App;