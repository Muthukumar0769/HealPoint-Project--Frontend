# HealPoint

## Overview

HealPoint is a modern healthcare appointment and consultation frontend built with React, TypeScript, Redux Toolkit, and Vite. It supports three user roles—Patient, Doctor, and Admin—and provides interfaces for browsing doctors, booking appointments, tracking payments, managing schedules, and running video consultations.

This repository contains the frontend application only. A backend API is required to power authentication, appointment management, doctor data, patient records, and reports.

---

## Features

### Patient
- Secure login and registration
- Browse doctors by specialty
- Search and filter doctors
- View detailed doctor profiles
- Book appointments online
- View appointment history and transaction details
- Join video consultations

### Doctor
- Personalized doctor dashboard
- Manage appointments and patient details
- Update availability schedule
- Monitor earnings and revenue
- Run video consultation sessions
- Edit doctor profile

### Admin
- Manage doctors and patients
- Add or update doctor details
- Control medical specializations
- Monitor appointment workflows
- Generate reports and earnings analytics
- View platform performance metrics

### Platform
- Role-based routing and authorization
- JWT token handling with automatic refresh
- Lazy-loaded routes for performance
- Global notifications with react-hot-toast
- Responsive UI powered by Tailwind CSS

---

## Tech Stack

- React 19
- TypeScript 6
- Vite 8
- Redux Toolkit
- React Router DOM 7
- Axios 1
- Tailwind CSS 4
- Framer Motion
- React Hot Toast
- React Icons
- date-fns 4
- Recharts 3
- react-datepicker 9
- jsPDF 4
- ESLint 10

---

## Project Structure

```
healpoint/
├── public/                      # Static assets and favicons served at runtime
├── src/
│   ├── api/                     # Network layer and Axios instances
│   │   └── axios.ts             # Main HTTP client, auth interceptors, and token refresh flow
│   ├── assets/                  # Static image files used by UI
│   │   └── images/              # Doctor icons, illustrations, banners
│   ├── components/              # Shared reusable UI components
│   │   ├── Header/              # Hero banner, site header, footer, featured doctors, specialties
│   │   ├── Navbar/              # Top navigation, login/logout, role menu
│   │   ├── SelectBox.tsx        # Customized dropdown select component
│   │   └── TimeInput.tsx        # Time picker input for scheduling
│   ├── hooks/                   # Custom React hooks
│   │   └── usePageTitle.ts      # Set document title per page
│   ├── pages/                   # Route-based page components
│   │   ├── Admin/               # Admin dashboard, doctors, patients, reports, specialties
│   │   ├── Auth/                # Authentication pages and protected route logic
│   │   ├── Doctor/              # Doctor dashboard, schedule, earnings, video consultation
│   │   └── Patient/             # Patient home, doctor listing, booking, profile, appointments
│   ├── store/                   # Redux store and application state
│   │   ├── slices/              # Domain-specific Redux slices
│   │   └── hooks.ts             # Typed `useAppDispatch` and `useAppSelector`
│   ├── types/                   # TypeScript interfaces and shared types
│   ├── utils/                   # Utility helpers and small components
│   │   ├── AvailabilityBadge.tsx # Displays slot availability status
│   │   └── slotHelpers.ts       # Appointment slot formatting and selection helpers
│   ├── App.tsx                  # Defines routing, layout, and lazy loading
│   ├── main.tsx                 # App entry point, provider setup, and router
│   ├── index.css                # Global style resets and theme styles
│   └── App.css                  # App-specific styles
├── eslint.config.js             # ESLint configuration for linting rules
├── package.json                 # Project scripts and dependencies
├── tsconfig.json                # TypeScript base configuration
├── tsconfig.app.json            # Vite app TypeScript configuration
├── tsconfig.node.json           # Node tooling TypeScript config
├── vite.config.ts               # Vite build and plugin configuration
├── vercel.json                  # Vercel SPA rewrite configuration
├── index.html                   # HTML template for Vite build
└── README.md                    # Project documentation
```

---

## File Summary

