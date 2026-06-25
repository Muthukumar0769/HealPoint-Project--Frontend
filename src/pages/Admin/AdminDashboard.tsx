import { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "../Admin/AdminSidebar";
import type { StatusBadgeProps } from "../../types/common.ts";
import type { InfoItemProps } from "../../types/admin.ts";
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
  if (!trend || trend.length === 0) return { linePath: "", areaPath: "", points: [] };
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
    return { linePath: `M${x} ${y}`, areaPath: `M${x} ${y} L${x} 140 Z`, points };
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

interface RevenueTrendItem {
  month: string;
  revenue: number;
}

const buildRevenuePath = (trend: RevenueTrendItem[]): { linePath: string; areaPath: string; points: [number, number][] } => {
  if (!trend || trend.length === 0) return { linePath: "", areaPath: "", points: [] };
  const maxVal = Math.max(...trend.map(t => t.revenue), 1);
  const padX = 10;
  const width = 380 - padX * 2;
  const height = 120;
  const topPad = 10;
  const points: [number, number][] = trend.map((t, i) => [
    padX + (trend.length === 1 ? width / 2 : (i / (trend.length - 1)) * width),
    topPad + (1 - t.revenue / maxVal) * height,
  ]);
  if (points.length === 1) {
    const [x, y] = points[0];
    return { linePath: `M${x} ${y}`, areaPath: `M${x} ${y} L${x} 140 Z`, points };
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

const StatCard = ({ title, value, icon, change }: { title: string; value: string; icon: string; change: string }) => (
  <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:rounded-2xl sm:p-4">
    <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-xl sm:rounded-t-2xl" />
    <div className="flex items-start justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-slate-400 mb-1.5 sm:text-sm sm:mb-2 truncate">{title}</p>
        <p className="text-lg font-bold text-slate-900 leading-none sm:text-xl">{value}</p>
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 sm:mt-2 sm:px-2 sm:text-xs">
          <FaArrowTrendUp /> {change}
        </span>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-base ml-2 sm:h-9 sm:w-9 sm:text-lg">{icon}</div>
    </div>
  </div>
);

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const { cls, label } = getStatusConfig(status);
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:text-xs ${cls}`}>{label}</span>;
};

const InfoItem = ({ label, value }: InfoItemProps) => (
  <div>
    <p className="text-[10px] font-semibold text-slate-400 sm:text-xs">{label}</p>
    <p className="mt-0.5 text-[10px] font-semibold text-slate-700 sm:text-xs">{value}</p>
  </div>
);

const RevenueTrendChart = ({ trend }: { trend: RevenueTrendItem[] }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  if (!trend || trend.length === 0) {
    return <div className="flex h-36 items-center justify-center text-xs text-slate-400 font-semibold sm:h-44 sm:text-sm">No revenue data available</div>;
  }
  const { linePath, areaPath, points } = buildRevenuePath(trend);
  const maxVal = Math.max(...trend.map(t => t.revenue), 1);
  const yLabels = [maxVal, Math.round(maxVal * 0.66), Math.round(maxVal * 0.33), 0];
  const totalRevenue = trend.reduce((s, t) => s + t.revenue, 0);
  const peakMonth = trend.reduce((best, t) => t.revenue > best.revenue ? t : best);
  const avgRevenue = Math.round(totalRevenue / trend.length);
  return (
    <div>
      <div className="relative h-36 sm:h-44">
        <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-[9px] text-slate-300 pb-0 sm:text-xs">
          {yLabels.map((l, i) => (
            <span key={i}>{l >= 1000 ? `₹${(l / 1000).toFixed(0)}k` : `₹${l}`}</span>
          ))}
        </div>
        <svg viewBox="0 0 380 140" className="absolute left-7 top-0 h-full w-[calc(100%-1.75rem)] sm:left-8 sm:w-[calc(100%-2rem)]" fill="none" onMouseLeave={() => setHoverIndex(null)}>
          <defs>
            <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 46, 93, 139].map(y => (
            <line key={y} x1="0" y1={y} x2="380" y2={y} stroke="#f0fdf4" strokeWidth="1" />
          ))}
          {areaPath && <path d={areaPath} fill="url(#areaGreen)" />}
          {linePath && <path d={linePath} stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          {points.map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="4" fill="#fff" stroke="#10b981" strokeWidth="2" />
              <circle cx={cx} cy={cy} r="14" fill="transparent" onMouseEnter={() => setHoverIndex(i)} onClick={() => setHoverIndex(i)} style={{ cursor: "pointer" }} />
            </g>
          ))}
          {trend.map((t, i) => (
            <text key={i} x={points[i]?.[0] ?? 0} y={138} textAnchor="middle" fontSize="9" fill="#94a3b8">{t.month}</text>
          ))}
        </svg>
        {hoverIndex !== null && trend[hoverIndex] && (
          <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white shadow-lg sm:px-2.5 sm:py-1.5 sm:text-xs"
            style={{ left: `calc(1.75rem + ${(points[hoverIndex][0] / 380) * 100}% * (100% - 1.75rem) / 100%)`, top: `${(points[hoverIndex][1] / 140) * 100}%` }}>
            {trend[hoverIndex].month}: <span className="text-emerald-300">{formatCurrency(trend[hoverIndex].revenue)}</span>
            <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-slate-900" />
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-emerald-50 px-2.5 py-2 sm:gap-4 sm:px-3">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 sm:h-2.5 sm:w-2.5" />
          <span className="text-[10px] text-slate-500 sm:text-xs">Total</span>
          <b className="text-[10px] text-slate-800 sm:text-xs">{formatCurrency(totalRevenue)}</b>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-300 sm:h-2.5 sm:w-2.5" />
          <span className="text-[10px] text-slate-500 sm:text-xs">Peak</span>
          <b className="text-[10px] text-slate-800 sm:text-xs">{peakMonth.month}</b>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-200 sm:h-2.5 sm:w-2.5" />
          <span className="text-[10px] text-slate-500 sm:text-xs">Avg/Month</span>
          <b className="text-[10px] text-slate-800 sm:text-xs">{formatCurrency(avgRevenue)}</b>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard = () => {
  usePageTitle("Admin Dashboard");
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendItem[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);

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

  const fetchRevenueTrend = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const res = await API.get(`/admin/dashboard/earnings-report?period=year`);
      const raw = res.data.data?.revenueTrend ?? [];
      setRevenueTrend(raw.map((t: any) => ({ month: t.month, revenue: Number(t.revenue) })));
    } catch {
      setRevenueTrend([]);
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(selectedYear);
  }, [selectedYear, fetchDashboard]);

  useEffect(() => {
    fetchRevenueTrend();
  }, [fetchRevenueTrend]);

  const stats = data ? [
    { title: "Total Doctors", value: String(data.summary.totalDoctors), icon: "🩺", change: "+12%" },
    { title: "Total Patients", value: String(data.summary.totalPatients), icon: "👥", change: "+8%" },
    { title: "Appointments", value: String(data.summary.totalAppointments), icon: "📅", change: "+5%" },
    { title: "Total Revenue", value: formatCurrency(data.summary.totalRevenue), icon: "💰", change: "+18%" },
  ] : [];

  const { linePath, areaPath, points } = buildTrendPath(data?.appointmentTrend ?? []);
  const trendMax = data?.appointmentTrend ? Math.max(...data.appointmentTrend.map(t => t.appointments), 1) : 300;
  const yLabels = [trendMax, Math.round(trendMax * 0.66), Math.round(trendMax * 0.33), 0];
  const trendMonthLabel = data?.appointmentTrend?.length ? data.appointmentTrend.map(t => MONTHS[t.month - 1]).join(", ") : "";

  return (
    <div className="flex min-h-screen bg-[#f0f4fb] pt-14 sm:pt-16">
      <AdminSidebar />
      <main className="min-w-0 flex-1 px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-7 xl:px-8">
        <div className="mx-auto w-full max-w-xs xs:max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl">
          <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 mb-0.5 sm:text-xs sm:mb-1">Overview</p>
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl lg:text-2xl">
                Admin <span className="text-blue-600">Dashboard</span>
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">Manage doctors, patients, appointments and payments</p>
            </div>
          </div>

          {error && (
            <div className="mb-3 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-xs font-semibold text-red-600 sm:mb-4 sm:px-4 sm:py-3 sm:text-sm">{error}</div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-white py-8 text-xs font-bold text-blue-500 shadow-sm mb-4 sm:py-10 sm:text-sm sm:mb-5">
              <FaSpinner className="animate-spin" /> Loading dashboard…
            </div>
          )}

          {!loading && data && (
            <>
              <div className="grid grid-cols-2 gap-2 mb-4 sm:gap-3 sm:mb-5 xl:grid-cols-4 xl:gap-4">
                {stats.map((item, index) => <StatCard key={index} {...item} />)}
              </div>
              <div className="mb-4 sm:mb-5">
                <div className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
                  <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 sm:text-sm">Appointments Overview</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 sm:text-xs">Monthly trend · {trendMonthLabel} {selectedYear}</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-2.5 py-1 shadow-sm self-start sm:self-auto sm:px-3 sm:py-1.5">
                      <span className="text-blue-400 text-xs sm:text-sm"><FaCalendarAlt /></span>
                      <input type="number" min="2000" max="2100" value={selectedYear}
                        onChange={e => setSelectedYear(e.target.value)} className="border-none bg-transparent text-xs text-slate-700 outline-none cursor-pointer w-16 sm:text-sm sm:w-20"/>
                    </div>
                  </div>
                  <div className="relative h-36 sm:h-44">
                    <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-[9px] text-slate-300 pb-0 sm:text-xs">
                      {yLabels.map((l, i) => <span key={i}>{l}</span>)}
                    </div>
                    <svg viewBox="0 0 380 140" className="absolute left-7 top-0 h-full w-[calc(100%-1.75rem)] sm:left-8 sm:w-[calc(100%-2rem)]" fill="none" onMouseLeave={() => setHoverIndex(null)}>
                      <defs>
                        <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {[0, 46, 93, 139].map(y => <line key={y} x1="0" y1={y} x2="380" y2={y} stroke="#eff6ff" strokeWidth="1" />)}
                      {areaPath && <path d={areaPath} fill="url(#areaBlue)" />}
                      {linePath && <path d={linePath} stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                      {points.map(([cx, cy], i) => (
                        <g key={i}>
                          <circle cx={cx} cy={cy} r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                          <circle cx={cx} cy={cy} r="14" fill="transparent" onMouseEnter={() => setHoverIndex(i)} onClick={() => setHoverIndex(i)} style={{ cursor: "pointer" }} />
                        </g>
                      ))}
                      {data.appointmentTrend.map((t, i) => (
                        <text key={i} x={points[i]?.[0] ?? 0} y={138} textAnchor="middle" fontSize="9" fill="#94a3b8">{MONTHS[t.month - 1]}</text>
                      ))}
                    </svg>
                    {hoverIndex !== null && data.appointmentTrend[hoverIndex] && (
                      <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white shadow-lg sm:px-2.5 sm:py-1.5 sm:text-xs"
                        style={{ left: `calc(1.75rem + ${(points[hoverIndex][0] / 380) * 100}% * (100% - 1.75rem) / 100%)`, top: `${(points[hoverIndex][1] / 140) * 100}%` }}>
                        {MONTHS[data.appointmentTrend[hoverIndex].month - 1]}: {data.appointmentTrend[hoverIndex].appointments} appointments
                        <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-slate-900" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-white p-3 shadow-sm mb-4 sm:rounded-2xl sm:p-4 sm:mb-5">
                <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 sm:text-sm">Revenue Trend</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 sm:text-xs">Monthly revenue from video consultations</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 self-start sm:self-auto sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 sm:h-2 sm:w-2" /> Video Call Revenue
                  </span>
                </div>
                {revenueLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-xs font-bold text-emerald-500 sm:py-10 sm:text-sm">
                    <FaSpinner className="animate-spin" /> Loading revenue…
                  </div>
                ) : (
                  <RevenueTrendChart trend={revenueTrend} />
                )}
              </div>
              <div className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
                <div className="mb-3 flex items-center justify-between sm:mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 sm:text-sm">Recent Appointments</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 sm:text-xs">Latest activity</p>
                  </div>
                  <button onClick={() => navigate("/admin/appointments")} className="rounded-xl cursor-pointer border border-blue-200 px-2.5 py-1 text-[10px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors sm:px-3 sm:py-1.5 sm:text-xs">
                    View All →
                  </button>
                </div>
                <div className="block space-y-2 md:hidden sm:space-y-3">
                  {data.recentAppointments.map((item, index) => (
                    <div key={index} className="rounded-xl border border-blue-50 bg-blue-50/40 p-2.5 sm:p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 sm:h-8 sm:w-8 sm:text-xs">
                            {getAvatarInitials(item.patientName)}
                          </div>
                          <div>
                            <h4 className="text-[11px] font-bold text-slate-900 sm:text-xs">{item.patientName ?? "—"}</h4>
                            <p className="text-[10px] text-slate-500 sm:text-xs">Dr. {item.doctorName ?? "—"}</p>
                          </div>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="mt-2.5 grid grid-cols-3 gap-2">
                        <InfoItem label="Date" value={formatDate(item.appointmentDate)} />
                        <InfoItem label="Type" value={item.consultationType ?? "—"} />
                        <InfoItem label="Payment" value={formatCurrency(item.amount)} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[640px] border-collapse text-left lg:min-w-[720px]">
                    <thead>
                      <tr className="border-b border-blue-50">
                        {["#", "Patient", "Doctor", "Date", "Type", "Amount", "Payment", "Status"].map(h => (
                          <th key={h} className="py-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 lg:py-2.5 lg:px-3 lg:text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentAppointments.map((item, index) => (
                        <tr key={index} className="border-b border-slate-50 text-xs text-slate-600 hover:bg-blue-50/40 transition-colors lg:text-sm">
                          <td className="py-2.5 px-2 text-slate-400 lg:py-3 lg:px-3">{index + 1}</td>
                          <td className="py-2.5 px-2 lg:py-3 lg:px-3">
                            <div className="flex items-center gap-1.5 lg:gap-2">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 lg:h-7 lg:w-7 lg:text-xs">
                                {getAvatarInitials(item.patientName)}
                              </div>
                              <span className="font-semibold text-slate-800 truncate max-w-[80px] lg:max-w-none">{item.patientName ?? "—"}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-slate-500 truncate max-w-[80px] lg:py-3 lg:px-3 lg:max-w-none">Dr. {item.doctorName ?? "—"}</td>
                          <td className="py-2.5 px-2 text-slate-400 whitespace-nowrap lg:py-3 lg:px-3">{formatDate(item.appointmentDate)}</td>
                          <td className="py-2.5 px-2 lg:py-3 lg:px-3">
                            <span className={`inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] font-semibold lg:px-2 lg:text-xs ${item.consultationType?.toLowerCase().includes("video") ? "bg-sky-50 text-sky-600" : "bg-blue-50 text-blue-700"}`}>
                              {item.consultationType?.toLowerCase().includes("video") ? <FaVideo /> : <FaHospitalAlt />}
                              <span className="hidden lg:inline">{item.consultationType ?? "—"}</span>
                              <span className="lg:hidden">{item.consultationType?.toLowerCase().includes("video") ? "Video" : "Clinic"}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-2 font-bold text-slate-800 whitespace-nowrap lg:py-3 lg:px-3">{formatCurrency(item.amount)}</td>
                          <td className="py-2.5 px-2 lg:py-3 lg:px-3">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize lg:px-2.5 lg:text-xs ${getPaymentStatusConfig(item.paymentStatus)}`}>
                              {item.paymentStatus ?? "—"}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 lg:py-3 lg:px-3">
                            <StatusBadge status={item.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {data.recentAppointments.length === 0 && (
                  <p className="py-6 text-center text-xs font-semibold text-slate-400 sm:py-8 sm:text-sm">No recent appointments found.</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;