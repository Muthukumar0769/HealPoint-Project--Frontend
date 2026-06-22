🏥 HealPoint – Smart Healthcare Appointment & Consultation Platform

📖 Overview
----------------
HealPoint is a modern full-stack healthcare management platform designed to simplify the interaction between patients, doctors, and administrators. The system provides a seamless experience for booking appointments, managing schedules, conducting video consultations, tracking payments, and monitoring healthcare operations through dedicated dashboards.
Built with a scalable architecture and role-based access control, HealPoint offers separate interfaces for Patients, Doctors, and Administrators, ensuring secure and efficient healthcare management.

🎯 Project Goals
------------------------------------------
Simplify doctor appointment booking and management.
Reduce waiting time through online scheduling.
Enable secure video consultations for remote healthcare.
Provide doctors with powerful tools to manage patients and schedules.
Offer administrators complete control over doctors, patients, appointments, and reports.
Deliver a responsive and user-friendly healthcare experience across all devices.
-----
✨ Core Features
👤 Patient Portal
-------------------
Secure registration and login
Browse doctors by specialization
Advanced search and filtering
View doctor profiles and availability
Book appointments online
Track appointment status
Manage profile information
View transaction history
Join scheduled video consultations
----------
👨‍⚕️ Doctor Dashboard
-----------------
Personalized dashboard with statistics
Manage appointment requests
Accept or reject appointments
View patient information
Manage availability schedules
Track earnings and revenue
Conduct live video consultations
Update professional profile
-----------------------------------
🛠️ Admin Dashboard
---------------------------------
Manage doctors and patients
Add, update, and remove doctors
Manage medical specializations
Monitor appointments
Generate reports and analytics
Track platform performance
Manage healthcare operations efficiently
-------------------------------------
🎥 Video Consultation System
----------------------------------------
Real-time online consultations
Meeting link generation
Automatic consultation tracking
Join availability before scheduled time
Consultation status monitoring
-------------------------------------------
🔐 Security & Authentication
---------------------------------------------
JWT-based authentication
Role-based authorization
Protected routes
Secure API communication
Session management
Token refresh mechanism
---

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS 4 |
| **State Management** | Redux Toolkit + React-Redux |
| **Routing** | React Router DOM 7 |
| **HTTP Client** | Axios 1 |
| **UI/UX** | Framer Motion, React Hot Toast, React Icons |
| **Date Handling** | date-fns 4 |
| **Charts** | Recharts 3 |
| **Date Picker** | react-datepicker 9 |
| **PDF Export** | jsPDF 4 |
| **Linting** | ESLint 10 + TypeScript ESLint |

---

## 📁 Project Structure

