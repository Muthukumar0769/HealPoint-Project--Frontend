import { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "../Admin/AdminSidebar";
import type { StatusBadgeProps } from "../../types/common.ts";
import type { ChartLabelProps, InfoItemProps } from "../../types/admin.ts";
import { FaCalendarAlt, FaHospitalAlt, FaSpinner, FaVideo } from "react-icons/fa";
import { FaArrowTrendUp } from "react-icons/fa6";
import API from "../../api/axios";
import { useNavigate } from "react-router-dom";
import type { AdminDashboardData, AppointmentTrendItem } from "../../types/admin.ts";
import usePageTitle from "../../hooks/usePageTitle";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const formatCurrency = (val: number) => "₹" + val.toLocaleString("en-IN");

const formatDate = (date: string | null) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const getAvatarInitials = (name: string | null) => {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
};

const getStatusConfig = (status: string) => {
  const s = status?.toLowerCase();
  if (s === "completed") return { cls: "bg-green-100 text-green-700", label: "✓ Completed" };
  if (s === "confirmed") return { cls: "bg-blue-100 text-blue-700", label: "◷ Confirmed" };
  if (s === "cancelled" || s === "canceled") return { cls: "bg-red-100 text-red-700", label: "✕ Cancelled" };
  if (s === "pending") return { cls: "bg-amber-50 text-amber-600", label: "◷ Pending" };
  return { cls: "bg-slate-100 text-slate-600", label: status };
};

const getPaymentStatusConfig = (status: string | null) => {
  const s = status?.toLowerCase();
  if (s === "paid") return "bg-green-50 text-green-600";
  if (s === "failed") return "bg-red-50 text-red-500";
  return "bg-slate-50 text-slate-500";
};
const buildTrendPath = (trend: AppointmentTrendItem[]): { linePath: string; areaPath: string; points: [number, number][] } => {
  if (!trend || trend.length === 0) {
    return { linePath: "", areaPath: "", points: [] };
  }
  const maxVal = Math.max(...trend.map(t => t.appointments), 1);
  const padX = 10;
  const width = 380 - padX * 2;
  const height = 120;
  const topPad = 10;

  const points: [number, number][] = trend.map((t, i) => [
    padX + (trend.length === 1 ? width / 2 : (i / (trend.length - 1)) * width),
    topPad + (1 - t.appointments / maxVal) * height,
  ]);

  if (points.length === 1) {
    const [x, y] = points[0];
    return {
      linePath: `M${x} ${y}`,
      areaPath: `M${x} ${y} L${x} 140 Z`,
      points,
    };
  }

  let linePath = `M${points[0][0]} ${points[0][1]}`;
  let areaPath = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const cp1x = px + (cx - px) / 2;
    const cp2x = cx - (cx - px) / 2;
    linePath += ` C${cp1x} ${py},${cp2x} ${cy},${cx} ${cy}`;
    areaPath += ` C${cp1x} ${py},${cp2x} ${cy},${cx} ${cy}`;
  }
  areaPath += ` L${points[points.length - 1][0]} 140 L${points[0][0]} 140 Z`;
  return { linePath, areaPath, points };
};

const StatCard = ({ title, value, icon, change, }: { title: string; value: string; icon: string; change: string }) => (
  <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
    <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-2xl" />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-400 mb-2">{title}</p>
        <p className="text-xl font-bold text-slate-900 leading-none">{value}</p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
          <FaArrowTrendUp /> {change}
        </span>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-lg">{icon}</div>
    </div>
  </div>
);

const ChartLabel = ({ color, label, value }: ChartLabelProps) => (
  <div className="flex items-center gap-2">
    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
    <span className="text-xs text-slate-600">{label}</span>
    <b className="text-xs text-slate-900">{value}</b>
  </div>
);

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const { cls, label } = getStatusConfig(status);
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
};

const InfoItem = ({ label, value }: InfoItemProps) => (
  <div>
    <p className="text-xs font-semibold text-slate-400">{label}</p>
    <p className="mt-0.5 text-xs font-semibold text-slate-700">{value}</p>
  </div>
);

