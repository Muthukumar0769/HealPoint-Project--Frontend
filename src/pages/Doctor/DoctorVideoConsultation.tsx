import { useEffect, useRef, useState } from "react";
import {
  FaVideo, FaUser, FaCalendarAlt, FaPlay, FaCheckCircle, FaSpinner, FaExclamationTriangle,
  FaRedo, FaStethoscope, FaVenusMars, FaClock, FaTimesCircle, FaBan, FaChevronLeft, FaChevronRight,
  FaHospital
} from "react-icons/fa";
import { DoctorSidebar } from "./DoctorSidebar";
import { JitsiMeetRoom } from "../../utils/JitsimeetRoom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  PAGE_SIZE, fetchDoctorVideoAppointments, fetchDoctorVideoTabCounts, joinDoctorVideoMeeting,
  completeDoctorVideoConsultation, cancelDoctorVideoAppointment, setActiveMode, setActiveTab,
  setCurrentPage, setCancelModal, setActiveCall, clearToast, clearUnseenIds, markDoctorAppointmentNoShow, forceOngoing
} from "../../store/slices/DoctorVideoSlice";
import type { VideoAppointment as Appointment, TabKey, ConsultationMode } from "../../types/doctor";
import { clearVideoNotification, clearClinicNotification, setVideoNotification, setClinicNotification } from "../../store/slices/NotificationSlice";
import usePageTitle from "../../hooks/usePageTitle";

const SEEN_VIDEO_KEY = "seen_video_ids";
const SEEN_CLINIC_KEY = "seen_clinic_ids";

const MODE_TABS: { key: ConsultationMode; label: string; icon: React.ReactNode }[] = [
  { key: "video", label: "Video Call", icon: <FaVideo /> },
  { key: "clinic", label: "Clinic Visit", icon: <FaHospital /> },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "missed", label: "Missed" },
  { key: "cancelled", label: "Cancelled" },
];

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const formatTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

const isMissed = (a: Appointment) => {
  const s = String(a.consultation_status || "").toLowerCase();
  return s === "no_show" || s === "missed";
};

const canJoin = (a: Appointment) => {
  if (String(a.consultation_status).toLowerCase() === "ongoing") return true;
  if (a.status !== "confirmed") return false;
  if (
    String(a.consultation_status).toLowerCase() === "completed" ||
    String(a.status).toLowerCase() === "completed" ||
    isMissed(a)
  ) return false;
  const dateOnly = a.appointment_date.split("T")[0];
  const start = new Date(`${dateOnly}T${a.start_time}`);
  const end = new Date(`${dateOnly}T${a.end_time}`);
  if (isNaN(start.getTime())) return false;
  const now = new Date();
  return now >= new Date(start.getTime() - 10 * 60 * 1000) && now <= end;
};

