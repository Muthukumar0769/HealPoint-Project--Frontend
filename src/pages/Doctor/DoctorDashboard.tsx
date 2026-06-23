import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DoctorSidebar } from './DoctorSidebar';
import { FaCalendarCheck, FaStar, FaUsers, FaRupeeSign, FaCalendarAlt, FaVideo, FaHospital, FaChevronRight, FaUserPlus, FaUserCheck } from "react-icons/fa";
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend} from "recharts";
import API from "../../api/axios";
import type { DashboardSummary, TodayAppointment, WeeklyLoad, MonthlyOverview } from "../../types/doctor";
import usePageTitle from "../../hooks/usePageTitle";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};

const getInitials = (name: string) => name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "PT";

const CustomTooltipBar = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-blue-100 bg-white px-3 py-2 shadow-lg text-xs">
        <p className="font-bold text-slate-700">{label}</p>
        <p className="text-blue-600 font-semibold mt-0.5">{payload[0].value} appointments</p>
      </div>
    );
  }
  return null;
};

const CustomTooltipArea = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-blue-100 bg-white px-3 py-2 shadow-lg text-xs">
        <p className="font-bold text-slate-700 mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="font-semibold">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomTooltipPie = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-blue-100 bg-white px-3 py-2 shadow-lg text-xs">
        <p className="font-bold text-slate-700">{payload[0].name}</p>
        <p className="font-semibold mt-0.5" style={{ color: payload[0].payload.color }}>
          {payload[0].value} patients ({payload[0].payload.percent}%)
        </p>
      </div>
    );
  }
  return null;
};

