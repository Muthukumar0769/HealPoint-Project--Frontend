import { useEffect, useRef, useState } from "react";
import {
  FaVideo, FaUser, FaCalendarAlt, FaPlay, FaCheckCircle, FaSpinner, FaExclamationTriangle,
  FaRedo, FaChevronDown, FaStethoscope, FaVenusMars, FaClock, FaTimesCircle, FaBan, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";
import { DoctorSidebar } from "./DoctorSidebar";
import { JitsiMeetRoom } from "../../utils/JitsimeetRoom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  DEFAULT_PAGE_SIZE, fetchDoctorVideoAppointments, fetchDoctorVideoTabCounts, joinDoctorVideoMeeting,
  completeDoctorVideoConsultation, cancelDoctorVideoAppointment, setActiveTab,
  setCurrentPage, setPageSize, setCancelModal, setActiveCall, clearToast, clearUnseenIds, markDoctorAppointmentNoShow, forceOngoing
} from "../../store/slices/DoctorVideoSlice";
import type { VideoAppointment as Appointment, TabKey } from "../../types/doctor";
import { clearVideoNotification, setVideoNotification } from "../../store/slices/NotificationSlice";
import usePageTitle from "../../hooks/usePageTitle";

//------Helper Functions------------

const SEEN_VIDEO_KEY = "seen_video_ids";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "missed", label: "Missed" },
  { key: "cancelled", label: "Cancelled" },
];

const LIMIT_OPTIONS = [5, 10, 20, 50];

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