const getStatusInfo = (a: Appointment) => {
  if (a.status === "cancelled") return { label: "Cancelled", dot: "bg-red-400", className: "bg-red-50 text-red-600 border border-red-200" };
  if (String(a.consultation_status).toLowerCase() === "ongoing") return { label: "In Progress", dot: "bg-emerald-400", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
  if (String(a.consultation_status).toLowerCase() === "completed" || String(a.status).toLowerCase() === "completed") return { label: "Completed", dot: "bg-blue-400", className: "bg-blue-50 text-blue-700 border border-blue-200" };
  if (isMissed(a)) return { label: "Missed", dot: "bg-orange-400", className: "bg-orange-50 text-orange-600 border border-orange-200" };
  if (a.status === "confirmed") return { label: "Upcoming", dot: "bg-amber-400", className: "bg-amber-50 text-amber-700 border border-amber-200" };
  return { label: a.status, dot: "bg-slate-400", className: "bg-slate-50 text-slate-600 border border-slate-200" };
};

const getAppointmentType = (a: any) =>
  String(a.consultation_type || a.consultationType || a.appointment_type || a.appointmentType || a.type || "")
    .toLowerCase().replace(/[_-]/g, " ").trim();

const isClinicType = (a: Appointment) => {
  const type = getAppointmentType(a);
  return type.includes("clinic") || type.includes("visit") || type.includes("offline") ||
    type.includes("hospital") || type.includes("in person");
};

const isVideoType = (a: Appointment) => {
  const type = getAppointmentType(a);
  return type.includes("video") || type.includes("online") || type.includes("virtual") || !!a.meeting_room;
};

export const DoctorVideoConsultation = () => {
  usePageTitle("Consultations");
  const dispatch = useAppDispatch();
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const previousPageRef = useRef(1);
  const [slideDirection, setSlideDirection] = useState<"right" | "left">("right");
  const isOnPage = useRef(false);
  const [ongoingId, setOngoingId] = useState<number | null>(null);

  const { appointments, loading, error, totalRecords, totalPages, currentPage,
    activeTab, activeMode, tabCounts, actionLoading, cancelModal, activeCall, toast } = useAppSelector((s) => s.doctorVideo);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    dispatch(fetchDoctorVideoAppointments({ tab: activeTab, page: currentPage, mode: activeMode, silent: false }));
  }, [dispatch, activeTab, currentPage, activeMode]);

  useEffect(() => {
    dispatch(fetchDoctorVideoTabCounts({ mode: activeMode }));
  }, [dispatch, activeMode]);

  useEffect(() => { dispatch(clearUnseenIds()); }, [dispatch]);

  useEffect(() => {
    isOnPage.current = true;
    if (activeMode === "video") dispatch(clearVideoNotification());
    else dispatch(clearClinicNotification());
    return () => { isOnPage.current = false; };
  }, [dispatch, activeMode]);

  useEffect(() => {
    if (appointments.length === 0) return;
    const SEEN_KEY = activeMode === "video" ? SEEN_VIDEO_KEY : SEEN_CLINIC_KEY;
    const filtered = appointments.filter(activeMode === "video" ? isVideoType : isClinicType);
    if (filtered.length === 0) return;
    const currentIds = filtered.map((a) => a.id);
    if (isOnPage.current) {
      localStorage.setItem(SEEN_KEY, JSON.stringify(currentIds));
      if (activeMode === "video") dispatch(clearVideoNotification());
      else dispatch(clearClinicNotification());
    } else {
      const raw = localStorage.getItem(SEEN_KEY);
      if (raw === null) {
        localStorage.setItem(SEEN_KEY, JSON.stringify(currentIds));
      } else {
        const seenIds: number[] = JSON.parse(raw);
        const hasNew = currentIds.some((id) => !seenIds.includes(id));
        if (hasNew) {
          if (activeMode === "video") dispatch(setVideoNotification());
          else dispatch(setClinicNotification());
        }
      }
    }
  }, [appointments, activeMode, dispatch]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dispatch(clearToast()), 3000);
    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchDoctorVideoAppointments({ tab: activeTab, page: currentPage, mode: activeMode, silent: true }));
    }, 15000);
    return () => clearInterval(interval);
  }, [dispatch, activeTab, currentPage, activeMode]);

  const refresh = () => {
    dispatch(fetchDoctorVideoAppointments({ tab: activeTab, page: currentPage, mode: activeMode, silent: false }));
    dispatch(fetchDoctorVideoTabCounts({ mode: activeMode }));
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setSlideDirection(page > currentPage ? "right" : "left");
    previousPageRef.current = currentPage;
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => dispatch(setCurrentPage(page)), 180);
  };

  const handleTabChange = (tab: TabKey) => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    dispatch(setActiveTab(tab));
  };

  const handleModeChange = (mode: ConsultationMode) => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    dispatch(setActiveMode(mode));
  };

  const todayCount = appointments.filter((a) => a.appointment_date.split("T")[0] === today).length;
  const rangeStart = totalRecords === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalRecords);

  return (
    <div className="relative flex min-h-screen w-full max-w-full overflow-x-hidden bg-[#f0f4fb]">
      <DoctorSidebar />
      <main className="relative z-0 w-full max-w-full flex-1 min-w-0 overflow-x-hidden px-3 pb-6 pt-16 sm:px-4 sm:pt-20 lg:px-6 lg:py-6">
        <div className="mx-auto w-full max-w-xs xs:max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
          <div className="mb-4 sm:mb-5">
            <h1 className="text-lg font-extrabold text-slate-800 sm:text-xl lg:text-2xl">Consultations</h1>
            <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">Manage video calls and clinic visits in one place.</p>
          </div>
          <ModeSlider activeMode={activeMode} onChange={handleModeChange} />
          <div className="mb-4 grid grid-cols-3 gap-2 sm:mb-5 sm:gap-3">
            <StatCard icon={activeMode === "video" ? <FaVideo /> : <FaHospital />} title={activeMode === "video" ? "Today's Calls" : "Today's Visits"}
              value={String(todayCount)} iconClass="bg-blue-50 text-blue-600" valueClass="text-blue-600" />
            <StatCard icon={<FaCheckCircle />} title="Completed" value={String(tabCounts.completed ?? 0)} iconClass="bg-emerald-50 text-emerald-600" valueClass="text-emerald-600" />
            <StatCard icon={<FaCalendarAlt />} title="Upcoming" value={String(tabCounts.upcoming ?? 0)} iconClass="bg-amber-50 text-amber-600" valueClass="text-amber-600" />
          </div>
          <div ref={listTopRef} className="scroll-mt-20 rounded-xl bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4 lg:p-5">
            <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
              <h2 className="text-sm font-extrabold text-slate-800 sm:text-base lg:text-lg">
                {activeMode === "video" ? "Video Consultations" : "Clinic Visits"}
              </h2>
              <button className="flex cursor-pointer items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-colors sm:gap-1.5 sm:px-3 sm:text-xs">
                <FaRedo className="text-[9px] sm:text-[10px]" />
                <span className="hidden xs:inline">Refresh</span>
                <span className="xs:hidden">↻</span>
              </button>
            </div>

            <StatusTabBar activeTab={activeTab} counts={tabCounts} onChange={handleTabChange} />

            {loading && <LoadingState />}
            {!loading && error && <ErrorState message={error} onRetry={refresh} />}
            {!loading && !error && appointments.length === 0 && <EmptyState mode={activeMode} tab={activeTab} />}
            {!loading && !error && appointments.length > 0 && (
              <>
                <div key={`${activeMode}-${activeTab}-${currentPage}`} className={`flex flex-col gap-2 sm:gap-3 ${slideDirection === "right" ? "animate-slideRight" : "animate-slideLeft"}`}>
                  {appointments.map((a) => {
                    const appt = ongoingId === a.id ? { ...a, consultation_status: "ongoing" } : a;
                    return (
                      <AppointmentCard
                        key={a.id}
                        mode={activeMode}
                        appt={appt}
                        actionLoading={actionLoading}
                        isToday={a.appointment_date.split("T")[0] === today}
                        onJoin={(item) => dispatch(joinDoctorVideoMeeting(item))}
                        onComplete={async (item) => {
                          setOngoingId(null);
                          await dispatch(completeDoctorVideoConsultation(item));
                          refresh();
                        }}
                        onNoShow={async (item) => { await dispatch(markDoctorAppointmentNoShow(item)); refresh(); }}
                        onCancel={() => dispatch(setCancelModal(a))} />
                    );
                  })}
                </div>

                <Pagination currentPage={currentPage} totalPages={totalPages} onChange={handlePageChange} />
                {totalRecords > 0 && (
                  <p className="mt-2 text-center text-[10px] text-slate-400 sm:text-xs">
                    Showing {rangeStart}–{rangeEnd} of {totalRecords} appointments
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      {toast && (
        <div className={`fixed right-3 top-16 z-[9999] flex items-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-bold text-white shadow-xl animate-toast-slide sm:right-5 sm:top-20 sm:gap-2.5 sm:px-4 sm:py-3 sm:text-xs ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.type === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span>{toast.msg}</span>
        </div>
      )}
      {cancelModal && (
        <CancelConfirmModal
          patientName={cancelModal.patient?.name ?? "this patient"}
          loading={!!actionLoading[cancelModal.id]}
          onConfirm={async () => { await dispatch(cancelDoctorVideoAppointment(cancelModal)); refresh(); }}
          onCancel={() => dispatch(setCancelModal(null))}
        />
      )}
      {activeCall && (
        <JitsiMeetRoom
          meetingRoom={activeCall.meetingRoom}
          displayName="Doctor"
          titleName={activeCall.appt.patient?.name ?? "Patient"}
          avatarName={activeCall.appt.patient?.name ?? "Patient"}
          onClose={() => {
            const apptId = activeCall.appt.id;
            dispatch(forceOngoing(apptId));
            dispatch(setActiveCall(null));
            dispatch(fetchDoctorVideoAppointments({ tab: activeTab, page: currentPage, mode: activeMode, silent: true }));
          }}
          onHangup={async () => {
            setOngoingId(null);
            dispatch(setActiveCall(null));
            await dispatch(completeDoctorVideoConsultation(activeCall.appt));
            refresh();
          }}
        />
      )}

      <style>{`
        @keyframes slideRight { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideLeft  { from { opacity:0; transform:translateX(-30px);} to { opacity:1; transform:translateX(0); } }
        .animate-slideRight { animation: slideRight 0.3s ease; }
        .animate-slideLeft  { animation: slideLeft  0.3s ease; }
        @keyframes toastSlide { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }
        .animate-toast-slide { animation: toastSlide 0.3s ease; }
        @media (min-width: 480px) { .xs\\:inline { display: inline; } .xs\\:hidden { display: none; } }
      `}</style>
    </div>
  );
};

const ModeSlider = ({ activeMode, onChange }: {
  activeMode: ConsultationMode;
  onChange: (mode: ConsultationMode) => void;
}) => {
  const index = activeMode === "video" ? 0 : 1;
  const notifications = useAppSelector((state) => state.doctorNotifications);
  return (
    <div className="mb-4 w-full max-w-[260px] rounded-xl bg-white p-1 shadow-sm sm:mb-5 sm:max-w-xs sm:p-1.5">
      <div className="relative grid grid-cols-2 rounded-lg bg-slate-100 p-1">
        <span className="absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-md bg-blue-600 shadow transition-all duration-300 ease-in-out"
          style={{ transform: `translateX(${index * 100}%)` }} />
        {MODE_TABS.map((tab) => (
          <button key={tab.key} onClick={() => onChange(tab.key)} className={`relative z-10 flex cursor-pointer items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-bold transition-colors duration-300 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs ${activeMode === tab.key ? "text-white" : "text-slate-500 hover:text-slate-700"}`}>
            {tab.icon}
            <span className="relative flex items-center gap-1 sm:gap-1.5">
              {tab.label}
              {tab.key === "video" && notifications.videoConsultations.video && (
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse sm:h-2 sm:w-2" />
              )}
              {tab.key === "clinic" && notifications.videoConsultations.clinic && (
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse sm:h-2 sm:w-2" />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const StatusTabBar = ({ activeTab, counts, onChange }: {
  activeTab: TabKey;
  counts: Partial<Record<TabKey, number>>;
  onChange: (tab: TabKey) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const activeEl = containerRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${activeTab}"]`);
    if (!activeEl || !indicatorRef.current) return;
    indicatorRef.current.style.width = `${activeEl.offsetWidth}px`;
    indicatorRef.current.style.left = `${activeEl.offsetLeft}px`;
  }, [activeTab, counts]);

  return (
    <div className="relative mb-3 sm:mb-4">
      <div ref={containerRef} className="relative flex gap-0.5 overflow-x-auto rounded-xl bg-slate-100 p-1 scrollbar-hide sm:gap-1">
        <span ref={indicatorRef} className="absolute top-1 h-[calc(100%-8px)] rounded-lg bg-white shadow-sm transition-all duration-300 ease-in-out" />
        {TABS.map(({ key, label }) => (
          <button key={key} data-tab={key} onClick={() => onChange(key)} className={`relative z-10 flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-bold transition-colors duration-200 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs ${activeTab === key ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
            {label}
            {counts[key] !== undefined && (
              <span className={`rounded-full px-1 py-0.5 text-[9px] font-extrabold sm:px-1.5 sm:text-[10px] ${activeTab === key ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-500"}`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const AppointmentCard = ({ mode, appt, actionLoading, isToday, onJoin, onComplete, onCancel, onNoShow }: {
  mode: ConsultationMode;
  appt: Appointment;
  actionLoading: Record<number, string>;
  isToday: boolean;
  onJoin: (a: Appointment) => void;
  onComplete: (a: Appointment) => void;
  onNoShow: (a: Appointment) => void;
  onCancel: () => void;
}) => {
  const { label, dot, className } = getStatusInfo(appt);
  const isOngoing = String(appt.consultation_status).toLowerCase() === "ongoing";
  const isFullyCompleted =
    (String(appt.consultation_status).toLowerCase() === "completed" ||
      String(appt.status).toLowerCase() === "completed") && !isOngoing;
  const isCancelled =
    String(appt.status).toLowerCase() === "cancelled" ||
    String(appt.status).toLowerCase() === "canceled";
  const isMissedAppt =
    !isOngoing && !isFullyCompleted &&
    (String(appt.consultation_status).toLowerCase() === "no_show" ||
      String(appt.consultation_status).toLowerCase() === "missed");

  const joinable = canJoin(appt);
  const busy = !!actionLoading[appt.id];
  const canCancel = appt.status === "confirmed" && !isOngoing && !isFullyCompleted && !isCancelled && !isMissedAppt;
  const initials = appt.patient?.name ? appt.patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "PT";

  return (
    <div className={`rounded-xl border p-3 transition-all duration-200 hover:shadow-md lg:p-4
      ${isOngoing ? "border-emerald-200 bg-emerald-50/40 border-l-4 border-l-emerald-500" : isCancelled
        ? "border-red-100 bg-red-50/20 border-l-4 border-l-red-400 opacity-80" : isMissedAppt
          ? "border-orange-100 bg-orange-50/20 border-l-4 border-l-orange-400 opacity-85" : "border-slate-100 bg-white border-l-4 border-l-blue-600"}`}>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-extrabold text-blue-700 sm:flex sm:h-10 sm:w-10 sm:text-sm">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-extrabold text-blue-700 sm:hidden">
              {initials}
            </div>
            <span className="text-[13px] font-extrabold text-slate-800 sm:text-sm">{appt.patient?.name ?? "Unknown Patient"}</span>
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold sm:text-[10px] ${className}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{label}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold sm:text-[10px] ${mode === "video" ? "bg-blue-50 text-blue-600 border border-blue-200" : "bg-purple-50 text-purple-600 border border-purple-200"}`}>
              {mode === "video" ? "Video" : "Clinic"}
            </span>
            {isToday && !isFullyCompleted && !isCancelled && !isMissedAppt && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-600 sm:text-[10px]">TODAY</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <InfoChip icon={<FaCalendarAlt className="text-[9px] text-slate-400 sm:text-[10px]" />} text={formatDate(appt.appointment_date)} />
            <InfoChip icon={<FaClock className="text-[9px] text-slate-400 sm:text-[10px]" />} text={`${formatTime(appt.start_time)} – ${formatTime(appt.end_time)}`} />
            {appt.patient?.gender && <InfoChip icon={<FaVenusMars className="text-[9px] text-slate-400 sm:text-[10px]" />} text={appt.patient.gender} />}
            {appt.patient?.email && (
              <InfoChip icon={<FaUser className="text-[9px] text-slate-400 sm:text-[10px]" />} text={appt.patient.email} />
            )}
          </div>

          {appt.reason && (
            <div className="mt-1.5 flex items-start gap-1">
              <FaStethoscope className="mt-0.5 shrink-0 text-[9px] text-slate-400 sm:text-[10px]" />
              <span className="text-[11px] text-slate-500 sm:text-xs">{appt.reason}</span>
            </div>
          )}
        </div>
        <div className="flex w-full shrink-0 flex-row flex-wrap gap-1.5 sm:w-auto sm:flex-col sm:items-stretch sm:gap-2">
          {mode === "video" && !isFullyCompleted && !isCancelled && !isMissedAppt && (
            <>
              <button disabled={!joinable || busy} onClick={() => onJoin(appt)}
                className={`flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg px-2.5 text-[11px] font-bold transition-all sm:h-9 sm:gap-1.5 sm:px-3 sm:text-xs
                  ${joinable && !busy ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95" : "cursor-not-allowed bg-slate-100 text-slate-400"}`}>
                {busy && actionLoading[appt.id] === "joining" ? <><FaSpinner className="animate-spin" /><span>Joining…</span></> : <><FaPlay className="text-[8px] sm:text-[9px]" /><span>{isOngoing ? "Rejoin" : "Join"}</span></>}
              </button>
              {isOngoing && (
                <button disabled={busy} onClick={() => onComplete(appt)} className="flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg bg-emerald-50 px-2.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 active:scale-95 disabled:opacity-60 transition-all sm:h-9 sm:gap-1.5 sm:px-3 sm:text-xs">
                  {actionLoading[appt.id] === "completing" ? <><FaSpinner className="animate-spin" /><span>Ending…</span></> : <><FaCheckCircle /><span>End Call</span></>}
                </button>
              )}
            </>
          )}

          {mode === "clinic" && !isFullyCompleted && !isCancelled && !isMissedAppt && (
            <>
              <button disabled={busy} onClick={() => onComplete(appt)} className="flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg bg-emerald-50 px-2.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 active:scale-95 disabled:opacity-60 transition-all sm:h-9 sm:gap-1.5 sm:px-3 sm:text-xs">
                {actionLoading[appt.id] === "completing" ? <><FaSpinner className="animate-spin" /><span>Completing…</span></> : <><FaCheckCircle /><span>Completed</span></>}
              </button>
              <button disabled={busy} onClick={() => onNoShow(appt)} className="flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg bg-orange-50 px-2.5 text-[11px] font-bold text-orange-600 hover:bg-orange-100 active:scale-95 disabled:opacity-60 transition-all sm:h-9 sm:gap-1.5 sm:px-3 sm:text-xs">
                {actionLoading[appt.id] === "no-show" ? <><FaSpinner className="animate-spin" /><span>Marking…</span></> : <><FaExclamationTriangle /><span>No Show</span></>
                }
              </button>
            </>
          )}

          {canCancel && (
            <button disabled={busy} onClick={onCancel} className="flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg bg-red-50 px-2.5 text-[11px] font-bold text-red-500 hover:bg-red-100 active:scale-95 disabled:opacity-60 transition-all sm:h-9 sm:gap-1.5 sm:px-3 sm:text-xs">
              {busy && actionLoading[appt.id] === "cancelling"
                ? <><FaSpinner className="animate-spin" /><span>Cancelling…</span></>
                : <><FaTimesCircle /><span>Cancel</span></>
              }
            </button>
          )}

          {isFullyCompleted && (
            <div className="flex h-8 items-center justify-center gap-1 rounded-lg bg-blue-50 px-2.5 text-[11px] font-bold text-blue-600 sm:h-9 sm:gap-1.5 sm:px-3 sm:text-xs">
              <FaCheckCircle /><span>Completed</span>
            </div>
          )}
          {isCancelled && (
            <div className="flex h-8 items-center justify-center gap-1 rounded-lg bg-red-50 px-2.5 text-[11px] font-bold text-red-400 sm:h-9 sm:gap-1.5 sm:px-3 sm:text-xs">
              <FaBan /><span>Cancelled</span>
            </div>
          )}
          {isMissedAppt && !isCancelled && (
            <div className="flex h-8 items-center justify-center gap-1 rounded-lg bg-orange-50 px-2.5 text-[11px] font-bold text-orange-500 sm:h-9 sm:gap-1.5 sm:px-3 sm:text-xs">
              <FaExclamationTriangle /><span>Missed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Pagination = ({ currentPage, totalPages, onChange }: {
  currentPage: number; totalPages: number; onChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;
  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("…");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }
  return (
    <div className="mt-4 flex items-center justify-center gap-1 flex-wrap sm:mt-5 sm:gap-1.5">
      <button onClick={() => onChange(currentPage - 1)} disabled={currentPage === 1} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors sm:h-8 sm:w-8">
        <FaChevronLeft className="text-[10px] sm:text-xs" />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="flex h-7 w-7 items-center justify-center text-slate-400 text-xs sm:h-8 sm:w-8 sm:text-sm">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p as number)} className={`h-7 w-7 cursor-pointer rounded-lg text-[11px] font-bold transition-all duration-200 sm:h-8 sm:w-8 sm:text-xs ${currentPage === p ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            {p}
          </button>
        )
      )}
      <button onClick={() => onChange(currentPage + 1)} disabled={currentPage === totalPages}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors sm:h-8 sm:w-8">
        <FaChevronRight className="text-[10px] sm:text-xs" />
      </button>
    </div>
  );
};

const CancelConfirmModal = ({ patientName, onConfirm, onCancel, loading }: {
  patientName: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-[320px] rounded-2xl bg-white p-5 shadow-2xl sm:max-w-sm sm:p-6">
      <div className="mb-4 flex flex-col items-center gap-3 text-center sm:mb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-lg text-red-500 sm:h-12 sm:w-12 sm:text-xl">
          <FaBan />
        </div>
        <h3 className="text-sm font-extrabold text-slate-900 sm:text-base">Cancel Appointment?</h3>
        <p className="text-xs text-slate-500 sm:text-sm">
          Are you sure you want to cancel appointment with{" "}
          <span className="font-bold text-slate-700">{patientName}</span>?
        </p>
      </div>
      <div className="flex gap-2 sm:gap-3">
        <button onClick={onCancel} disabled={loading} className="h-9 flex-1 cursor-pointer rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors sm:h-10 sm:text-sm">
          Keep It
        </button>
        <button onClick={onConfirm} disabled={loading} className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-red-500 text-xs font-bold text-white hover:bg-red-600 transition-colors sm:h-10 sm:text-sm">
          {loading ? <><FaSpinner className="animate-spin" />Cancelling…</> : <><FaTimesCircle />Yes, Cancel</>}
        </button>
      </div>
    </div>
  </div>
);

const StatCard = ({ icon, title, value, iconClass, valueClass }: {
  icon: React.ReactNode; title: string; value: string; iconClass: string; valueClass: string;
}) => (
  <div className="rounded-xl bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 sm:p-3 lg:p-4">
    <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs sm:h-8 sm:w-8 sm:text-sm lg:h-9 lg:w-9 ${iconClass}`}>
      {icon}
    </div>
    <p className="mt-2 text-[9px] font-bold uppercase tracking-wide text-slate-400 sm:text-[10px]">{title}</p>
    <p className={`mt-0.5 text-xl font-extrabold sm:text-2xl lg:text-3xl ${valueClass}`}>{value}</p>
  </div>
);

const InfoChip = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600 sm:px-2 sm:py-1 sm:text-[11px]">
    {icon}{text}
  </span>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-400 sm:py-12">
    <FaSpinner className="animate-spin text-xl text-blue-500 sm:text-2xl" />
    <p className="text-[11px] font-semibold sm:text-xs">Loading consultations…</p>
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-10 sm:py-12">
    <FaExclamationTriangle className="text-xl text-red-400 sm:text-2xl" />
    <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">{message}</p>
    <button onClick={onRetry} className="cursor-pointer rounded-lg bg-blue-600 px-4 py-1.5 text-[11px] font-bold text-white hover:bg-blue-700 transition-colors sm:px-5 sm:py-2 sm:text-xs">
      Retry
    </button>
  </div>
);

const EmptyState = ({ mode, tab }: { mode: ConsultationMode; tab: TabKey }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400 sm:py-12">
    {mode === "video" ? <FaVideo className="mb-1 text-2xl sm:text-3xl" /> : <FaHospital className="mb-1 text-2xl sm:text-3xl" />}
    <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">
      No {tab === "all" ? "" : tab} {mode === "video" ? "video consultations" : "clinic visits"} found
    </p>
  </div>
);

export default DoctorVideoConsultation;