```
healpoint/
├── public/                      # Static assets
├── src/
│   ├── api/
│   │   └── axios.ts            # HTTP client with auth interceptors & token refresh
│   ├── assets/
│   │   └── images/             # Image assets
│   ├── components/
│   │   ├── Header/             # Header components (Banner, Footer, Header, SeniorDoctors, SpecialityMenu)
│   │   ├── Navbar/             # Navigation bar
│   │   ├── SelectBox.tsx       # Reusable select component
│   │   └── TimeInput.tsx       # Time picker component
│   ├── pages/
│   │   ├── Admin/              # Admin dashboard & management pages
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminAppointments.tsx
│   │   │   ├── AdminPatients.tsx
│   │   │   ├── AdminSpecialization.tsx
│   │   │   ├── Doctors.tsx
│   │   │   ├── AddDoctor.tsx
│   │   │   ├── DoctorAppointmentSummary.tsx
│   │   │   ├── AdminReports.tsx
│   │   │   └── AdminSidebar.tsx
│   │   ├── Auth/               # Authentication pages
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── Doctor/             # Doctor dashboard & management pages
│   │   │   ├── DoctorDashboard.tsx
│   │   │   ├── DoctorAppointments.tsx
│   │   │   ├── DoctorProfile.tsx
│   │   │   ├── DoctorSchedule.tsx
│   │   │   ├── DoctorPatients.tsx
│   │   │   ├── DoctorEarnings.tsx
│   │   │   ├── DoctorVideoConsultation.tsx
│   │   │   └── DoctorSidebar.tsx
│   │   └── Patient/            # Patient pages & public pages
│   │       ├── Home.tsx
│   │       ├── DoctorListing.tsx
│   │       ├── DoctorDetails.tsx
│   │       ├── BookAppointment.tsx
│   │       ├── MyAppointments.tsx
│   │       ├── MyProfile.tsx
│   │       ├── TransactionDetails.tsx
│   │       ├── About.tsx
│   │       └── Contact.tsx
│   ├── store/                  # Redux state management
│   │   ├── store.ts            # Redux store configuration
│   │   ├── hooks.ts            # Custom Redux hooks
│   │   └── slices/             # Redux slices
│   │       ├── DoctorListingSlice.ts
│   │       ├── AdminDoctorSlice.ts
│   │       ├── AdminPatientSlice.ts
│   │       ├── AdminSpecializationSlice.ts
│   │       ├── BookAppointmentSlice.ts
│   │       ├── DoctorScheduleSlice.ts
│   │       └── DoctorAppointmentSlice.ts
│   ├── types/                  # TypeScript type definitions
│   │   ├── admin.ts            # Admin-related types
│   │   ├── doctor.ts           # Doctor-related types
│   │   ├── patient.ts          # Patient-related types
│   │   └── common.ts           # Common/shared types
│   ├── utils/                  # Utility functions and components
│   │   ├── AvailabilityBadge.tsx
│   │   └── slotHelpers.ts      # Appointment slot helper functions
│   ├── App.tsx                 # Main app component with routes
│   ├── App.css                 # Global app styles
│   ├── main.tsx                # React DOM entry point
│   └── index.css               # Global styles
├── eslint.config.js            # ESLint configuration
├── vite.config.ts              # Vite build configuration
├── tsconfig.json               # TypeScript configuration
├── tsconfig.app.json           # App-specific TypeScript config
├── tsconfig.node.json          # Node-specific TypeScript config
├── package.json                # Project dependencies and scripts
├── index.html                  # HTML entry point
└── README.md                   # This file

3. **Configure environment variables:**
   - Edit the API baseURL in `src/api/axios.ts` to match your backend server
   - Default configured for: `https://retinal-lark-phony.ngrok-free.dev/api`

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173/`

---

## 📜 Available Scripts


## 🔐 Authentication & Authorization

### Authentication Flow

1. **Login/Register**: Users authenticate via `/auth/login` or `/auth/register`
2. **Token Storage**: Upon success, `accessToken` and `user` data stored in `localStorage`
3. **Request Interceptor**: Axios automatically attaches `Authorization: Bearer <token>` header
4. **Token Refresh**: 401 responses trigger automatic token refresh via `/auth/refresh`
5. **Protected Routes**: `ProtectedRoute` component validates roles before access

### User Roles

| Role | Access | Dashboard |
|------|--------|-----------|
| **patient** | Patient portal, doctor search, booking | `/my-profile`, `/my-appointments` |
| **doctor** | Doctor dashboard, appointment mgmt | `/doctor/dashboard`, `/doctor/appointments` |
| **admin** | Full admin control | `/admin/dashboard`, all admin pages |

### Protected Route Implementation

```tsx
<Route element={<ProtectedRoute allowedRoles={["patient", "Patient"]} />}>
  <Route path="/my-profile" element={<MyProfile />} />
</Route>
```

---

## 🗺️ Routes & Pages

### Public Routes
- `GET /` → Home page (landing, hero, specialties, senior doctors)
- `GET /about` → About page
- `GET /contact` → Contact page
- `GET /login` → Login page
- `GET /register` → Registration page
- `GET /forgot-password` → Password recovery
- `GET /doctors` → Browse all doctors
- `GET /doctors/speciality/:speciality` → Filter doctors by specialization
- `GET /doctor-details/:id` → View doctor profile & booking info

### Patient Routes (Protected)
- `GET /my-profile` → Patient profile & settings
- `GET /my-appointments` → View booked appointments
- `GET /doctors/doctor-details/book-appointment/:doctorId` → Book new appointment
- `GET /transactions/:appointmentId` → View payment details

### Doctor Routes (Protected)
- `GET /doctor/dashboard` → Doctor overview & stats
- `GET /doctor/appointments` → Manage appointments
- `GET /doctor/my-profile` → Edit profile
- `GET /doctor/schedule` → Manage availability slots
- `GET /doctor/patients` → List of assigned patients
- `GET /doctor/earnings` → View earnings & revenue
- `GET /doctor/video-consultation` → Video consultation interface

### Admin Routes (Protected)
- `GET /admin/dashboard` → Admin overview & statistics
- `GET /admin/doctors` → Manage doctors (view, edit, delete)
- `GET /admin/add-doctor` → Add new doctor
- `GET /admin/update-doctor/:id` → Edit doctor details
- `GET /admin/patients` → Manage patients
- `GET /admin/specializations` → Manage medical specializations
- `GET /admin/appointments` → View all appointments
- `GET /admin/appointments/doctor-summary` → Doctor appointment analytics
- `GET /admin/reports` → Generate and view reports

---

## 📊 State Management (Redux)

### Redux Store Structure

```typescript
// store.ts
{
  doctorListing: {/* Doctor search/filter state */},
  adminDoctors: {/* Admin doctor management */},
  adminPatients: {/* Admin patient management */},
  adminSpecializations: {/* Specialization data */},
  doctorSchedule: {/* Doctor availability slots */},
  bookAppointment: {/* Booking form state */},
  doctorAppointments: {/* Doctor appointments list */}
}
```

### Redux Slices

| Slice | Purpose |
|-------|---------|
| **DoctorListingSlice** | Handle doctor search, filters, and listing data |
| **AdminDoctorSlice** | Manage doctor CRUD operations for admins |
| **AdminPatientSlice** | Manage patient records for admins |
| **AdminSpecializationSlice** | Manage medical specializations |
| **BookAppointmentSlice** | Store booking form data during appointment creation |
| **DoctorScheduleSlice** | Handle doctor availability and time slots |
| **DoctorAppointmentSlice** | Manage doctor's appointments list |

### Custom Hooks

Access Redux store via custom hooks in `src/store/hooks.ts`:
```typescript
import { useAppDispatch, useAppSelector } from './store/hooks';
```

---

## 🔌 API Integration

### HTTP Client Configuration

**File**: `src/api/axios.ts`

- **Base URL**: Configured to connect to backend API
- **Request Interceptor**: Automatically adds auth token to headers
- **Response Interceptor**: Handles token refresh on 401 errors
- **Queue System**: Prevents multiple simultaneous token refresh calls

### Key API Endpoints

```
POST   /auth/login              # User login
POST   /auth/register           # User registration
POST   /auth/refresh            # Refresh access token
POST   /auth/logout             # User logout