- `src/api/axios.ts` — Configures Axios, attaches auth headers, refreshes tokens, and handles failed request queuing.
- `src/main.tsx` — Initializes React app, wraps with Redux provider, router, and toast notifications.
- `src/App.tsx` — Defines public and protected routes, lazy loads page components, and renders shared layout.
- `src/pages/Auth/ProtectedRoute.tsx` — Protects pages by user role and redirects unauthorized visitors.
- `src/store/store.ts` — Combines Redux slices and creates the app store.
- `src/store/hooks.ts` — Typed hooks for dispatch and selector access.
- `src/pages/Admin/` — Admin interface for doctors, patients, appointments, reports, and specialties.
- `src/pages/Doctor/` — Doctor workflows including appointments, schedule, earnings, profile, and video consultation.
- `src/pages/Patient/` — Patient-facing pages for home, doctor discovery, booking, profile, appointments, and transactions.
- `src/components/Navbar/Navbar.tsx` — Global navigation, login/logout actions, and role-aware menu items.
- `src/components/Header/` — Shared landing page header elements, featured doctors, and specialty cards.
- `src/utils/slotHelpers.ts` — Time slot utilities used by booking and schedule pages.
- `src/types/` — Shared type definitions for users, doctors, patients, appointments, and common data.
- `vercel.json` — Ensures single-page app routing works correctly on Vercel.

---

## Dashboard Files Overview

### Admin Dashboard Pages
- `AdminDashboard.tsx` — Main admin overview with platform metrics, appointment summaries, and quick navigation.
- `AdminAppointments.tsx` — Full appointment management page for viewing, filtering, and updating appointment status.
- `AdminPatients.tsx` — Admin patient management panel for viewing and managing patient records.
- `Doctors.tsx` — Admin view of all registered doctors with edit and delete actions.
- `AddDoctor.tsx` — Admin form for adding or updating doctor profiles and specialization data.
- `AdminSpecialization.tsx` — Manage medical specialties used for doctor filtering and registration.
- `AdminReports.tsx` — Reporting dashboard for platform analytics and admin insights.
- `AdminEarningsReport.tsx` — Site-wide earnings report and financial overview for admin review.
- `AdminDoctorEarnings.tsx` — Detailed earnings breakdown for individual doctors.
- `DoctorAppointmentSummary.tsx` — Doctor-centric appointment analytics and summary view.
- `AdminSidebar.tsx` — Sidebar navigation used across admin pages.

### Doctor Dashboard Pages
- `DoctorDashboard.tsx` — Doctor home screen with appointment summaries, notifications, and performance stats.
- `DoctorAppointments.tsx` — Doctor appointment management and approval workflow.
- `DoctorSchedule.tsx` — Doctor availability scheduling interface with slot management.
- `DoctorProfile.tsx` — Doctor profile editor for updating qualifications, services, and personal details.
- `DoctorEarnings.tsx` — Doctor earnings overview page showing revenue history and payouts.
- `DoctorVideoConsultation.tsx` — Doctor video consultation interface to manage live telehealth sessions.
- `DoctorSidebar.tsx` — Sidebar navigation used across doctor pages.

### Patient Dashboard / Experience Pages
- `Home.tsx` — Landing page that introduces the platform and highlights doctors and services.
- `DoctorListing.tsx` — Doctor discovery page with search, filters, and specialization browsing.
- `DoctorDetails.tsx` — Detailed doctor profile page with booking preview and service details.
- `BookAppointment.tsx` — Appointment booking flow with date, time, and payment options.
- `MyAppointments.tsx` — Patient appointment history and appointment status management.
- `MyProfile.tsx` — Patient profile management page for personal details and settings.
- `TransactionDetails.tsx` — Payment details and transaction record page for appointments.
- `About.tsx` — Informational page about the platform.
- `Contact.tsx` — Contact form and support information page.

---

## Setup

### Prerequisites
- Node.js 22.x
- npm 10.x or newer
- Backend API server to support the application

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file at the root of the project.

Example `.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_IMAGE_BASE_URL=http://localhost:5000
```

### Run Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in the browser.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Deployment

This project includes a Vercel configuration file (`vercel.json`) to support SPA routing.

