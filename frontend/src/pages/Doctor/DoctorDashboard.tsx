import { DoctorSidebar } from './DoctorSidebar';
import {FaCalendarCheck,FaStar,FaUsers,FaRupeeSign,FaCheck,FaTimes,} from "react-icons/fa";

export const DoctorDashboard = () => {
  const stats = [
    { title: "Today's Appointments", value: 50, icon: <FaCalendarCheck /> },
    { title: "Total Patients", value: 100, icon: <FaUsers /> },
    { title: "Average Rating", value: 4.5, icon: <FaStar /> },
    { title: "Total Earnings", value: "₹5,000", icon: <FaRupeeSign /> },
  ];

  const todayAppointments = [
    { time: "10.00AM", patient: "John Doe", type: "Video Consultation" },
    { time: "02.00PM", patient: "Sudhakar", type: "Video Consultation" },
    { time: "04.00PM", patient: "Vinoji", type: "Video Consultation" },
  ];

  const appointmentRequests = [
    { patient: "Suresh", date: "10 May 2026", time: "10.00AM" },
    { patient: "Vijay", date: "14 May 2026", time: "02.00PM" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 lg:flex pt-20">
      <DoctorSidebar />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:p-8">
        <section className="rounded-3xl bg-white p-5 shadow-lg sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-blue-800">Welcome back,</p>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Dr. John Doe
              </h1>
            </div>

            <input
              type="month"
              defaultValue="2026-05"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none sm:w-56"
            />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item, index) => (
              <div
                key={index}
                className="rounded-3xl border border-gray-200 bg-gray-50 p-6 shadow-sm"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                  {item.icon}
                </div>
                <h2 className="text-3xl font-bold text-blue-600">
                  {item.value}
                </h2>
                <p className="mt-2 text-sm font-medium text-gray-600">
                  {item.title}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-gray-900">
              Today's Appointments
            </h2>

            <div className="mt-5 space-y-4">
              {todayAppointments.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-500">
                      {item.time}
                    </p>
                    <h3 className="mt-1 font-bold text-gray-900">
                      {item.patient}
                    </h3>
                    <p className="text-sm text-gray-500">{item.type}</p>
                  </div>

                  <button className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                Appointment Requests
              </h2>
              <button className="text-sm font-semibold text-blue-500">
                View all
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {appointmentRequests.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-bold text-gray-900">{item.patient}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.date} - {item.time}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="rounded-xl bg-green-100 px-4 py-3 text-green-600">
                      <FaCheck />
                    </button>
                    <button className="rounded-xl bg-red-100 px-4 py-3 text-red-600">
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};