//----This logic for this function true only the Join button enables----------

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
const EntriesSelector = ({ limit, onLimitChange }: { limit: number; onLimitChange: (v: number) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(p => !p)}
        className="flex h-7 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 sm:h-8 sm:text-xs">         <span>{limit}</span>
        <FaChevronDown className={`text-[8px] text-blue-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-14 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl">
          {LIMIT_OPTIONS.map(opt => (
            <button key={opt} onClick={() => { onLimitChange(opt); setOpen(false); }}
              className={`block w-full px-2.5 py-1.5 text-left text-[10px] font-bold transition sm:text-xs ${opt === limit ? "bg-blue-500 text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"}`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

//-------Main component-------------

export const DoctorVideoConsultation = () => {
  usePageTitle("Video Consultations");
  const dispatch = useAppDispatch();
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const previousPageRef = useRef(1);
  const [slideDirection, setSlideDirection] = useState<"right" | "left">("right");
  const isOnPage = useRef(false);
  const [ongoingId, setOngoingId] = useState<number | null>(null);

  const { appointments, loading, error, totalRecords, totalPages, currentPage,
    activeTab, tabCounts, actionLoading, cancelModal, activeCall, toast, pageSize } = useAppSelector((s) => s.doctorVideo);
  const effectivePageSize = pageSize ?? DEFAULT_PAGE_SIZE;
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    dispatch(fetchDoctorVideoAppointments({
      tab: activeTab,
      page: currentPage,
      pageSize: effectivePageSize,
      mode: "video",
      silent: false,
    }));
  }, [dispatch, activeTab, currentPage, effectivePageSize]);

  useEffect(() => {
    dispatch(fetchDoctorVideoTabCounts({ mode: "video" }));
  }, [dispatch]);

  useEffect(() => { dispatch(clearUnseenIds()); }, [dispatch]);

  useEffect(() => {
    isOnPage.current = true;
    dispatch(clearVideoNotification());
    return () => { isOnPage.current = false; };
  }, [dispatch]);

  useEffect(() => {
    if (appointments.length === 0) return;
    const currentIds = appointments.map((a) => a.id);
    if (isOnPage.current) {
      localStorage.setItem(SEEN_VIDEO_KEY, JSON.stringify(currentIds));
      dispatch(clearVideoNotification());
    } else {
      const raw = localStorage.getItem(SEEN_VIDEO_KEY);
      if (raw === null) {
        localStorage.setItem(SEEN_VIDEO_KEY, JSON.stringify(currentIds));
      } else {
        const seenIds: number[] = JSON.parse(raw);
        const hasNew = currentIds.some((id) => !seenIds.includes(id));
        if (hasNew) dispatch(setVideoNotification());
      }
    }
  }, [appointments, dispatch]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dispatch(clearToast()), 3000);
    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchDoctorVideoAppointments({ tab: activeTab, page: currentPage, pageSize: effectivePageSize, mode: "video", silent: true }));
    }, 15000);
    return () => clearInterval(interval);
  }, [dispatch, activeTab, currentPage, effectivePageSize]);

  const refresh = () => {
    dispatch(fetchDoctorVideoAppointments({ tab: activeTab, page: currentPage, pageSize: effectivePageSize, mode: "video", silent: false }));
    dispatch(fetchDoctorVideoTabCounts({ mode: "video" }));
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

  const handlePageSizeChange = (size: number) => {
    dispatch(setPageSize(size));
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const todayCount = appointments.filter((a) => a.appointment_date.split("T")[0] === today).length;
  const rangeStart = totalRecords === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1;
  const rangeEnd = Math.min(currentPage * effectivePageSize, totalRecords);

  return (
    <div className="flex min-h-screen bg-[#f0f4fb]">
      <DoctorSidebar />
      <main className="min-w-0 flex-1 px-3 pb-7 pt-16 sm:px-4 sm:pt-18 md:px-5 md:pt-20 lg:px-6 xl:px-7">
        <div className="mx-auto w-full max-w-xs xs:max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
          <div className="mb-3 sm:mb-4">
            <h1 className="text-base font-extrabold text-slate-800 sm:text-lg lg:text-xl">Video Consultations</h1>
            <p className="mt-0.5 text-[10px] text-slate-500 sm:text-[11px]">Manage and join your patient video calls.</p>
          </div>
          <div className="mb-3 grid grid-cols-3 gap-2 sm:mb-4 sm:gap-2.5">
            <StatCard icon={<FaVideo />} title="Today's Calls"
              value={String(todayCount)} iconClass="bg-blue-50 text-blue-600" valueClass="text-blue-600" />
            <StatCard icon={<FaCheckCircle />} title="Completed" value={String(tabCounts.completed ?? 0)} iconClass="bg-emerald-50 text-emerald-600" valueClass="text-emerald-600" />
            <StatCard icon={<FaCalendarAlt />} title="Upcoming" value={String(tabCounts.upcoming ?? 0)} iconClass="bg-amber-50 text-amber-600" valueClass="text-amber-600" />
          </div>
          <div ref={listTopRef} className="scroll-mt-20 rounded-xl bg-white p-3 shadow-sm sm:p-4">
            <div className="mb-2.5 flex items-center justify-between gap-2 sm:mb-3">
              <h2 className="text-xs font-extrabold text-slate-800 sm:text-sm lg:text-base">
                Video Consultations
              </h2>
              <button onClick={refresh} className="flex cursor-pointer items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition-colors sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-[11px]">
                <FaRedo className="text-[8px] sm:text-[9px]" />
                <span>Refresh</span>
              </button>
            </div>

            <StatusTabBar activeTab={activeTab} counts={tabCounts} onChange={handleTabChange} />

            {loading && <LoadingState />}
            {!loading && error && <ErrorState message={error} onRetry={refresh} />}
            {!loading && !error && appointments.length === 0 && <EmptyState tab={activeTab} />}
            {!loading && !error && appointments.length > 0 && (
              <>
                <div key={`${activeTab}-${currentPage}`} className={`flex flex-col gap-2 sm:gap-2.5 ${slideDirection === "right" ? "animate-slideRight" : "animate-slideLeft"}`}>
                  {appointments.map((a) => {
                    const appt = ongoingId === a.id ? { ...a, consultation_status: "ongoing" } : a;
                    return (
                      <AppointmentCard
                        key={a.id}
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
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 sm:mt-4">                   <div className="flex items-center gap-1 flex-wrap">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed sm:h-7 sm:w-7">
                    <FaChevronLeft className="text-[9px]" />
                  </button>
                  {(() => {
                    const pages: (number | "…")[] = [];
                    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
                    else {
                      pages.push(1);
                      if (currentPage > 3) pages.push("…");
                      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
                      if (currentPage < totalPages - 2) pages.push("…");
                      pages.push(totalPages);
                    }
                    return pages.map((p, i) =>
                      p === "…" ? (
                        <button key={`e-${i}`} onClick={() => handlePageChange(i === 1 ? Math.max(1, currentPage - 5) : Math.min(totalPages, currentPage + 5))}
                          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-[10px] text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition sm:h-7 sm:w-7">
                          …
                        </button>

                      ) : (
                        <button key={p} onClick={() => handlePageChange(p as number)}
                          className={`h-6 w-6 cursor-pointer rounded-lg text-[10px] font-bold transition sm:h-7 sm:w-7 sm:text-[11px] ${currentPage === p ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                          {p}
                        </button>
                      )
                    );
                  })()}
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed sm:h-7 sm:w-7">
                    <FaChevronRight className="text-[9px]" />
                  </button>
                </div>
                  <div className="flex items-center gap-1.5">
                    <EntriesSelector limit={effectivePageSize} onLimitChange={handlePageSizeChange} />
                    <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap sm:text-[11px]">
                      <span className="font-bold text-blue-600">{rangeStart}–{rangeEnd}</span>
                      &nbsp;of&nbsp;
                      <span className="font-bold text-slate-700">{totalRecords}</span>
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {toast && (
        <div className={`fixed right-3 top-14 z-[9999] flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-white shadow-xl animate-toast-slide sm:right-4 sm:top-16 sm:px-3.5 sm:py-2.5 sm:text-xs ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.type === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span>{toast.msg}</span>
        </div>
      )}

      {cancelModal && (
        <CancelConfirmModal
          patientName={cancelModal.patient?.name ?? "this patient"}
          loading={!!actionLoading[cancelModal.id]}
          onConfirm={async () => { await dispatch(cancelDoctorVideoAppointment(cancelModal)); refresh(); }}
          onCancel={() => dispatch(setCancelModal(null))} />)}

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
            dispatch(fetchDoctorVideoAppointments({ tab: activeTab, page: currentPage, mode: "video", silent: true }));
          }}
          onHangup={async () => {
            setOngoingId(null);
            dispatch(setActiveCall(null));
            await dispatch(completeDoctorVideoConsultation(activeCall.appt));
            refresh();
          }} />
      )}

      <style>{`
        @keyframes slideRight { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideLeft  { from { opacity:0; transform:translateX(-30px);} to { opacity:1; transform:translateX(0); } }
        .animate-slideRight { animation: slideRight 0.3s ease; }
        .animate-slideLeft  { animation: slideLeft  0.3s ease; }
        @keyframes toastSlide { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }
        .animate-toast-slide { animation: toastSlide 0.3s ease; }
      `}</style>
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
    <div className="relative mb-2.5 sm:mb-3">
      <div ref={containerRef} className="relative flex gap-0.5 overflow-x-auto rounded-xl bg-slate-100 p-1 scrollbar-hide sm:gap-1">
        <span ref={indicatorRef} className="absolute top-1 h-[calc(100%-8px)] rounded-lg bg-white shadow-sm transition-all duration-300 ease-in-out" />
        {TABS.map(({ key, label }) => (
          <button key={key} data-tab={key} onClick={() => onChange(key)} className={`relative z-10 flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-bold transition-colors duration-200 sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-[11px] ${activeTab === key ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
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

const AppointmentCard = ({ appt, actionLoading, isToday, onJoin, onComplete, onCancel }: {
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
    <div className={`rounded-xl border p-2.5 transition-all duration-200 hover:shadow-md lg:p-3
      ${isOngoing ? "border-emerald-200 bg-emerald-50/40 border-l-4 border-l-emerald-500" : isCancelled
        ? "border-red-100 bg-red-50/20 border-l-4 border-l-red-400 opacity-80" : isMissedAppt
          ? "border-orange-100 bg-orange-50/20 border-l-4 border-l-orange-400 opacity-85" : "border-slate-100 bg-white border-l-4 border-l-blue-600"}`}>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start">
        <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-extrabold text-blue-700 sm:flex sm:h-9 sm:w-9">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-extrabold text-blue-700 sm:hidden">
              {initials}
            </div>
            <span className="text-xs font-extrabold text-slate-800 sm:text-[13px]">{appt.patient?.name ?? "Unknown Patient"}</span>
            <span className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold sm:text-[10px] ${className}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{label}
            </span>
            <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 border border-blue-200 sm:text-[10px]">
              Video
            </span>
            {isToday && !isFullyCompleted && !isCancelled && !isMissedAppt && (
              <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-600 sm:text-[10px]">TODAY</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <InfoChip icon={<FaCalendarAlt className="text-[8px] text-slate-400 sm:text-[9px]" />} text={formatDate(appt.appointment_date)} />
            <InfoChip icon={<FaClock className="text-[8px] text-slate-400 sm:text-[9px]" />} text={`${formatTime(appt.start_time)} – ${formatTime(appt.end_time)}`} />
            {appt.patient?.gender && <InfoChip icon={<FaVenusMars className="text-[8px] text-slate-400 sm:text-[9px]" />} text={appt.patient.gender} />}
            {appt.patient?.email && (
              <InfoChip icon={<FaUser className="text-[8px] text-slate-400 sm:text-[9px]" />} text={appt.patient.email} />
            )}
          </div>
          {appt.reason && (
            <div className="mt-1 flex items-start gap-1">
              <FaStethoscope className="mt-0.5 shrink-0 text-[8px] text-slate-400 sm:text-[9px]" />
              <span className="text-[10px] text-slate-500 sm:text-[11px]">{appt.reason}</span>
            </div>
          )}
        </div>

        <div className="flex w-full shrink-0 flex-row flex-wrap gap-1.5 sm:w-auto sm:flex-col sm:items-stretch sm:gap-1.5">
          {!isFullyCompleted && !isCancelled && !isMissedAppt && (
            <>
              <button disabled={!joinable || busy} onClick={() => onJoin(appt)}
                className={`flex h-7 cursor-pointer items-center justify-center gap-1 rounded-lg px-2.5 text-[10px] font-bold transition-all sm:h-8 sm:gap-1.5 sm:px-3 sm:text-[11px]
                  ${joinable && !busy ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95" : "cursor-not-allowed bg-slate-100 text-slate-400"}`}>
                {busy && actionLoading[appt.id] === "joining" ? <><FaSpinner className="animate-spin text-[9px]" /><span>Joining…</span></> : <><FaPlay className="text-[8px]" /><span>{isOngoing ? "Rejoin" : "Join"}</span></>}
              </button>
              {isOngoing && (
                <button disabled={busy} onClick={() => onComplete(appt)} className="flex h-7 cursor-pointer items-center justify-center gap-1 rounded-lg bg-emerald-50 px-2.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 active:scale-95 disabled:opacity-60 transition-all sm:h-8 sm:gap-1.5 sm:px-3 sm:text-[11px]">
                  {actionLoading[appt.id] === "completing" ? <><FaSpinner className="animate-spin text-[9px]" /><span>Ending…</span></> : <><FaCheckCircle className="text-[9px]" /><span>End Call</span></>}
                </button>
              )}
            </>
          )}

          {canCancel && (
            <button disabled={busy} onClick={onCancel} className="flex h-7 cursor-pointer items-center justify-center gap-1 rounded-lg bg-red-50 px-2.5 text-[10px] font-bold text-red-500 hover:bg-red-100 active:scale-95 disabled:opacity-60 transition-all sm:h-8 sm:gap-1.5 sm:px-3 sm:text-[11px]">
              {busy && actionLoading[appt.id] === "cancelling"
                ? <><FaSpinner className="animate-spin text-[9px]" /><span>Cancelling…</span></>
                : <><FaTimesCircle className="text-[9px]" /><span>Cancel</span></>
              }
            </button>
          )}

          {isFullyCompleted && (
            <div className="flex h-7 items-center justify-center gap-1 rounded-lg bg-blue-50 px-2.5 text-[10px] font-bold text-blue-600 sm:h-8 sm:px-3 sm:text-[11px]">
              <FaCheckCircle className="text-[9px]" /><span>Completed</span>
            </div>
          )}
          {isCancelled && (
            <div className="flex h-7 items-center justify-center gap-1 rounded-lg bg-red-50 px-2.5 text-[10px] font-bold text-red-400 sm:h-8 sm:px-3 sm:text-[11px]">
              <FaBan className="text-[9px]" /><span>Cancelled</span>
            </div>
          )}
          {isMissedAppt && !isCancelled && (
            <div className="flex h-7 items-center justify-center gap-1 rounded-lg bg-orange-50 px-2.5 text-[10px] font-bold text-orange-500 sm:h-8 sm:px-3 sm:text-[11px]">
              <FaExclamationTriangle className="text-[9px]" /><span>Missed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CancelConfirmModal = ({ patientName, onConfirm, onCancel, loading }: {
  patientName: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-[300px] rounded-2xl bg-white p-4 shadow-2xl sm:max-w-xs sm:p-5">
      <div className="mb-3 flex flex-col items-center gap-2.5 text-center sm:mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-base text-red-500 sm:h-11 sm:w-11">
          <FaBan />
        </div>
        <h3 className="text-xs font-extrabold text-slate-900 sm:text-sm">Cancel Appointment?</h3>
        <p className="text-[10px] text-slate-500 sm:text-xs">
          Are you sure you want to cancel appointment with{" "}
          <span className="font-bold text-slate-700">{patientName}</span>?
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} disabled={loading} className="h-8 flex-1 cursor-pointer rounded-xl border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors sm:h-9 sm:text-xs">
          Keep It
        </button>
        <button onClick={onConfirm} disabled={loading} className="flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-red-500 text-[11px] font-bold text-white hover:bg-red-600 transition-colors sm:h-9 sm:text-xs">
          {loading ? <><FaSpinner className="animate-spin text-[9px]" />Cancelling…</> : <><FaTimesCircle className="text-[9px]" />Yes, Cancel</>}
        </button>
      </div>
    </div>
  </div>
);

const StatCard = ({ icon, title, value, iconClass, valueClass }: {
  icon: React.ReactNode; title: string; value: string; iconClass: string; valueClass: string;
}) => (
  <div className="rounded-xl bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 sm:p-3">
    <div className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] sm:h-7 sm:w-7 sm:text-xs ${iconClass}`}>
      {icon}
    </div>
    <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-400 sm:text-[10px]">{title}</p>
    <p className={`mt-0.5 text-lg font-extrabold sm:text-xl lg:text-2xl ${valueClass}`}>{value}</p>
  </div>
);

const InfoChip = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600 sm:px-2 sm:text-[11px]">
    {icon}{text}
  </span>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center gap-2.5 py-8 text-slate-400 sm:py-10">
    <FaSpinner className="animate-spin text-lg text-blue-500 sm:text-xl" />
    <p className="text-[10px] font-semibold sm:text-[11px]">Loading consultations…</p>
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center gap-2.5 py-8 sm:py-10">
    <FaExclamationTriangle className="text-lg text-red-400 sm:text-xl" />
    <p className="text-[10px] font-semibold text-slate-500 sm:text-[11px]">{message}</p>
    <button onClick={onRetry} className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-blue-700 transition-colors sm:px-4 sm:text-[11px]">
      Retry
    </button>
  </div>
);

const EmptyState = ({ tab }: { tab: TabKey }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-400 sm:py-10">
    <FaVideo className="mb-1 text-xl sm:text-2xl" />
    <p className="text-[10px] font-semibold text-slate-500 sm:text-[11px]">
      No {tab === "all" ? "" : tab} video consultations found
    </p>
  </div>
);

export default DoctorVideoConsultation;