GET    /doctors                 # List all doctors
POST   /doctors                 # Create doctor (admin)
GET    /doctors/:id             # Get doctor details
PUT    /doctors/:id             # Update doctor (admin)
DELETE /doctors/:id             # Delete doctor (admin)

GET    /appointments            # List appointments
POST   /appointments            # Create appointment
PUT    /appointments/:id        # Update appointment
GET    /appointments/:id        # Get appointment details

GET    /specializations         # List specializations
POST   /specializations         # Create specialization
PUT    /specializations/:id     # Update specialization
DELETE /specializations/:id     # Delete specialization

GET    /patients                # List patients (admin)
GET    /patients/:id            # Get patient details

GET    /reports                 # Generate reports (admin)
```

---

## 📝 Type Definitions

### Type Files

| File | Contains |
|------|----------|
| **admin.ts** | Admin-specific types (AdminDashboard, AdminStats, etc.) |
| **doctor.ts** | Doctor-related types (DoctorProfile, Schedule, Earnings) |
| **patient.ts** | Patient-related types (PatientProfile, Appointment) |
| **common.ts** | Shared types (User, Appointment, Specialization) |

---

## 🎨 Component Architecture

### Layout Components
- **Navbar**: Global navigation bar (responsive, role-aware)
- **Footer**: Footer section
- **Header**: Page header with banner
- **Sidebar**: Admin and Doctor sidebars for navigation

### Feature Components
- **SelectBox**: Dropdown select component
- **TimeInput**: Time picker for scheduling
- **AvailabilityBadge**: Display slot availability status
- **SeniorDoctors**: Featured doctors carousel
- **SpecialityMenu**: Medical specialization menu

---

## 🎯 Feature Highlights

### Patient Features
✅ Browse and search doctors by specialization, experience, gender, fees
✅ View detailed doctor profiles with services and ratings
✅ Book appointments with date/time slot selection
✅ Make payments during booking
✅ View all booked appointments with status
✅ Manage personal profile
✅ View transaction history
✅ Join Video Consultations

### Doctor Features
✅ Dashboard with today's appointments and stats
✅ Manage appointment schedule and availability
✅ View list of assigned patients
✅ Track earnings and revenue
✅ Update personal profile
✅ Conduct video consultations
✅ View patient details and history

### Admin Features
✅ Dashboard with comprehensive statistics
✅ Doctor management (add, edit, delete)
✅ Patient management and filtering
✅ Specialization management
✅ Appointment overview and filtering
✅ Doctor-wise appointment summary
✅ Revenue tracking and reports
✅ Responsive table and card views

---

## 🧪 Utility Functions

### Slot Helpers (`src/utils/slotHelpers.ts`)
- Helper functions for appointment slot management
- Availability calculations and slot formatting

### Availability Badge (`src/utils/AvailabilityBadge.tsx`)
- Component to display slot availability status
- Visual indicators for open/booked slots

---

## 📱 Responsive Design

The application is fully responsive and optimized for:
- 📱 Mobile (320px and up)
- 📱 Tablet (768px and up)
- 💻 Desktop (1024px and up)

All dashboards use adaptive layouts with:
- Sidebar → Drawer on mobile
- Tables → Card views on mobile
- Grid → Stack on smaller screens

---

## 🔒 Security Features

✅ JWT-based authentication
✅ Secure token storage
✅ Automatic token refresh
✅ Role-based access control (RBAC)
✅ Protected routes validation
✅ Request interceptor with auth header
✅ Logout clears all sensitive data
✅ CORS with credentials support

## 👥 Team

HealPoint Development Team

---

## Notes

- The frontend is structured around role-based pages and route protection.
- It expects a backend API that supports auth, doctor/patient/appointment data, department/specialization data, notifications, and logout.
- The current `Navbar` also supports notifications for patients.

## Recommended next improvements

- Next I am working the Admin Reports Page for available and unavailable doctors.
- Also working in Admin dashboard for Manage all doctors and patients reports and appointments.
