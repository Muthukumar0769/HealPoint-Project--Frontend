import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle, FaVideo, FaSpinner, FaChevronLeft, FaChevronRight,
  FaPlay, FaClock, FaRedoAlt, FaBan, FaStar, FaMapMarkerAlt, FaChevronDown,FaChevronUp, FaShieldAlt, FaLightbulb,} from "react-icons/fa";
import API from "../../api/axios";
import { JitsiMeetRoom } from "../../utils/JitsimeetRoom";
import { ReviewModal } from "../../components/Reviews/ReviewModal";
import type { PaginatedResponse, MyAppointment } from "../../types/patient";
import usePageTitle from "../../hooks/usePageTitle";
import doctorImage from "../../assets/images/doctorImage-removebg-preview.png";
import backgroundImg from "../../assets/images/background.png";
import sleepImg from "../../assets/images/sleep.png";
import greenBg from "../../assets/images/greenbackground.png";
import micsetImg from "../../assets/images/micset.png";

const PAGE_SIZE = 5;
const getPatientAppointments = async (page = 1, limit = PAGE_SIZE): Promise<PaginatedResponse> => {
  const res = await API.get(`/patient/my-appointments?page=${page}&limit=${limit}`);
  const d = res.data;
  const raw = d?.appointments !== undefined ? d
      : d?.data?.appointments !== undefined ? d.data
        : d?.rows !== undefined ? { totalRecords: d.count ?? d.rows.length, currentPage: page, totalPages: Math.ceil((d.count ?? d.rows.length) / limit), appointments: d.rows } : d;
  return {
    totalRecords: raw.totalRecords ?? raw.count ?? 0,
    currentPage: raw.currentPage ?? page,
    totalPages: raw.totalPages ?? Math.max(1, Math.ceil((raw.totalRecords ?? raw.count ?? 0) / limit)),
    appointments: raw.appointments ?? raw.rows ?? [],
  };
};

