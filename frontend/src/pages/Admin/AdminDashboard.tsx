import { AdminSidebar } from "../Admin/AdminSidebar";

export const AdminDashboard = () => {
  const stats = [
    { title: "Total Doctors", value: "150" },
    { title: "Total Patients", value: "2,450" },
    { title: "Appointments", value: "8,320" },
    { title: "Total Revenue", value: "₹12,45,000" },
  ];

  const appointments = [
    {
      patient: "John Doe",
      doctor: "Dr. Sarah Johnson",
      date: "24 May 2024",
      type: "Video",
      payment: "₹850",
      status: "Completed",
    },
    {
      patient: "Jane Smith",
      doctor: "Dr. Michael Brown",
      date: "24 May 2024",
      type: "Clinic",
      payment: "₹700",
      status: "Completed",
    },
    {
      patient: "Robert Johnson",
      doctor: "Dr. Emily Davis",
      date: "24 May 2024",
      type: "Video",
      payment: "₹900",
      status: "Pending",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 pt-20">
      <AdminSidebar />

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Admin Dashboard
            </h2>

            <p className="mt-1 text-sm text-gray-500 sm:text-base">
              Manage doctors, patients, appointments and payments
            </p>
          </div>

          <input type="month" defaultValue="2024-05"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500 md:w-auto"/>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
          {stats.map((item, index) => (
            <div key={index} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-6">
              <h3 className="break-words text-2xl font-bold text-blue-600 sm:text-3xl">
                {item.value}
              </h3>
              <p className="mt-2 text-sm font-medium text-gray-600">
                {item.title}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:mt-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <h3 className="mb-5 text-lg font-bold text-gray-900">
              Appointments Overview
            </h3>
            <div className="relative h-52 overflow-hidden sm:h-56">
              <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-xs text-gray-400">
                <span>300</span>
                <span>200</span>
                <span>100</span>
                <span>0</span>
              </div>
              <svg viewBox="0 0 400 200" className="ml-9 h-full w-[92%] sm:ml-10 sm:w-[90%]" fill="none">
                <path d="M10 150 C50 40, 80 130, 120 90 C160 45, 180 10, 220 90 C250 150, 280 175, 320 110 C350 65, 370 70, 390 65" stroke="#2563eb" strokeWidth="5" fill="none"
                  strokeLinecap="round"/>
                <path d="M10 150 C50 40, 80 130, 120 90 C160 45, 180 10, 220 90 C250 150, 280 175, 320 110 C350 65, 370 70, 390 65 L390 200 L10 200 Z" fill="#dbeafe"
                  opacity="0.6"/>
              </svg>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <h3 className="mb-5 text-lg font-bold text-gray-900">
              Appointments by Type
            </h3>
            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-10">
              <div className="h-36 w-36 rounded-full bg-[conic-gradient(#0ea5e9_0deg_234deg,#2563eb_234deg_324deg,#f59e0b_324deg_360deg)] sm:h-44 sm:w-44" />
              <div className="space-y-4 text-sm">
                <ChartLabel color="bg-sky-500" label="Video Consultation" value="65%" />
                <ChartLabel color="bg-blue-600" label="Clinic Visit" value="25%" />
                <ChartLabel color="bg-yellow-500" label="Others" value="10%" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:mt-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-gray-900">
              Recent Appointments
            </h3>

            <button className="shrink-0 text-sm font-semibold text-blue-600">
              View All
            </button>
          </div>

          <div className="block space-y-4 md:hidden">
            {appointments.map((item, index) => (
              <div key={index} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-gray-900">{item.patient}</h4>
                    <p className="mt-1 text-sm text-gray-600">{item.doctor}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <InfoItem label="Date" value={item.date} />
                  <InfoItem label="Type" value={item.type} />
                  <InfoItem label="Payment" value={item.payment} />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-500">
                  <th className="py-3">Patient</th>
                  <th className="py-3">Doctor</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Type</th>
                  <th className="py-3">Payment</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((item, index) => (
                  <tr key={index}
   className="border-b border-gray-100 text-sm text-gray-700"
                  >
                    <td className="py-4 font-medium">{item.patient}</td>
                    <td className="py-4">{item.doctor}</td>
                    <td className="py-4">{item.date}</td>
                    <td className="py-4">{item.type}</td>
                    <td className="py-4 font-semibold">{item.payment}</td>
                    <td className="py-4">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

type ChartLabelProps = {
  color: string;
  label: string;
  value: string;
};

const ChartLabel = ({ color, label, value }: ChartLabelProps) => {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-3 w-3 shrink-0 rounded-full ${color}`} />
      <span className="text-gray-700">{label}</span>
      <b>{value}</b>
    </div>
  );
};

type StatusBadgeProps = {
  status: string;
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        status === "Completed"
          ? "bg-green-100 text-green-600"
          : "bg-orange-100 text-orange-600"
      }`}
    >
      {status}
    </span>
  );
};

type InfoItemProps = {
  label: string;
  value: string;
};

const InfoItem = ({ label, value }: InfoItemProps) => {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400">{label}</p>
      <p className="mt-1 font-semibold text-gray-700">{value}</p>
    </div>
  );
};