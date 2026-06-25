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

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const { cls, label } = getStatusConfig(status);
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
};

const InfoItem = ({ label, value }: InfoItemProps) => (
  <div>
    <p className="text-xs font-semibold text-slate-400">{label}</p>
    <p className="mt-0.5 text-xs font-semibold text-slate-700">{value}</p>
  </div>
);

const RevenueTrendChart = ({ trend }: { trend: RevenueTrendItem[] }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  if (!trend || trend.length === 0) {
    return <div className="flex h-44 items-center justify-center text-sm text-slate-400 font-semibold">No revenue data available</div>;
  }
  const { linePath, areaPath, points } = buildRevenuePath(trend);
  const maxVal = Math.max(...trend.map(t => t.revenue), 1);
  const yLabels = [maxVal, Math.round(maxVal * 0.66), Math.round(maxVal * 0.33), 0];
  const totalRevenue = trend.reduce((s, t) => s + t.revenue, 0);
  const peakMonth = trend.reduce((best, t) => t.revenue > best.revenue ? t : best);
  const avgRevenue = Math.round(totalRevenue / trend.length);
  return (
    <div>
      <div className="relative h-44">
        <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-xs text-slate-300 pb-0">
          {yLabels.map((l, i) => (
            <span key={i}>{l >= 1000 ? `₹${(l / 1000).toFixed(0)}k` : `₹${l}`}</span>
          ))}
        </div>
        <svg viewBox="0 0 380 140" className="absolute left-8 top-0 h-full w-[calc(100%-2rem)]" fill="none" onMouseLeave={() => setHoverIndex(null)}>
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
          <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg"
            style={{ left: `calc(2rem + ${(points[hoverIndex][0] / 380) * 100}% * (100% - 2rem) / 100%)`, top: `${(points[hoverIndex][1] / 140) * 100}%` }}>
            {trend[hoverIndex].month}: <span className="text-emerald-300">{formatCurrency(trend[hoverIndex].revenue)}</span>
            <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-slate-900" />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center gap-4 rounded-xl bg-emerald-50 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-500">Total</span>
          <b className="text-xs text-slate-800">{formatCurrency(totalRevenue)}</b>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <span className="text-xs text-slate-500">Peak</span>
          <b className="text-xs text-slate-800">{peakMonth.month}</b>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-200" />
          <span className="text-xs text-slate-500">Avg/Month</span>
          <b className="text-xs text-slate-800">{formatCurrency(avgRevenue)}</b>
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
          <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-white py-10 text-sm font-bold text-blue-500 shadow-sm mb-5">
            <FaSpinner className="animate-spin" /> Loading dashboard…
          </div>
        )}

        {!loading && data && (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4 mb-5">
              {stats.map((item, index) => <StatCard key={index} {...item} />)}
            </div>

            <div className="mb-5">
              <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Appointments Overview</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Monthly trend · {trendMonthLabel} {selectedYear}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-1.5 shadow-sm">
                    <span className="text-blue-400 text-sm"><FaCalendarAlt /></span>
                    <input type="number" min="2000" max="2100" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                      className="border-none bg-transparent text-sm text-slate-700 outline-none cursor-pointer w-20" />
                  </div>
                </div>
                <div className="relative h-44">
                  <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-xs text-slate-300 pb-0">
                    {yLabels.map((l, i) => <span key={i}>{l}</span>)}
                  </div>
                  <svg viewBox="0 0 380 140" className="absolute left-8 top-0 h-full w-[calc(100%-2rem)]" fill="none" onMouseLeave={() => setHoverIndex(null)}>
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
                    <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg"
                      style={{ left: `calc(2rem + ${(points[hoverIndex][0] / 380) * 100}% * (100% - 2rem) / 100%)`, top: `${(points[hoverIndex][1] / 140) * 100}%` }}>
                      {MONTHS[data.appointmentTrend[hoverIndex].month - 1]}: {data.appointmentTrend[hoverIndex].appointments} appointments
                      <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-slate-900" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm mb-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Revenue Trend</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Monthly revenue from video consultations</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Video Call Revenue
                </span>
              </div>
              {revenueLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-emerald-500">
                  <FaSpinner className="animate-spin" /> Loading revenue…
                </div>
              ) : (
                <RevenueTrendChart trend={revenueTrend} />
              )}
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
                          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold ${item.consultationType?.toLowerCase().includes("video") ? "bg-sky-50 text-sky-600" : "bg-blue-50 text-blue-700"}`}>
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