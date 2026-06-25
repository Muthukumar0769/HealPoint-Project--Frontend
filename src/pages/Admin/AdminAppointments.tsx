import { useEffect, useState, useCallback } from "react";
import { AdminSidebar } from "./AdminSidebar";
import {FaCalendarAlt,FaCheckCircle,FaClock,FaTimes,FaUserMd,FaSearch,FaChevronRight,FaSpinner,FaEye,
  FaEnvelope,FaVenusMars,FaStethoscope,FaMoneyBillWave,FaCalendarCheck} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import type { StatCardProps } from "../../types/admin.ts";
import API from "../../api/axios";
import type { DashboardOverview,DashboardInsights,AppointmentRow } from "../../types/admin.ts";
import usePageTitle from "../../hooks/usePageTitle";

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", border: "border-emerald-200" },
  pending_payment: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", border: "border-amber-200" },
  cancelled: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400", border: "border-red-200" },
  completed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400", border: "border-blue-200" },
};

const defaultStatusConfig = { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", border: "border-gray-200" };
const CONSULTATION_CONFIG: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", border: "border-emerald-200" },
  scheduled: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400", border: "border-blue-200" },
  missed: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400", border: "border-red-200" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", border: "border-amber-200" },
};

const defaultConsultConfig = { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", border: "border-gray-200" };
const PAYMENT_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  paid: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  refunded: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
};

const defaultPaymentConfig = { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" };
const AVATAR_COLORS = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-violet-700",
  "from-rose-500 to-rose-700",
  "from-cyan-500 to-cyan-700",
];