export const DoctorDashboard = () => {
  usePageTitle("Doctor Dashboard");
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<{ date: string; items: TodayAppointment[] }[]>([]);
  const [apptStartIndex, setApptStartIndex] = useState(0);
  const [weeklyData, setWeeklyData] = useState<WeeklyLoad[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; appointments: number; patients: number }[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [upcomingLoading, setUpcomingLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [summaryRes, todayRes, weeklyRes] = await Promise.all([
          API.get("/doctor/dashboard/summary"),
          API.get("/doctor/dashboard/today-appointments"),
          API.get("/doctor/dashboard/weekly-load"),
        ]);
        if (summaryRes.data.success) setSummary(summaryRes.data.data);
        if (todayRes.data.success) {
          const sorted = [...todayRes.data.data].sort((a: TodayAppointment, b: TodayAppointment) =>
            a.start_time.localeCompare(b.start_time)
          );
          setTodayAppointments(sorted);
        }
        if (weeklyRes.data.success) {
          const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
          const DAY_SHORT: Record<string, string> = {
            Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu",
            Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
          };
          const sorted = DAY_ORDER.map((d) => {
            const found = weeklyRes.data.data.find((item: any) => item.day === d);
            return { day: DAY_SHORT[d], appointments: found ? Number(found.appointments) : 0 };
          });
          setWeeklyData(sorted);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        setUpcomingLoading(true);
        const today = new Date();
        const dates: string[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          dates.push(d.toISOString().split("T")[0]);
        }

        const results = await Promise.allSettled(
          dates.map((date) =>
            API.get("/doctor/dashboard/today-appointments", { params: { date } })
          )
        );

        const grouped: { date: string; items: TodayAppointment[] }[] = [];
        results.forEach((result, i) => {
          if (result.status === "fulfilled" && result.value.data.success) {
            const items: TodayAppointment[] = [...result.value.data.data].sort(
              (a, b) => a.start_time.localeCompare(b.start_time)
            );
            if (items.length > 0) {
              grouped.push({ date: dates[i], items });
            }
          }
        });
        setUpcomingAppointments(grouped);
      } catch (err) {
        console.error("Upcoming fetch error:", err);
      } finally {
        setUpcomingLoading(false);
      }
    };
    fetchUpcoming();
  }, []);

  useEffect(() => {
    const fetchMonthly = async () => {
      try {
        const res = await API.get("/doctor/dashboard/monthly-overview", {
          params: { year: selectedYear },
        });
        if (res.data.success) {
          const mapped = (res.data.data as MonthlyOverview[]).map((item) => ({
            month: MONTH_NAMES[item.month - 1],
            appointments: Number(item.appointments),
            patients: Number(item.patients),
          }));
          setMonthlyData(mapped);
        }
      } catch (err) {
        console.error("Monthly overview error:", err);
      }
    };
    fetchMonthly();
  }, [selectedYear]);

  const VISIBLE_COUNT = 3;
  const visibleAppointments = todayAppointments.slice(apptStartIndex, apptStartIndex + VISIBLE_COUNT);
  const hasNext = apptStartIndex + VISIBLE_COUNT < todayAppointments.length;
  const hasPrev = apptStartIndex > 0;
  const totalAppointments = monthlyData.reduce((s, d) => s + d.appointments, 0);
  const totalPatientsMo = monthlyData.reduce((s, d) => s + d.patients, 0);
  const conversionRate = totalAppointments > 0 ? Math.round((totalPatientsMo / totalAppointments) * 100) : 0;
  const peakMonth = monthlyData.reduce(
    (best, d) => (d.appointments > best.appointments ? d : best),
    { month: "N/A", appointments: 0, patients: 0 }
  );
  const totalPat = Number(summary?.totalPatients ?? 0);
  const totalAppt = Number(summary?.totalAppointments ?? 0);
  const returningPatients = totalAppt > totalPat ? totalAppt - totalPat : 0;
  const newPatients = totalPat;
  const returnRate = totalAppt > 0 ? Math.round((returningPatients / totalAppt) * 100) : 0;
  const pieData = [
    { name: "New Patients", value: newPatients, color: "#3b82f6", percent: totalAppt > 0 ? Math.round((newPatients / totalAppt) * 100) : 0 },
    { name: "Returning", value: returningPatients, color: "#38bdf8", percent: returnRate },
  ];

  const stats = [
    { title: "Total Appointments", value: loading ? "—" : summary?.totalAppointments ?? 0, icon: <FaCalendarCheck />, bg: "bg-blue-50", text: "text-blue-600" },
    { title: "Total Patients", value: loading ? "—" : summary?.totalPatients ?? 0, icon: <FaUsers />, bg: "bg-sky-50", text: "text-sky-600" },
    { title: "Average Rating", value: loading ? "—" : summary?.averageRating ? Number(summary.averageRating).toFixed(1) : "N/A", icon: <FaStar />, bg: "bg-indigo-50", text: "text-indigo-600" },
    { title: "Total Earnings", value: loading ? "—" : `₹${Number(summary?.totalEarnings ?? 0).toLocaleString("en-IN")}`, icon: <FaRupeeSign />, bg: "bg-blue-50", text: "text-blue-600" },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4fb] lg:flex pt-16">
      <DoctorSidebar />
      <main className="flex-1 px-4 py-5 sm:px-6 lg:p-7">
        <section className="mb-5 rounded-2xl bg-white border border-blue-100 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white text-base font-bold shadow-md shadow-blue-200">
                {getInitials(user?.name || "Dr")}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Welcome back</p>
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl leading-tight">
                  {user?.name ? `Dr. ${user.name}` : "Doctor"}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">HealPoint</p>
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {stats.map((item, index) => (
              <div key={index} className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-2xl" />
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${item.bg} ${item.text} text-sm`}>
                  {item.icon}
                </div>
                <p className="text-xl font-bold text-slate-900 leading-none">{item.value}</p>
                <p className="mt-1.5 text-xs font-medium text-slate-400">{item.title}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 mb-4">
          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Today's Upcoming Appointments</h2>
                <p className="text-xs text-slate-400 mt-0.5">{todayAppointments.length} scheduled today</p>
              </div>
              <div className="flex items-center gap-2">
                {todayAppointments.length > VISIBLE_COUNT && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setApptStartIndex((p) => Math.max(0, p - 1))} disabled={!hasPrev}
                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-blue-100 text-blue-400 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-xs text-slate-400">
                      {apptStartIndex + 1}–{Math.min(apptStartIndex + VISIBLE_COUNT, todayAppointments.length)} of {todayAppointments.length}
                    </span>
                    <button onClick={() => setApptStartIndex((p) => Math.min(todayAppointments.length - VISIBLE_COUNT, p + 1))} disabled={!hasNext}
                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-blue-100 text-blue-400 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">Today</span>
              </div>
            </div>
            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading...</div>
            ) : todayAppointments.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No appointments today</div>
            ) : (
              <div className="space-y-3">
                {visibleAppointments.map((item) => {
                  const isVideo = item.consultation_type?.toLowerCase().includes("video") || item.consultation_type?.toLowerCase().includes("online");
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-blue-50 bg-blue-50/40 p-3 hover:bg-blue-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                          {getInitials(item.patient_name)}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900">{item.patient_name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            <span className="font-semibold text-blue-500">{formatTime(item.start_time)}</span>
                            {" · "}
                            <span className="inline-flex items-center gap-1">
                              {isVideo ? <FaVideo className="text-[10px]" /> : <FaHospital className="text-[10px]" />}
                              {isVideo ? "Video Call" : "Clinic Visit"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <button onClick={() => navigate("/doctor/consultations")} className="mt-4 flex cursor-pointer w-full items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors">
              View All Appointments <FaChevronRight className="text-[10px]" />
            </button>
            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-slate-700">This Week's Load</p>
                <span className="text-xs text-slate-400">appointments / day</span>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={weeklyData} barSize={22} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8f0fe" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltipBar />} cursor={{ fill: "#eff6ff" }} />
                  <Bar dataKey="appointments" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Monthly Overview</h2>
                <p className="text-xs text-slate-400 mt-1">Appointments vs Patients · {selectedYear}</p>
              </div>
              <div className="flex items-center gap-3 ml-[-60px] mt-[-20px] text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Appointments
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-300" />
                  Patients
                </span>
              </div>
              <div className="flex items-center gap-2 mt-[-16px] rounded-xl border border-blue-200 bg-blue-50 px-3 py-1 self-start sm:self-auto">
                <span className="text-blue-400 text-sm"><FaCalendarAlt /></span>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border-none bg-transparent text-xs text-slate-700 outline-none cursor-pointer font-medium">
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 my-3">
              <div className="flex-1 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5 text-center">
                <p className="text-lg font-bold text-blue-600">{totalAppointments}</p>
                <p className="text-xs text-slate-400 mt-0.5">Total Appointments</p>
              </div>
              <div className="flex-1 rounded-xl bg-sky-50 border border-sky-100 px-3 py-2.5 text-center">
                <p className="text-lg font-bold text-sky-500">{totalPatientsMo}</p>
                <p className="text-xs text-slate-400 mt-0.5">Total Patients</p>
              </div>
              <div className="flex-1 rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2.5 text-center">
                <p className="text-lg font-bold text-indigo-500">{conversionRate}%</p>
                <p className="text-xs text-slate-400 mt-0.5">Conversion Rate</p>
              </div>
            </div>
            <div className="flex-1 min-h-[180px]">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAppt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8f0fe" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltipArea />} />
                  <Area type="monotone" dataKey="appointments" name="Appointments" stroke="#3b82f6"
                    strokeWidth={2.5} fill="url(#colorAppt)" dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="patients" name="Patients" stroke="#38bdf8"
                    strokeWidth={2.5} fill="url(#colorPat)" dot={{ r: 3, fill: "#38bdf8", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700">Peak Month</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {peakMonth.month !== "N/A" ? `${peakMonth.month} ${selectedYear} · ${peakMonth.appointments} appointments` : "No data yet"}
                </p>
              </div>
              {peakMonth.month !== "N/A" && (
                <span className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-blue-200">
                  Peak
                </span>
              )}
            </div>
          </div>
        </section>
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Upcoming Appointments</h2>
                <p className="text-xs text-slate-400 mt-0.5">Next 7 days schedule</p>
              </div>
              <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">7 Days</span>
            </div>

            {upcomingLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl bg-slate-50 p-3 h-16" />
                ))}
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                  <FaCalendarCheck className="text-blue-300 text-xl" />
                </div>
                <p className="text-xs text-slate-400">No upcoming appointments in next 7 days</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {upcomingAppointments.map(({ date, items }) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-blue-600">{formatDateLabel(date)}</span>
                      <span className="flex-1 h-px bg-blue-50" />
                      <span className="text-[10px] text-slate-400 bg-blue-50 px-2 py-0.5 rounded-full">
                        {items.length} appt{items.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => {
                        const isVideo = item.consultation_type?.toLowerCase().includes("video") || item.consultation_type?.toLowerCase().includes("online");
                        return (
                          <div key={item.id} className="flex items-center gap-3 rounded-xl border border-blue-50 bg-blue-50/40 px-3 py-2.5 hover:bg-blue-50 transition-colors">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                              {getInitials(item.patient_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{item.patient_name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <span className="font-semibold text-blue-500">{formatTime(item.start_time)}</span>
                                <span>·</span>
                                {isVideo ? <FaVideo className="text-[9px]" /> : <FaHospital className="text-[9px]" />}
                                <span>{isVideo ? "Video" : "Clinic"}</span>
                              </p>
                            </div>
                            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${isVideo ? "bg-sky-50 text-sky-600" : "bg-emerald-50 text-emerald-600"}`}>
                              {isVideo ? "Online" : "In-person"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => navigate("/doctor/consultations")} className="mt-4 flex cursor-pointer w-full items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors">
              View All Appointments <FaChevronRight className="text-[10px]" />
            </button>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Patient Return Rate</h2>
                <p className="text-xs text-slate-400 mt-0.5">New vs returning patients</p>
              </div>
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">All Time</span>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center py-10">
                <p className="text-xs text-slate-400">Loading...</p>
              </div>
            ) : totalAppt === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                  <FaUsers className="text-blue-300 text-xl" />
                </div>
                <p className="text-xs text-slate-400">No patient data available yet</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <FaUserPlus className="text-blue-500 text-sm" />
                    </div>
                    <p className="text-lg font-bold text-blue-600">{newPatients}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">New</p>
                  </div>
                  <div className="rounded-xl bg-sky-50 border border-sky-100 px-3 py-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <FaUserCheck className="text-sky-500 text-sm" />
                    </div>
                    <p className="text-lg font-bold text-sky-500">{returningPatients}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Returning</p>
                  </div>
                  <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <FaStar className="text-indigo-500 text-sm" />
                    </div>
                    <p className="text-lg font-bold text-indigo-500">{returnRate}%</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Return Rate</p>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltipPie />} />
                      <Legend iconType="circle" iconSize={8}
                        formatter={(value) => (<span style={{ fontSize: "11px", color: "#64748b" }}>{value}</span>)}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">New Patients</span>
                      <span className="text-xs font-bold text-blue-600">
                        {totalAppt > 0 ? Math.round((newPatients / totalAppt) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-blue-50 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500 transition-all duration-700"
                        style={{ width: `${totalAppt > 0 ? Math.round((newPatients / totalAppt) * 100) : 0}%` }}/>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">Returning Patients</span>
                      <span className="text-xs font-bold text-sky-500">{returnRate}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-sky-50 overflow-hidden">
                      <div className="h-full rounded-full bg-sky-400 transition-all duration-700"
                        style={{ width: `${returnRate}%` }}/>
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-2.5 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    {returnRate >= 40 ? "Strong patient loyalty — keep it up!" : returnRate >= 20
                      ? "Good retention, room to grow further." : "Focus on follow-ups to improve retention."}
                  </p>
                  <span className={`ml-3 shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    returnRate >= 40 ? "bg-emerald-100 text-emerald-700" : returnRate >= 20 ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-600"}`}>
                    {returnRate >= 40 ? "Excellent" : returnRate >= 20 ? "Good" : "Low"}
                  </span>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};