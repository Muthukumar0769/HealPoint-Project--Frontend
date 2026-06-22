import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DoctorSidebar } from './DoctorSidebar';
import { FaCalendarCheck, FaStar, FaUsers, FaRupeeSign, FaCalendarAlt, FaVideo, FaHospital, FaChevronRight } from "react-icons/fa";
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,AreaChart, Area,} from "recharts";
import API from "../../api/axios";
import type { DashboardSummary, TodayAppointment, WeeklyLoad, MonthlyOverview } from "../../types/doctor";
import usePageTitle from "../../hooks/usePageTitle";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
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

export const DoctorDashboard = () => {
  usePageTitle("Doctor Dashboard");
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [apptStartIndex, setApptStartIndex] = useState(0);
  const [weeklyData, setWeeklyData] = useState<WeeklyLoad[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; appointments: number; patients: number }[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

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
                <p className="text-xs text-slate-400 mt-0.5">MediPlatform</p>
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

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
              View All Appointments
              <FaChevronRight className="text-[10px]" />
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
      </main>
    </div>
  );
};