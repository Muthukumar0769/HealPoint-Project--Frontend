import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { FaArrowLeft, FaUserMd, FaSpinner, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import API from "../../api/axios";
import type { DoctorSummaryDashboardData } from "../../types/admin";
import usePageTitle from "../../hooks/usePageTitle";

const specializationColors: Record<string, { bg: string; text: string; dot: string }> = {
  Cardiologist: { bg: "bg-rose-50", text: "text-rose-600", dot: "bg-rose-400" },
  Dermatologist: { bg: "bg-violet-50", text: "text-violet-600", dot: "bg-violet-400" },
  Neurologist: { bg: "bg-cyan-50", text: "text-cyan-600", dot: "bg-cyan-400" },
  Dentist: { bg: "bg-teal-50", text: "text-teal-600", dot: "bg-teal-400" },
  Orthopedic: { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-400" },
  Pediatrician: { bg: "bg-pink-50", text: "text-pink-600", dot: "bg-pink-400" },
  ENT: { bg: "bg-indigo-50",  text: "text-indigo-600", dot: "bg-indigo-400" },
  Gynecologist: { bg: "bg-fuchsia-50", text: "text-fuchsia-600", dot: "bg-fuchsia-400" },
  "General Physician": { bg: "bg-green-50", text: "text-green-600", dot: "bg-green-400" },
  Psychiatrist: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-400" },
  Urologist: { bg: "bg-sky-50", text: "text-sky-600", dot: "bg-sky-400" },
  Ophthalmologist: { bg: "bg-lime-50", text: "text-lime-600", dot: "bg-lime-400" },
  Pulmonologist: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-400" },
  Oncologist: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
  Nephrologist: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-400" },
};

const defaultSpec = { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-400" };
function getSpecColor(spec: string) {
  return specializationColors[spec] ?? defaultSpec;
}

const AVATAR_GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-violet-700",
  "from-cyan-500 to-cyan-600",
  "from-rose-500 to-rose-700",
  "from-emerald-500 to-emerald-700",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-pink-700",
  "from-indigo-500 to-indigo-700",
];

function StatBadge({ value, label, colorClass, bgClass }: {
  value: number; label: string; colorClass: string; bgClass: string;
}) {
  return (
    <div className={`flex flex-col items-center rounded-xl px-4 py-2 ${bgClass}`}>
      <span className={`text-lg font-extrabold leading-tight ${colorClass}`}>{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
    </div>
  );
}

export const DoctorAppointmentSummary = () => {
  usePageTitle("Appointment Summary");
  const navigate = useNavigate();
  const [data, setData] = useState<DoctorSummaryDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 5;

  const fetchData = async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get("/admin/dashboard/appointmentsOverview", { params: { page: pageNum, limit } });
      if (res.data?.success) {
        setData({
          doctorSummary: res.data.data.doctorSummary,
          insights: res.data.data.insights,
        });
      } else {
        setError("Failed to load data.");
      }
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(page); }, [page]);
  const rows = data?.doctorSummary.rows ?? [];
  const totalPages = data?.doctorSummary.totalPages ?? 1;
  const totalRecords = data?.doctorSummary.totalRecords ?? 0;
  const currentPage = data?.doctorSummary.currentPage ?? 1;
  const allStats = data?.insights.doctorStats ?? [];
  const grandTotal = allStats.reduce((sum, d) => sum + d.total, 0);
  const completionRate = data?.insights.completionRate ?? "0";
  const pageTotals = rows.reduce(
    (acc, d) => ({
      completed: acc.completed + d.completed,
      missed: acc.missed + d.missed,
      cancelled: acc.cancelled + d.cancelled,
    }),
    { completed: 0, missed: 0, cancelled: 0 }
  );

  return (
    <div className="flex min-h-screen bg-[#f0f4fb] pt-20">
      <AdminSidebar />
      <main className="flex-1 px-8 py-8 max-w-7xl">
        <button onClick={() => navigate("/admin/appointments")} className="mb-5 inline-flex items-center gap-2 text-sm cursor-pointer font-semibold text-blue-600 hover:text-blue-800 transition-colors">
          <FaArrowLeft className="text-xs" /> Back To Appointments
        </button>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Doctor's Appointments <span className="text-blue-600">Summary</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Total appointment breakdown across all physicians
            </p>
          </div>
          {!loading && (
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm border border-gray-100">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="text-xs font-semibold text-gray-500">Total</span>
                <span className="text-sm font-extrabold text-gray-800">{grandTotal}</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm border border-gray-100">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-gray-500">Completed</span>
                <span className="text-sm font-extrabold text-emerald-700">{pageTotals.completed}</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm border border-gray-100">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="text-xs font-semibold text-gray-500">Missed</span>
                <span className="text-sm font-extrabold text-yellow-600">{pageTotals.missed}</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm border border-gray-100">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="text-xs font-semibold text-gray-500">Cancelled</span>
                <span className="text-sm font-extrabold text-red-600">{pageTotals.cancelled}</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-2.5 shadow-sm">
                <span className="text-xs font-semibold text-blue-100">Completion Rate</span>
                <span className="text-sm font-extrabold text-white">{completionRate}%</span>
              </div>
            </div>
          )}
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <FaSpinner className="animate-spin text-blue-500 text-3xl" />
            <p className="text-sm text-gray-400">Loading doctor summaries…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-6 py-8 text-center">
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <button onClick={() => fetchData(page)} className="mt-4 text-sm text-blue-600 hover:underline">
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 slide-in-right">
              {rows.map((doctor, index) => {
                const spec = getSpecColor(doctor.specialization);
                const avatarGrad = AVATAR_GRADIENTS[((currentPage - 1) * limit + index) % AVATAR_GRADIENTS.length];
                const hasAppointments = doctor.total > 0;

                return (
                  <div key={doctor.doctor_id} className={`group flex flex-wrap items-center gap-6 rounded-2xl bg-white px-6 py-5 shadow-sm border transition-all duration-200 ${
                      hasAppointments ? "border-gray-100 hover:shadow-md hover:border-blue-100"
                        : "border-gray-100 opacity-60"}`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-sm font-extrabold text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                      {(currentPage - 1) * limit + index + 1}
                    </div>
                    <div className="flex min-w-[200px] flex-1 items-center gap-3">
                      <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${avatarGrad} text-white shadow-md`}>
                        <FaUserMd className="text-lg" />
                        {hasAppointments && (
                          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-white text-[8px] font-bold text-white">
                            ✓
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">{doctor.doctor_name}</p>
                        <div className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 ${spec.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${spec.dot}`} />
                          <span className={`text-[11px] font-semibold ${spec.text}`}>{doctor.specialization}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-gray-800">{doctor.total}</span>
                      <span className="text-xs font-medium text-gray-400">appointments</span>
                    </div>
                    <div className="ml-auto flex flex-wrap gap-3">
                      <StatBadge value={doctor.missed} label="Missed" colorClass="text-yellow-500" bgClass="bg-yellow-50" />
                      <StatBadge value={doctor.completed} label="Completed" colorClass="text-emerald-600" bgClass="bg-emerald-50" />
                      <StatBadge value={doctor.cancelled} label="Cancelled" colorClass="text-red-500"    bgClass="bg-red-50" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-800">
                  {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, totalRecords)}
                </span>{" "}
                of <span className="font-semibold text-gray-800">{totalRecords}</span> doctors
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed">
                  <FaChevronLeft className="text-xs" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button key={pageNum} onClick={() => setPage(pageNum)} className={`h-8 w-8 cursor-pointer rounded-xl text-sm font-bold transition ${
                      currentPage === pageNum ? "bg-blue-600 text-white shadow-sm"
                        : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"}`}>
                    {pageNum}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed">
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};