export const AdminDashboard = () => {
  usePageTitle("Admin Dashboard");
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const fetchDashboard = useCallback(async (year: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/admin/dashboard-overview?year=${year}`);
      setData(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(selectedYear);
  }, [selectedYear, fetchDashboard]);
  const stats = data
    ? [
      { title: "Total Doctors", value: String(data.summary.totalDoctors), icon: "🩺", change: "+12%" },
      { title: "Total Patients", value: String(data.summary.totalPatients), icon: "👥", change: "+8%" },
      { title: "Appointments", value: String(data.summary.totalAppointments), icon: "📅", change: "+5%" },
      { title: "Total Revenue", value: formatCurrency(data.summary.totalRevenue), icon: "💰", change: "+18%" },
    ]
    : [];

  const appointmentsByType = data ? (() => {
    const total = data.recentAppointments.length || 1;
    const video = data.recentAppointments.filter(a => a.consultationType?.toLowerCase().includes("video")).length;
    const clinic = data.recentAppointments.filter(a => a.consultationType?.toLowerCase().includes("clinic")).length;
    const others = total - video - clinic;
    return {
      video: Math.round((video / total) * 100),
      clinic: Math.round((clinic / total) * 100),
      others: Math.round((others / total) * 100),
      total: data.summary.totalAppointments,
    };
  })()
    : { video: 65, clinic: 25, others: 10, total: 0 };

  const { linePath, areaPath, points } = buildTrendPath(data?.appointmentTrend ?? []);
  const trendMax = data?.appointmentTrend ? Math.max(...data.appointmentTrend.map(t => t.appointments), 1) : 300;
  const yLabels = [trendMax, Math.round(trendMax * 0.66), Math.round(trendMax * 0.33), 0];
  const trendMonthLabel = data?.appointmentTrend?.length ? data.appointmentTrend.map(t => MONTHS[t.month - 1]).join(", ") : "";

  return (
    <div className="flex min-h-screen bg-[#f0f4fb] pt-16">
      <AdminSidebar />
      <main className="min-w-0 flex-1 p-5 lg:p-7">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">Overview</p>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Admin <span className="text-blue-600">Dashboard</span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">Manage doctors, patients, appointments and payments</p>
          </div>
        </div>
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-white py-10 text-sm font-bold text-blue-500 shadow-sm mb-5">
            <FaSpinner className="animate-spin" /> Loading dashboard…
          </div>
        )}

        {!loading && data && (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4 mb-5">
              {stats.map((item, index) => (
                <StatCard key={index} {...item} />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mb-5">
              <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Appointments Overview</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Monthly trend · {trendMonthLabel} {selectedYear}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-1.5 shadow-sm">
                      <span className="text-blue-400 text-sm"><FaCalendarAlt /></span>
                      <input type="number" min="2000" max="2100" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                        className="border-none bg-transparent text-sm text-slate-700 outline-none cursor-pointer w-20" />
                    </div>
                  </div>
                </div>
                <div className="relative h-44">
                  <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-xs text-slate-300 pb-0">
                    {yLabels.map((l, i) => <span key={i}>{l}</span>)}
                  </div>
                  <svg viewBox="0 0 380 140" className="absolute left-8 top-0 h-full w-[calc(100%-2rem)]" fill="none"
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    <defs>
                      <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[0, 46, 93, 139].map(y => (
                      <line key={y} x1="0" y1={y} x2="380" y2={y} stroke="#eff6ff" strokeWidth="1" />
                    ))}
                    {areaPath && <path d={areaPath} fill="url(#areaBlue)" />}
                    {linePath && (
                      <path d={linePath} stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    {points.map(([cx, cy], i) => (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                        <circle cx={cx} cy={cy} r="14" fill="transparent" onMouseEnter={() => setHoverIndex(i)}
                          onClick={() => setHoverIndex(i)} style={{ cursor: "pointer" }} />
                      </g>
                    ))}
                    {data.appointmentTrend.map((t, i) => (
                      <text key={i} x={points[i]?.[0] ?? 0} y={138} textAnchor="middle" fontSize="9" fill="#94a3b8">
                        {MONTHS[t.month - 1]}
                      </text>
                    ))}
                  </svg>
                  {hoverIndex !== null && data.appointmentTrend[hoverIndex] && (
                    <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg"
                      style={{
                        left: `calc(2rem + ${(points[hoverIndex][0] / 380) * 100}% * (100% - 2rem) / 100%)`,
                        top: `${(points[hoverIndex][1] / 140) * 100}%`}}>
                      {MONTHS[data.appointmentTrend[hoverIndex].month - 1]}: {data.appointmentTrend[hoverIndex].appointments} appointments
                      <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-slate-900" />
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Appointments by Type</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Distribution this month</p>
                </div>
                <div className="flex items-center justify-center gap-8">
                  <div className="relative h-32 w-32 shrink-0">
                    <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
                      <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#0ea5e9"
                        strokeWidth="6"
                        strokeDasharray={`${appointmentsByType.video} ${100 - appointmentsByType.video}`}
                        strokeDashoffset="0" />
                      <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#2563eb"
                        strokeWidth="6"
                        strokeDasharray={`${appointmentsByType.clinic} ${100 - appointmentsByType.clinic}`}
                        strokeDashoffset={`-${appointmentsByType.video}`} />
                      <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#bfdbfe"
                        strokeWidth="6"
                        strokeDasharray={`${appointmentsByType.others} ${100 - appointmentsByType.others}`}
                        strokeDashoffset={`-${appointmentsByType.video + appointmentsByType.clinic}`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-base font-bold text-slate-900">
                        {appointmentsByType.total >= 1000 ? `${(appointmentsByType.total / 1000).toFixed(1)}K` : appointmentsByType.total}
                      </span>
                      <span className="text-xs text-slate-400">Total</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <ChartLabel color="bg-sky-400" label="Video Consultation" value={`${appointmentsByType.video}%`} />
                    <ChartLabel color="bg-blue-600" label="Clinic Visit" value={`${appointmentsByType.clinic}%`} />
                    <ChartLabel color="bg-blue-200" label="Others" value={`${appointmentsByType.others}%`} />
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recent Appointments</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Latest activity</p>
                </div>
                <button onClick={() => navigate("/admin/appointments")} className="rounded-xl cursor-pointer border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors">
                  View All →
                </button>
              </div>
              <div className="block space-y-3 md:hidden">
                {data.recentAppointments.map((item, index) => (
                  <div key={index} className="rounded-xl border border-blue-50 bg-blue-50/40 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                          {getAvatarInitials(item.patientName)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{item.patientName ?? "—"}</h4>
                          <p className="text-xs text-slate-500">Dr. {item.doctorName ?? "—"}</p>
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <InfoItem label="Date" value={formatDate(item.appointmentDate)} />
                      <InfoItem label="Type" value={item.consultationType ?? "—"} />
                      <InfoItem label="Payment" value={formatCurrency(item.amount)} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-blue-50">
                      {["#", "Patient", "Doctor", "Date", "Type", "Amount", "Payment", "Status"].map(h => (
                        <th key={h} className="py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentAppointments.map((item, index) => (
                      <tr key={index} className="border-b border-slate-50 text-sm text-slate-600 hover:bg-blue-50/40 transition-colors">
                        <td className="py-3 px-3 text-slate-400">{index + 1}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                              {getAvatarInitials(item.patientName)}
                            </div>
                            <span className="font-semibold text-slate-800">{item.patientName ?? "—"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-500">Dr. {item.doctorName ?? "—"}</td>
                        <td className="py-3 px-3 text-slate-400">{formatDate(item.appointmentDate)}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold ${item.consultationType?.toLowerCase().includes("video")
                            ? "bg-sky-50 text-sky-600" : "bg-blue-50 text-blue-700"}`}>
                            {item.consultationType?.toLowerCase().includes("video") ? <FaVideo /> : <FaHospitalAlt />}
                            {item.consultationType ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800">{formatCurrency(item.amount)}</td>
                        <td className="py-3 px-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getPaymentStatusConfig(item.paymentStatus)}`}>
                            {item.paymentStatus ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.recentAppointments.length === 0 && (
                <p className="py-8 text-center text-sm font-semibold text-slate-400">No recent appointments found.</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