For deployment on Vercel:
1. Connect the repository in Vercel.
2. Set the project root to the repository root.
3. Add the following environment variables in Vercel:
   - `VITE_API_URL`
   - `VITE_IMAGE_BASE_URL`
4. Build command: `npm run build`
5. Output directory: `dist`

The `vercel.json` file rewrites all routes to `index.html`, enabling client-side routing for React Router.

### Linting

```bash
npm run lint
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base URL for backend API requests | `http://localhost:5000/api` |
| `VITE_IMAGE_BASE_URL` | Base URL for image resources | `http://localhost:5000` |

---

## Application Architecture

- `src/main.tsx` bootstraps React with `BrowserRouter`, Redux store provider and `react-hot-toast`.
- `src/App.tsx` sets up all routes, public and protected, and lazy-loads many page components.
- `src/api/axios.ts` configures Axios with authentication headers, refresh token handling, and queueing for concurrent requests.
- `src/pages/Auth/ProtectedRoute.tsx` protects routes based on roles stored in localStorage.
- `src/store/` contains Redux slices and store configuration for patient, doctor, admin, and notifications.
- `src/types/` defines common data structures used across the app.
- `src/utils/` contains helper utilities such as appointment slot transformations.

---

## Authentication & Authorization

The frontend uses localStorage to store:
- `accessToken`
- `user`

`src/pages/Auth/ProtectedRoute.tsx` allows only authorized roles to access protected routes. Unauthorized access automatically redirects users to login or their dashboard.

`src/api/axios.ts` attaches a bearer token to outbound requests and handles 401 responses by refreshing the token via `/auth/refresh`. If refresh fails, the user is logged out and redirected to `/login`.

---

## Routes

### Public Routes
- `/` – Home
- `/login` – Login page
- `/register` – Register page
- `/forgot-password` – Forgot password
- `/reset-password` – Reset password page
- `/doctors` – Doctor listing
- `/doctors/speciality/:speciality` – Filter doctor list by specialty
- `/doctor-details/:id` – Doctor profile details
- `/doctors/doctor-details/book-appointment/:doctorId` – Book appointment
- `/about` – About page
- `/contact` – Contact page

### Patient Routes (Protected)
- `/my-profile` – Patient profile
- `/my-appointments` – Appointment list
- `/transactions/:appointmentId` – Transaction and payment details

### Doctor Routes (Protected)
- `/doctor/dashboard` – Doctor dashboard
- `/doctor/appointments` – Appointment management
- `/doctor/my-profile` – Doctor profile
- `/doctor/schedule` – Schedule management
- `/doctor/consultations` – Video consultations
- `/doctor/earnings` – Earnings overview

### Admin Routes (Protected)
- `/admin/dashboard` – Admin dashboard
- `/admin/add-doctor` – Add doctor
- `/admin/doctors` – Doctor management
- `/admin/update-doctor/:id` – Update doctor details
- `/admin/specializations` – Manage medical specialties
- `/admin/appointments` – All appointments
- `/admin/appointments/doctor-summary` – Doctor appointment summary
- `/admin/patients` – Patient management
- `/admin/reports` – Admin reports
- `/admin/earnings` – Earnings report
- `/admin/earnings/doctors` – Doctor earnings details

---

## Key Files

- `src/App.tsx` – Route definitions, shared layout, role redirects
- `src/api/axios.ts` – HTTP client and auth handling
- `src/main.tsx` – App bootstrapping
- `src/pages/Auth/ProtectedRoute.tsx` – Role-based route protection
- `src/store/store.ts` – Redux store setup
- `src/store/slices/` – Application state slices
- `src/components/Navbar/Navbar.tsx` – Navigation and logout flows

---

## Notes

- This repository is frontend-only. The backend service is required for full app functionality.
- The axios client uses `withCredentials: true` and expects refresh endpoints at `/auth/refresh`.
- Routes are protected by role; a valid `accessToken` and `user` object must exist in localStorage.
- The app uses lazy loading for many pages to reduce initial bundle size.

---

## Contribution

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Install dependencies: `npm install`
4. Make your changes
5. Commit: `git commit -m "Add <feature>"
6. Push: `git push origin feature/your-feature`

---

## License

This README may be adapted for your own project documentation.