function formatStatus(status: string) {
  return status.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(timeStr: string) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

const AppointmentModal = ({ item, onClose }: { item: AppointmentRow; onClose: () => void }) => {
  const sc = STATUS_CONFIG[item.status] ?? defaultStatusConfig;
  const cc = CONSULTATION_CONFIG[(item.consultation_Status ?? "").toLowerCase()] ?? defaultConsultConfig;
  const pc = PAYMENT_CONFIG[item.payment_status] ?? defaultPaymentConfig;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-3 py-4 sm:px-4" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden sm:max-w-lg sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-4 flex items-center justify-between sm:px-6 sm:py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200 mb-0.5 sm:text-xs">
              Appointment #{item.id}
            </p>
            <h2 className="text-base font-extrabold text-white sm:text-lg">Appointment Details</h2>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30 transition sm:h-8 sm:w-8">
            <FaTimes className="text-xs sm:text-sm" />
          </button>
        </div>
        <div className="px-4 py-4 space-y-3 overflow-y-auto max-h-[70vh] sm:px-6 sm:py-5 sm:space-y-5">
          <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4">
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 sm:rounded-2xl sm:p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 sm:text-[10px] sm:mb-2">Patient</p>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs font-extrabold shadow-sm sm:h-9 sm:w-9 sm:text-sm">
                  {item.patient?.name?.charAt(0) ?? "?"}
                </div>
                <p className="font-bold text-xs text-gray-900 leading-tight sm:text-sm">{item.patient?.name ?? "—"}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-gray-500 sm:gap-1.5 sm:text-xs">
                  <FaEnvelope className="text-gray-400 shrink-0 text-[9px] sm:text-xs" />
                  <span className="truncate">{item.patient?.email ?? "—"}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-500 sm:gap-1.5 sm:text-xs">
                  <FaVenusMars className="text-gray-400 shrink-0 text-[9px] sm:text-xs" />
                  <span>{item.patient?.gender ?? "—"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 sm:rounded-2xl sm:p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 sm:text-[10px] sm:mb-2">Doctor</p>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white text-xs font-extrabold shadow-sm sm:h-9 sm:w-9 sm:text-sm">
                  <FaUserMd />
                </div>
                <p className="font-bold text-xs text-gray-900 leading-tight sm:text-sm">Dr. {item.doctor?.name ?? "—"}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-gray-500 sm:gap-1.5 sm:text-xs">
                  <FaStethoscope className="text-gray-400 shrink-0 text-[9px] sm:text-xs" />
                  <span>{item.doctor?.specialization ?? "—"}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-500 sm:gap-1.5 sm:text-xs">
                  <FaMoneyBillWave className="text-gray-400 shrink-0 text-[9px] sm:text-xs" />
                  <span>₹{item.doctor?.consultation_fee ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5 flex items-center gap-2.5 sm:rounded-2xl sm:px-4 sm:py-3 sm:gap-3">
            <FaCalendarCheck className="text-blue-500 text-base shrink-0 sm:text-lg" />
            <div>
              <p className="text-[10px] text-blue-400 font-semibold sm:text-xs">Date & Time</p>
              <p className="text-xs font-extrabold text-blue-800 sm:text-sm">
                {formatDate(item.appointment_date)} · {formatTime(item.start_time)} – {formatTime(item.end_time)}
              </p>
            </div>
          </div>
          {item.reason && (
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 sm:text-[10px]">Reason</p>
              <p className="text-xs text-gray-700 leading-snug sm:text-sm">{item.reason}</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="flex flex-col items-center rounded-xl border border-gray-200 px-2 py-2.5 gap-1 sm:rounded-2xl sm:px-3 sm:py-3 sm:gap-1.5">
              <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 text-center sm:text-[10px]">Status</p>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold sm:px-3 sm:text-xs ${sc.bg} ${sc.text} ${sc.border}`}>
                <span className={`h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5 ${sc.dot}`} />
                <span className="truncate">{formatStatus(item.status)}</span>
              </span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-gray-200 px-2 py-2.5 gap-1 sm:rounded-2xl sm:px-3 sm:py-3 sm:gap-1.5">
              <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 text-center sm:text-[10px]">Consult</p>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold sm:px-3 sm:text-xs ${cc.bg} ${cc.text} ${cc.border}`}>
                <span className={`h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5 ${cc.dot}`} />
                <span className="truncate">{formatStatus(item.consultation_Status ?? "—")}</span>
              </span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-gray-200 px-2 py-2.5 gap-1 sm:rounded-2xl sm:px-3 sm:py-3 sm:gap-1.5">
              <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 text-center sm:text-[10px]">Payment</p>
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold sm:px-3 sm:text-xs ${pc.bg} ${pc.text} ${pc.border}`}>
                {formatStatus(item.payment_status ?? "—")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminAppointments = () => {
  usePageTitle("All Appointments");
  const navigate = useNavigate();

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [tableLoading, setTableLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [patientSearch, setPatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRow | null>(null);
  const limit = 10;
  const totalPages = Math.ceil(totalCount / limit);

  useEffect(() => {
    const fetchDashboard = async () => {
      setDashboardLoading(true);
      try {
        const res = await API.get("/admin/dashboard/appointmentsOverview");
        if (res.data?.success) {
          setOverview(res.data.data.overview);
          setInsights(res.data.data.insights);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
      } finally {
        setDashboardLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const fetchAppointments = useCallback(async () => {
    setTableLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (patientSearch) params.patientName = patientSearch;
      if (doctorSearch) params.doctorName = doctorSearch;
      if (statusFilter) params.consultationStatus = statusFilter;
      const res = await API.get("/appointments", { params });
      if (res.data?.success) {
        const fetched: AppointmentRow[] = res.data.appointments ?? [];
        const filtered = patientSearch || doctorSearch
          ? fetched.filter((a) => (!patientSearch || (a.patient?.name ?? "").toLowerCase().includes(patientSearch.toLowerCase())) &&
              (!doctorSearch || (a.doctor?.name ?? "").toLowerCase().includes(doctorSearch.toLowerCase()))): fetched;
        setAppointments(filtered);
        setTotalCount(res.data.totalRecords ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    } finally {
      setTableLoading(false);
    }
  }, [page, patientSearch, doctorSearch, statusFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);
  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(timer);
  }, [patientSearch, doctorSearch, statusFilter]);

  return (
    <div className="flex min-h-screen bg-[#f0f4fb] pt-14 sm:pt-16 md:pt-20">
      <AdminSidebar />
      <main className="flex-1 min-w-0 px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5">
        <div className="mx-auto w-full max-w-xs xs:max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl">
          <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-500 mb-0.5 sm:text-xs sm:mb-1">Admin Panel</p>
              <h1 className="text-lg font-extrabold tracking-tight text-gray-900 sm:text-xl lg:text-2xl">
                Appointments <span className="text-blue-600">Overview</span>
              </h1>
              <p className="mt-0.5 text-[11px] text-gray-500 sm:text-sm">Monitor and manage all doctor appointments in real time</p>
            </div>
            <button onClick={() => navigate("/admin/appointments/doctor-summary")} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 cursor-pointer px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all duration-200 self-start sm:self-auto sm:rounded-2xl sm:px-5 sm:py-2.5 sm:text-sm sm:gap-2">
              <FaUserMd className="text-[10px] sm:text-xs" />
              <span>Doctor's Summary</span>
              <FaChevronRight className="text-[10px] sm:text-xs" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3 sm:gap-3 sm:mb-4 lg:grid-cols-4 lg:gap-3">
            <StatCard icon={<FaCalendarAlt />} title="Total Appointments" value={dashboardLoading ? "—" : String(overview?.totalAppointments ?? 0)}
              trend="" trendUp gradient="from-blue-500 to-blue-700" />
            <StatCard icon={<FaCheckCircle />} title="Today's" value={dashboardLoading ? "—" : String(overview?.todayAppointments ?? 0)}
              trend="Today" trendUp gradient="from-emerald-500 to-emerald-700" />
            <StatCard icon={<FaClock />} title="Upcoming" value={dashboardLoading ? "—" : String(overview?.upcomingAppointments ?? 0)}
              trend="Confirmed" trendUp={false} gradient="from-amber-500 to-orange-500" />
            <StatCard icon={<FaCalendarAlt />} title="Completed" value={dashboardLoading ? "—" : String(overview?.completedAppointments ?? 0)}
              trend={insights ? `${insights.completionRate}% rate` : "—"}
              trendUp gradient="from-violet-500 to-violet-700" />
          </div>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 sm:rounded-2xl">
            <div className="flex flex-col gap-2 border-b border-gray-100 px-3 py-3 bg-gray-50/60 sm:flex-row sm:gap-3 sm:px-5 sm:py-3">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] sm:text-xs" />
                <input type="text" placeholder="Search patient…" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition sm:pl-9 sm:text-sm"/>
              </div>
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] sm:text-xs" />
                <input type="text" placeholder="Search doctor…" value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition sm:pl-9 sm:text-sm"/>
              </div>
              <div className="flex-1">
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="w-full rounded-xl cursor-pointer border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition sm:text-sm">
                  <option value="">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending_payment">Pending</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="block lg:hidden">
              {tableLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10">
                  <FaSpinner className="animate-spin text-blue-500 text-xl" />
                  <p className="text-xs text-gray-400">Loading appointments…</p>
                </div>
              ) : appointments.length === 0 ? (
                <p className="py-10 text-center text-xs text-gray-400">No appointments found.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {appointments.map((item, index) => {
                    const sc = STATUS_CONFIG[item.status] ?? defaultStatusConfig;
                    const cc = CONSULTATION_CONFIG[(item.consultation_Status ?? "").toLowerCase()] ?? defaultConsultConfig;
                    const paymentStatus = item.payment_status ?? "";
                    const pc = PAYMENT_CONFIG[paymentStatus] ?? defaultPaymentConfig;
                    const avatarGrad = AVATAR_COLORS[index % AVATAR_COLORS.length];

                    return (
                      <div key={item.id} className="p-3 hover:bg-blue-50/30 transition-colors sm:p-4">
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGrad} text-[10px] font-extrabold text-white shadow-sm`}>
                              {item.patient?.name?.charAt(0) ?? "?"}
                            </div>
                            <div>
                              <p className="font-bold text-xs text-gray-900">{item.patient?.name ?? "—"}</p>
                              <p className="text-[10px] text-gray-400">{item.patient?.email ?? ""}</p>
                            </div>
                          </div>
                          <button onClick={() => setSelectedAppointment(item)} className="flex items-center cursor-pointer justify-center h-7 w-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shrink-0">
                            <FaEye className="text-[10px]" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Doctor</p>
                            <p className="text-[11px] font-bold text-gray-800">{item.doctor?.name ? `Dr. ${item.doctor.name}` : "—"}</p>
                            <p className="text-[10px] text-blue-500">{item.doctor?.specialization ?? ""}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Date & Time</p>
                            <p className="text-[11px] font-bold text-gray-800">{formatDate(item.appointment_date)}</p>
                            <p className="text-[10px] text-gray-400">{formatTime(item.start_time)}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${sc.bg} ${sc.text} ${sc.border}`}>
                            <span className={`h-1 w-1 rounded-full ${sc.dot}`} />{formatStatus(item.status)}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${cc.bg} ${cc.text} ${cc.border}`}>
                            <span className={`h-1 w-1 rounded-full ${cc.dot}`} />{formatStatus(item.consultation_Status ?? "—")}
                          </span>
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold ${pc.bg} ${pc.text} ${pc.border}`}>
                            {paymentStatus ? formatStatus(paymentStatus) : "—"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="hidden lg:block">
              <div key={tableLoading ? "loading" : "loaded"} className="overflow-auto max-h-[430px] slide-in-right">
                <table className="min-w-[1000px] w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 sticky top-0 z-10 xl:text-[11px]">
                      {["#", "Patient", "Doctor", "Date & Time", "Reason", "Status", "Consultation", "Payment", "Actions"].map(
                        (h) => <th key={h} className="px-3 py-3">{h}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {tableLoading ? (
                      <tr>
                        <td colSpan={9} className="px-5 py-10 text-center">
                          <FaSpinner className="animate-spin inline text-blue-500 text-xl" />
                          <p className="mt-2 text-sm text-gray-400">Loading appointments…</p>
                        </td>
                      </tr>
                    ) : appointments.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-5 py-10 text-center text-sm text-gray-400">No appointments found.</td>
                      </tr>
                    ) : (
                      appointments.map((item, index) => {
                        const sc = STATUS_CONFIG[item.status] ?? defaultStatusConfig;
                        const cc = CONSULTATION_CONFIG[(item.consultation_Status ?? "").toLowerCase()] ?? defaultConsultConfig;
                        const paymentStatus = item.payment_status ?? "";
                        const pc = PAYMENT_CONFIG[paymentStatus] ?? defaultPaymentConfig;
                        const avatarGrad = AVATAR_COLORS[index % AVATAR_COLORS.length];

                        return (
                          <tr key={item.id} className="group border-t border-gray-100 hover:bg-blue-50/30 transition-colors duration-150">
                            <td className="px-3 py-3">
                              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                {(page - 1) * limit + index + 1}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGrad} text-xs font-extrabold text-white shadow-sm xl:h-8 xl:w-8`}>
                                  {item.patient?.name?.charAt(0) ?? "?"}
                                </div>
                                <div>
                                  <p className="font-bold text-xs text-gray-900 leading-tight">{item.patient?.name ?? "—"}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5 max-w-[100px] truncate xl:max-w-[140px]">{item.patient?.email ?? ""}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <p className="font-bold text-xs text-gray-900 leading-tight">
                                {item.doctor?.name ? `Dr. ${item.doctor.name}` : "—"}
                              </p>
                              <p className="text-[10px] text-blue-500 font-medium mt-0.5">{item.doctor?.specialization ?? ""}</p>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <p className="font-bold text-xs text-gray-900 leading-tight">{formatDate(item.appointment_date)}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(item.start_time)}</p>
                            </td>
                            <td className="px-3 py-3 max-w-[120px] xl:max-w-[140px]">
                              <p className="text-xs text-gray-600 line-clamp-2 leading-snug">{item.reason || "—"}</p>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${sc.bg} ${sc.text} ${sc.border}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                                {formatStatus(item.status)}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${cc.bg} ${cc.text} ${cc.border}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${cc.dot}`} />
                                {formatStatus(item.consultation_Status ?? "—")}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${pc.bg} ${pc.text} ${pc.border}`}>
                                {paymentStatus ? formatStatus(paymentStatus) : "—"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <button onClick={() => setSelectedAppointment(item)} className="flex items-center cursor-pointer justify-center h-7 w-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200 shadow-sm" title="View details">
                                <FaEye className="text-xs" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-[11px] text-gray-500 sm:text-sm">
                Showing{" "}
                <span className="font-semibold text-gray-800">
                  {appointments.length === 0 ? 0 : (page - 1) * limit + 1}–{(page - 1) * limit + appointments.length}
                </span>{" "}
                of <span className="font-semibold text-gray-800">{totalCount}</span> results
              </p>
              <div className="flex gap-1 sm:gap-1.5">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="h-7 w-7 cursor-pointer rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed sm:h-8 sm:w-8 sm:rounded-xl sm:text-sm">
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button key={pageNum} onClick={() => setPage(pageNum)} className={`h-7 w-7 cursor-pointer rounded-lg text-xs font-bold transition sm:h-8 sm:w-8 sm:rounded-xl sm:text-sm ${
                        page === pageNum ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"}`}>
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
                  className="h-7 w-7 cursor-pointer rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed sm:h-8 sm:w-8 sm:rounded-xl sm:text-sm">
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {selectedAppointment && (
        <AppointmentModal item={selectedAppointment} onClose={() => setSelectedAppointment(null)} />
      )}
    </div>
  );
};

const StatCard = ({ icon, title, value, trend, trendUp, gradient }: StatCardProps) => (
  <div className="group relative overflow-hidden rounded-xl bg-white p-3 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all duration-200 sm:rounded-2xl sm:p-4">
    <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity sm:h-20 sm:w-20`} />
    <div className="flex items-start justify-between">
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-sm text-white shadow-sm sm:h-9 sm:w-9 sm:text-base`}>
        {icon}
      </div>
      {trend && (
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold sm:px-2.5 sm:text-[11px] ${trendUp ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
          {trend}
        </span>
      )}
    </div>
    <div className="mt-2 sm:mt-3">
      <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide sm:text-xs">{title}</p>
      <h2 className="mt-0.5 text-lg font-extrabold tracking-tight text-gray-900 sm:mt-1 sm:text-xl">{value}</h2>
    </div>
  </div>
);