const joinAppointmentAPI  = async (id: number) => (await API.get(`/appointments/${id}/join`)).data;
const cancelAppointmentAPI = async (id: number) => (await API.patch(`/appointments/${id}/cancel`)).data;
const formatDate    = (d?: string) => d ? new Date(d).toLocaleDateString("en-IN",  { day: "2-digit", month: "short", year: "numeric" }) : "N/A";
const formatTime    = (t?: string) => t ? new Date(`2000-01-01T${t}`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "N/A";
const getDayAbbr    = (d?: string) => d ? new Date(d).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase() : "";
const getDayNum     = (d?: string) => d ? new Date(d).getDate() : "";
const getMonthAbbr  = (d?: string) => d ? new Date(d).toLocaleDateString("en-US", { month: "short" }).toUpperCase() : "";
const getInitials   = (n?: string) => n ? n.split(" ").map(x => x[0]).join("").toUpperCase().slice(0, 2) : "DR";

const getStatusConfig = (status?: string) => {
  const s = status?.toLowerCase();
  if (s === "confirmed" || s === "accepted") return { dot: "bg-emerald-400", cls: "text-emerald-700 bg-emerald-50 border border-emerald-200", label: "Confirmed", accent: "from-emerald-500 to-teal-600" };
  if (s === "completed") return { dot: "bg-blue-400",    cls: "text-blue-700 bg-blue-50 border border-blue-200", label: "Completed", accent: "from-blue-500 to-indigo-600"  };
  if (s === "cancelled" || s === "canceled" || s === "rejected") return { dot: "bg-red-400", cls: "text-red-600 bg-red-50 border border-red-200", label: "Cancelled", accent: "from-red-400 to-rose-500"     };
  if (s === "no_show"   || s === "missed") return { dot: "bg-orange-400",  cls: "text-orange-600 bg-orange-50 border border-orange-200",    label: "Missed", accent: "from-orange-400 to-amber-500"  };
  return { dot: "bg-amber-400",   cls: "text-amber-700 bg-amber-50 border border-amber-200", label: status ?? "Pending", accent: "from-amber-400 to-yellow-500" };
};

const isVideoConsultation = (a: MyAppointment) => {
  const t = String(a.consultation_type ?? (a as any).consultationType ?? (a as any).appointment_type ?? "").toLowerCase();
  return t.includes("video") || t.includes("online") || t.includes("virtual") || !!a.meeting_room;
};
const isDoctorMissed    = (a: MyAppointment) => ["no_show", "missed"].includes(String(a.consultation_status ?? "").toLowerCase());
const isDoctorCancelled = (a: MyAppointment) => ["cancelled", "canceled", "rejected"].includes(String(a.status ?? "").toLowerCase());

const canJoin = (a: MyAppointment, now: Date) => {
  const status = a.status?.toLowerCase();
  if (status !== "confirmed" && status !== "accepted") return false;
  if (!isVideoConsultation(a)) return false;
  if (a.consultation_status === "ongoing") return true;
  const dateOnly = a.appointment_date.split("T")[0];
  const start = new Date(`${dateOnly}T${a.start_time}`);
  const end   = new Date(`${dateOnly}T${a.end_time}`);
  if (isNaN(start.getTime())) return false;
  return now >= new Date(start.getTime() - 10 * 60 * 1000) && now <= end;
};

const DoctorAvatar = ({ appointment }: { appointment: MyAppointment }) => {
  const [error, setError] = useState(false);
  const src = appointment.doctor?.profile_picture ?? "";
  if (!src || error)
    return (
      <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-sm font-bold text-white shadow-inner">
        {getInitials(appointment.doctor?.name)}
      </div>
    );
  return <img src={src} alt={appointment.doctor?.name || "Doctor"} className="h-full w-full rounded-full object-cover object-top" onError={() => setError(true)} />;
};

const Pagination = ({ currentPage, totalPages, onChange }: { currentPage: number; totalPages: number; onChange: (p: number) => void }) => {
  if (totalPages <= 1) return null;
  const pages: (number | "…")[] = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else {
    pages.push(1);
    if (currentPage > 3) pages.push("…");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }
  const btn = "w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer";
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8 flex-wrap">
      <button onClick={() => onChange(currentPage - 1)} disabled={currentPage === 1} className={btn}><FaChevronLeft className="text-xs" /></button>
      {pages.map((p, i) =>
        p === "…"
          ? <span key={`e-${i}`} className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
          : <button key={p} onClick={() => onChange(p as number)}
              className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer shadow-sm ${currentPage === p ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-200" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"}`}>
              {p}
            </button>
      )}
      <button onClick={() => onChange(currentPage + 1)} disabled={currentPage === totalPages} className={btn}><FaChevronRight className="text-xs" /></button>
    </div>
  );
};

const CancelModal = ({ doctorName, loading, onConfirm, onClose }: { doctorName: string; loading: boolean; onConfirm: () => void; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
    <div className="w-full max-w-sm rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100">
      <div className="mb-6 flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-red-50 border border-red-100 text-2xl text-red-500 shadow-sm"><FaBan /></div>
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Cancel Appointment?</h3>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
            Are you sure you want to cancel your appointment with <span className="font-bold text-slate-700">Dr. {doctorName}</span>?
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-100 px-4 py-2.5 w-full">
          <FaCheckCircle className="text-green-500 shrink-0" />
          <p className="text-xs font-semibold text-green-700">Refund within 3–5 business days</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} disabled={loading} className="h-11 flex-1 cursor-pointer rounded-2xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">Keep It</button>
        <button onClick={onConfirm} disabled={loading} className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 text-sm font-bold text-white hover:from-red-600 hover:to-rose-600 transition-all shadow-sm">
          {loading ? <><FaSpinner className="animate-spin" />Cancelling…</> : <><FaTimesCircle />Yes, Cancel</>}
        </button>
      </div>
    </div>
  </div>
);

type TabKey = "all" | "confirmed" | "completed" | "cancelled";
export const MyAppointments = () => {
  usePageTitle("My Appointments");
  const navigate = useNavigate();
  const [appointments, setAppointments]   = useState<MyAppointment[]>([]);
  const [loading, setLoading]             = useState(true);
  const [totalRecords, setTotalRecords]   = useState(0);
  const [totalPages, setTotalPages]       = useState(1);
  const [currentPage, setCurrentPage]     = useState(1);
  const [joinLoading, setJoinLoading]     = useState<number | null>(null);
  const [cancelModal, setCancelModal]     = useState<MyAppointment | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [activeCall, setActiveCall]       = useState<{ meetingRoom: string; doctorName: string; appointmentId: number } | null>(null);
  const [reviewModal, setReviewModal]     = useState<MyAppointment | null>(null);
  const [now, setNow]                     = useState(new Date());
  const [activeTab, setActiveTab]         = useState<TabKey>("all");
  const [expandedId, setExpandedId]       = useState<number | null>(null);
  const prevPageRef = useRef(1);
  const listRef     = useRef<HTMLDivElement>(null);
  const authUser = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(t); }, []);
  const fetchAppointments = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const data = await getPatientAppointments(page, PAGE_SIZE);
      setAppointments(data.appointments);
      setTotalRecords(data.totalRecords);
      setTotalPages(data.totalPages);
    } catch { setAppointments([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAppointments(currentPage); }, [currentPage, fetchAppointments]);

  const handlePageChange = (page: number) => {
    prevPageRef.current = page;
    setCurrentPage(page);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleJoinMeeting = async (appt: MyAppointment) => {
    setJoinLoading(appt.id);
    try {
      const res = await joinAppointmentAPI(appt.id);
      const payload = res?.appointment ?? res?.data ?? res;
      const meetingRoom = payload?.meeting_room ?? appt.meeting_room;
      if (!meetingRoom) { alert("Meeting room not available."); return; }
      setActiveCall({ meetingRoom, doctorName: appt.doctor?.name ?? "Doctor", appointmentId: appt.id });
    } catch (err: any) { alert(err?.response?.data?.message ?? "Unable to join."); }
    finally { setJoinLoading(null); }
  };

  const handleCallEnd = () => {
    const appt = appointments.find(a => a.id === activeCall?.appointmentId);
    setActiveCall(null);
    if (appt) setReviewModal(appt);
  };

  const handleCancelConfirm = async () => {
    if (!cancelModal) return;
    setCancelLoading(true);
    try { await cancelAppointmentAPI(cancelModal.id); setCancelModal(null); fetchAppointments(currentPage); }
    catch (err: any) { alert(err?.response?.data?.message ?? "Failed to cancel."); }
    finally { setCancelLoading(false); }
  };

  const handleReschedule = (appt: MyAppointment) => {
    const id = appt.doctor?.id ?? appt.doctor_id;
    navigate(id ? `/doctors/doctor-details/book-appointment/${id}` : "/doctors");
  };

  const confirmedCount = appointments.filter(a => ["confirmed","accepted"].includes(a.status?.toLowerCase() ?? "")).length;
  const completedCount = appointments.filter(a => a.status?.toLowerCase() === "completed").length;
  const cancelledCount = appointments.filter(a => ["cancelled","canceled","rejected"].includes(a.status?.toLowerCase() ?? "")).length;
  const filteredAppointments = appointments.filter(appt => {
    const s = appt.status?.toLowerCase() ?? "";
    if (activeTab === "all")       return true;
    if (activeTab === "confirmed") return s === "confirmed" || s === "accepted";
    if (activeTab === "completed") return s === "completed";
    if (activeTab === "cancelled") return s === "cancelled" || s === "canceled" || s === "rejected";
    return true;
  });

  const rangeStart = totalRecords === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd   = Math.min(currentPage * PAGE_SIZE, totalRecords);

  const tabs: { key: TabKey; label: string; count: number; color: string }[] = [
    { key: "all",       label: "All",       count: totalRecords,   color: "from-blue-500 to-indigo-600"  },
    { key: "confirmed", label: "Confirmed", count: confirmedCount, color: "from-emerald-500 to-teal-600" },
    { key: "completed", label: "Completed", count: completedCount, color: "from-blue-500 to-indigo-600"  },
    { key: "cancelled", label: "Cancelled", count: cancelledCount, color: "from-red-500 to-rose-600"     },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 px-3 pb-10 pt-14 sm:px-4 sm:pt-24 md:pt-20 lg:pt-24">
      <div className="mx-auto w-full max-w-[1700px]">
        <div className="flex gap-3 xl:gap-4">
          <div className="hidden lg:flex lg:flex-col lg:shrink-0 lg:gap-4 self-start sticky top-24" style={{ width: "200px" }}>
            <div className="rounded-3xl overflow-hidden relative shadow-xl"
              style={{ backgroundImage: `url(${backgroundImg})`, backgroundSize: "cover", backgroundPosition: "center" }}>
              <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 to-blue-950/80 rounded-3xl" />
              <div className="relative z-10 p-4 flex flex-col">
                <div className="mb-2">
                  <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-2.5 py-1 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-white/90 text-[10px] font-bold uppercase tracking-wider">Live Support</span>
                  </div>
                  <h3 className="text-white font-extrabold text-base leading-snug">Your Health,<br /><span className="text-blue-300">Our Priority</span></h3>
                  <p className="text-white/70 text-[11px] mt-1.5 leading-relaxed">Quality care from trusted doctors, whenever you need it.</p>
                </div>
                <div className="flex justify-center my-2">
                  <img src={doctorImage} alt="Doctor" className="xl:w-[200px] lg:w-[140px] object-contain drop-shadow-2xl" />
                </div>
                <div className="space-y-2">
                  {[{ icon: "🏥", num: "10,000+", label: "Happy Patients" }, { icon: "👨‍⚕️", num: "500+", label: "Expert Doctors" }, { icon: "🕐", num: "24/7", label: "Support" }].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm px-3 py-2 border border-white/10">
                      <span className="text-sm">{item.icon}</span>
                      <div><p className="text-white font-extrabold text-xs leading-none">{item.num}</p><p className="text-white/60 text-[10px] mt-0.5">{item.label}</p></div>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate("/doctors")} className="mt-3 w-full rounded-2xl bg-white text-blue-700 text-xs font-extrabold py-2.5 hover:bg-blue-50 transition-all cursor-pointer shadow-lg">
                  Book Appointment →
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-4 sm:mb-6 px-1">
              <div className="flex items-start sm:items-center justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold leading-tight text-slate-900 tracking-tight">My Appointments</h1>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500">
                    Welcome back, <span className="font-bold text-blue-600">{authUser?.name || "Patient"}</span>. Here are your upcoming visits.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-2xl px-3 sm:px-4 py-2 shadow-sm border border-slate-100 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-600">{totalRecords} Total</span>
                </div>
              </div>
            </div>
            <div className="mb-4 sm:mb-5 flex items-center gap-1.5 sm:gap-2 rounded-2xl bg-white px-2 sm:px-3 py-2 sm:py-2.5 shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex shrink-0 cursor-pointer items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold transition-all duration-200 ${activeTab === tab.key
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}>
                  {tab.label}
                  <span className={`flex h-4 w-4 sm:h-5 sm:min-w-[20px] items-center justify-center rounded-full px-1 sm:px-1.5 text-[10px] sm:text-xs font-extrabold transition-all ${activeTab === tab.key ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            <div ref={listRef} className="space-y-3 sm:space-y-3.5">
              {loading && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-white p-12 sm:p-16 shadow-sm border border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <FaSpinner className="animate-spin text-blue-500 text-xl" />
                  </div>
                  <p className="text-sm font-semibold text-slate-400">Loading your appointments…</p>
                </div>
              )}

              {!loading && filteredAppointments.length === 0 && (
                <div className="rounded-3xl bg-white p-12 sm:p-16 text-center shadow-sm border border-slate-100">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                    <FaClock className="text-slate-300 text-2xl" />
                  </div>
                  <p className="text-sm sm:text-base font-bold text-slate-400">No appointments found</p>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">Book a new appointment to get started</p>
                  <button onClick={() => navigate("/doctors")} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold px-5 sm:px-6 py-2.5 hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm cursor-pointer">
                    Find a Doctor →
                  </button>
                </div>
              )}

              {!loading && filteredAppointments.map(appt => {
                const doctorName = appt.doctor?.name ?? "Doctor";
                const specialization = appt.doctor?.specialization ?? "Medical Specialist";
                const isCompleted = appt.status?.toLowerCase() === "completed" || appt.consultation_status === "completed";
                const isMissed = isDoctorMissed(appt);
                const isCancelled = isDoctorCancelled(appt);
                const isConfirmed = (appt.status?.toLowerCase() === "confirmed" || appt.status?.toLowerCase() === "accepted") && !isCompleted && !isMissed && !isCancelled;
                const showVideo = isVideoConsultation(appt) && !isCompleted && !isMissed && !isCancelled;
                const joinable = canJoin(appt, now);
                const isJoining = joinLoading === appt.id;
                const { dot, cls: statusCls, label: statusLabel, accent } = getStatusConfig(isMissed ? "missed" : appt.status);
                const canReview = isCompleted && !isMissed && !appt.review_given;
                const consultType = isVideoConsultation(appt) ? "Video Consultation" : "Clinic Visit";
                const isExpanded = expandedId === appt.id;

                return (
                  <div key={appt.id} className="rounded-3xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-100/80 group">
                    <div className="flex flex-col sm:flex-row sm:items-stretch">
                      <div className={`flex sm:flex-col items-center justify-center gap-2 sm:gap-0.5 shrink-0 sm:w-[88px] py-3 sm:py-4 px-4 sm:px-0 bg-gradient-to-br ${accent} relative`}>
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent)]" />
                        <div className="relative z-10 flex sm:flex-col items-center sm:text-center gap-2 sm:gap-0">
                          <span className="text-[11px] font-bold text-white/80">{getDayAbbr(appt.appointment_date)}</span>
                          <span className="text-2xl sm:text-4xl font-black text-white leading-none">{getDayNum(appt.appointment_date)}</span>
                          <span className="text-[11px] font-bold text-white/80">{getMonthAbbr(appt.appointment_date)}</span>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col xs:flex-row items-start xs:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-slate-100 shadow-sm">
                          <DoctorAvatar appointment={appt} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">Dr. {doctorName}</h3>
                            <span className={`flex items-center gap-1.5 rounded-full px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold whitespace-nowrap ${statusCls}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{statusLabel}
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs font-semibold text-blue-500 mb-2 truncate">{specialization}</p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                            <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 bg-slate-50 rounded-lg px-2 sm:px-2.5 py-1">
                              <FaClock className="text-blue-400 text-[9px]" />
                              <span className="font-semibold">{formatTime(appt.start_time)}</span>
                            </span>
                            <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 bg-slate-50 rounded-lg px-2 sm:px-2.5 py-1">
                              {isVideoConsultation(appt) ? <FaVideo className="text-indigo-400 text-[9px]" /> : <FaMapMarkerAlt className="text-emerald-400 text-[9px]" />}
                              <span className="font-semibold">{consultType}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex w-full xs:w-auto shrink-0 flex-col items-start xs:items-end gap-2">
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {showVideo && (
                              <button onClick={() => joinable ? handleJoinMeeting(appt) : undefined} disabled={!joinable || isJoining}
                                title={joinable ? "Click to join" : "Available 10 min before"}
                                className={`flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition-all shadow-sm ${joinable && !isJoining
                                  ? "cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 active:scale-95 shadow-blue-200"
                                  : "cursor-not-allowed bg-slate-100 text-slate-400"}`}>
                                {isJoining ? <><FaSpinner className="animate-spin" />Joining…</> : <><FaPlay className="text-[8px]" />Join Call</>}
                              </button>
                            )}
                            {isConfirmed && (
                              <button onClick={() => handleReschedule(appt)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-sm">
                                <FaRedoAlt className="text-[8px]" />Reschedule
                              </button>
                            )}
                            {isConfirmed && (
                              <button onClick={() => setCancelModal(appt)} className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-red-500 hover:bg-red-100 transition-all cursor-pointer shadow-sm">
                                <FaTimesCircle className="text-[8px]" />Cancel
                              </button>
                            )}
                            {canReview && (
                              <button onClick={() => setReviewModal(appt)} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white hover:from-amber-500 hover:to-orange-600 active:scale-95 transition-all cursor-pointer shadow-sm">
                                <FaStar className="text-[8px]" />Review
                              </button>
                            )}
                            {appt.review_given && (
                              <span className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-100 px-3 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-emerald-600">
                                <FaCheckCircle className="text-[8px]" />Reviewed
                              </span>
                            )}
                            {isCompleted && !isMissed && !canReview && !appt.review_given && (
                              <span className="flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-100 px-3 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-blue-600">
                                <FaCheckCircle className="text-[8px]" />Completed
                              </span>
                            )}
                          </div>
                          <button onClick={() => setExpandedId(isExpanded ? null : appt.id)} className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-blue-500 hover:text-blue-700 cursor-pointer transition-colors group-hover:underline">
                            {isExpanded ? "Hide details" : "View details"}
                            {isExpanded ? <FaChevronUp className="text-[8px]" /> : <FaChevronDown className="text-[8px]" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/30 px-4 sm:px-6 py-4 sm:py-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                          {[
                            { label: "Date",   value: formatDate(appt.appointment_date) },
                            { label: "Time",   value: `${formatTime(appt.start_time)} – ${formatTime(appt.end_time)}` },
                            { label: "Type",   value: consultType },
                            { label: "Status", value: statusLabel },
                          ].map((item, i) => (
                            <div key={i} className="bg-white rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm border border-slate-100">
                              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 sm:mb-1">{item.label}</p>
                              <p className="text-xs sm:text-sm font-extrabold text-slate-800 break-words">{item.value}</p>
                            </div>
                          ))}
                        </div>

                        {isCancelled && !isMissed && (
                          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1.5">
                              <p className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-red-500"><FaTimesCircle />Appointment cancelled. Please choose another slot.</p>
                              <p className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-emerald-600"><FaCheckCircle />Refund will be processed within 3–5 business days.</p>
                            </div>
                            <button onClick={() => handleReschedule(appt)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 sm:px-5 py-2.5 text-xs font-extrabold text-white hover:from-blue-600 hover:to-indigo-700 active:scale-95 transition-all cursor-pointer shadow-sm self-start sm:self-auto">
                              <FaRedoAlt />Reschedule Now
                            </button>
                          </div>
                        )}

                        {isMissed && (
                          <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1.5">
                              <p className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-orange-500"><FaVideo />You missed this appointment slot.</p>
                              <p className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-emerald-600"><FaCheckCircle />Book a new slot to continue your care.</p>
                            </div>
                            <button onClick={() => handleReschedule(appt)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 px-4 sm:px-5 py-2.5 text-xs font-extrabold text-white hover:from-orange-500 hover:to-amber-600 active:scale-95 transition-all cursor-pointer shadow-sm self-start sm:self-auto">
                              <FaRedoAlt />Reschedule Now
                            </button>
                          </div>
                        )}

                        {showVideo && !joinable && (
                          <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 sm:px-4 py-2.5">
                            <FaVideo className="text-blue-400 text-xs shrink-0" />
                            <p className="text-[11px] sm:text-xs text-blue-600 font-semibold">Video session becomes available 10 minutes before your appointment time.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!loading && totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onChange={handlePageChange} />
            )}
            {!loading && totalRecords > 0 && (
              <p className="mt-3 text-center text-[11px] sm:text-xs font-medium text-slate-400">
                Showing {rangeStart}–{rangeEnd} of {totalRecords} appointments
              </p>
            )}
          </div>
          <div className="hidden xl:flex xl:flex-col xl:shrink-0 gap-3" style={{ width: "240px", position: "sticky", top: "100px", maxHeight: "calc(100vh - 120px)", overflowY: "auto", scrollbarWidth: "none" }}>
            <div className="rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-4 shadow-lg overflow-hidden relative shrink-0">
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
              <div className="absolute -bottom-3 -left-3 w-12 h-12 rounded-full bg-white/10" />
              <div className="relative z-10 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shadow-inner"><FaShieldAlt className="text-white text-sm" /></div>
                  <div>
                    <span className="text-white/60 text-[9px] font-bold uppercase tracking-widest block">Health Guard</span>
                    <span className="text-white text-[11px] font-bold">Active Protection</span>
                  </div>
                </div>
                <h4 className="text-white font-extrabold text-sm leading-snug mb-1.5">Stay Healthy,<br />Stay Happy</h4>
                <p className="text-white/70 text-[11px] leading-relaxed mb-3">Book regular check-ups and stay ahead of your health with trusted specialists.</p>
                <button onClick={() => navigate("/doctors")} className="w-full rounded-xl bg-white text-blue-600 text-xs font-extrabold py-2.5 hover:bg-blue-50 transition-all cursor-pointer shadow-lg">Book Now →</button>
              </div>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-4 shadow-sm overflow-hidden relative shrink-0">
              <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full bg-amber-100/50" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center"><FaLightbulb className="text-amber-500 text-xs" /></div>
                  <span className="text-amber-600 text-[10px] font-extrabold uppercase tracking-widest">Health Tip of the Day</span>
                </div>
                <h4 className="text-slate-800 font-extrabold text-sm mb-1.5">Get enough sleep</h4>
                <div className="flex items-end gap-2">
                  <p className="text-slate-500 text-[11px] leading-relaxed flex-1">A good night's sleep improves your mood, boosts immunity and keeps your heart healthy.</p>
                  <img src={sleepImg} alt="Sleep" className="w-16 h-16 object-contain shrink-0 drop-shadow-sm" />
                </div>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden relative shadow-sm shrink-0"
              style={{ backgroundImage: `url(${greenBg})`, backgroundSize: "cover", backgroundPosition: "center", minHeight: "160px" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-teal-900/60 to-teal-950/70 rounded-3xl" />
              <div className="relative z-10 p-4 flex flex-col" style={{ minHeight: "160px" }}>
                <h4 className="text-white font-extrabold text-sm leading-snug mb-1.5">Need a Second Opinion?</h4>
                <p className="text-white/75 text-[11px] leading-relaxed mb-2">Consult top specialists and make confident health decisions.</p>
                <div className="flex items-end justify-between gap-2 mt-auto">
                  <button onClick={() => navigate("/doctors")} className="rounded-xl bg-white text-teal-700 text-[11px] font-extrabold px-3 py-2 hover:bg-teal-50 transition-all cursor-pointer shadow-sm">Consult Now →</button>
                  <img src={doctorImage} alt="Doctor" className="w-16 h-16 object-contain drop-shadow-xl" />
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-white border border-slate-100 p-4 shadow-sm overflow-hidden relative shrink-0">
              <div className="absolute top-0 right-0 w-14 h-14 rounded-bl-full bg-pink-50/80" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center"><span className="text-sm">🩺</span></div>
                  <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Support</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <h4 className="text-slate-800 font-extrabold text-sm mb-1">We Care For You</h4>
                    <p className="text-slate-500 text-[11px] leading-relaxed">Your health is our priority. Our team is always here to help you.</p>
                  </div>
                  <img src={micsetImg} alt="Support" className="w-16 h-16 object-contain shrink-0 drop-shadow-sm" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      {activeCall && (
        <JitsiMeetRoom meetingRoom={activeCall.meetingRoom} displayName={authUser?.name ?? "Patient"}
          titleName={`Dr. ${activeCall.doctorName}`} avatarName={activeCall.doctorName} onClose={handleCallEnd} />
      )}
      {cancelModal && (
        <CancelModal doctorName={cancelModal.doctor?.name ?? "Doctor"} loading={cancelLoading}
          onConfirm={handleCancelConfirm} onClose={() => setCancelModal(null)} />
      )}
      {reviewModal && (
        <ReviewModal appointmentId={reviewModal.id ?? (reviewModal as any).appointment_id} doctorName={reviewModal.doctor?.name ?? "Doctor"}
          onClose={() => setReviewModal(null)}
          onSubmitted={() => {
            setAppointments(prev => prev.map(a => a.id === reviewModal!.id ? { ...a, review_given: true } : a));
            setReviewModal(null);
          }} />
      )}
    </div>
  );
};

export default MyAppointments;