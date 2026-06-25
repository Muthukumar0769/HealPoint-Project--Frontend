import { useEffect, useMemo, useRef } from "react";
import { FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaUserCheck, FaVideo, FaSearch, FaEye,FaHospital, FaTimes, FaClock, FaStethoscope,} from "react-icons/fa";
import { DoctorSidebar } from "./DoctorSidebar";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {clearSelectedMonth, fetchDoctorAppointments, fetchDoctorAppointmentStats, setActiveTab,
  setDebouncedSearch, setPage, setSearch, setSelectedMonth, setViewAppointment, updateDoctorAppointmentStatus,} from "../../store/slices/DoctorAppointmentSlice";
import type { AppointmentStatus, AppointmentType, DoctorAppointmentItem } from "../../types/doctor";
import { clearAppointmentNotification, setAppointmentNotification } from "../../store/slices/NotificationSlice";
import usePageTitle from "../../hooks/usePageTitle";

const SEEN_KEY = "doctor_seen_appointment_ids";
const TABS: ("All" | AppointmentStatus)[] = ["All", "Pending", "Accepted", "Completed", "Missed", "Cancelled"];
const STATUS_STYLES: Record<AppointmentStatus, string> = {
  Pending: "bg-yellow-50 text-yellow-700 border border-yellow-300",
  Accepted: "bg-blue-50 text-blue-700 border border-blue-300",
  Completed: "bg-green-50 text-green-700 border border-green-300",
  Cancelled: "bg-red-50 text-red-700 border border-red-300",
  Missed: "bg-orange-50 text-orange-700 border border-orange-300",
};
const TYPE_STYLES: Record<AppointmentType, string> = {
  "Video Call": "bg-sky-50 text-sky-700 border border-sky-200",
  "Clinic Visit": "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

export const DoctorAppointments = () => {
  usePageTitle("My Appointments");
  const tableRef = useRef<HTMLDivElement | null>(null);
  const dispatch = useAppDispatch();
  const isOnPage = useRef(false);
  const { appointments, stats, loading, activeTab, search, debouncedSearch, selectedMonth,
    actionLoadingId, currentPage, totalCount, limit, slideDirection, viewAppointment } = useAppSelector((state) => state.doctorAppointments);
  const parsedMonth = selectedMonth ? Number(selectedMonth.split("-")[1]) : undefined;
  const parsedYear = selectedMonth ? Number(selectedMonth.split("-")[0]) : undefined;

  useEffect(() => {
    const timer = setTimeout(() => dispatch(setDebouncedSearch(search.trim())), 400);
    return () => clearTimeout(timer);
  }, [search, dispatch]);

  useEffect(() => {
    dispatch(fetchDoctorAppointments({
      page: currentPage, limit,
      patientName: debouncedSearch || undefined,
      month: parsedMonth, year: parsedYear,
    }));
  }, [dispatch, currentPage, limit, debouncedSearch, parsedMonth, parsedYear]);

  useEffect(() => {
    dispatch(fetchDoctorAppointmentStats({ month: parsedMonth, year: parsedYear }));
  }, [dispatch, parsedMonth, parsedYear]);

  useEffect(() => {
    isOnPage.current = true;
    dispatch(clearAppointmentNotification());
    return () => { isOnPage.current = false; };
  }, [dispatch]);

  useEffect(() => {
    if (appointments.length === 0) return;
    const currentIds = appointments.map((a) => a.id);
    if (isOnPage.current) {
      localStorage.setItem(SEEN_KEY, JSON.stringify(currentIds));
      dispatch(clearAppointmentNotification());
    } else {
      const raw = localStorage.getItem(SEEN_KEY);
      if (raw === null) {
        localStorage.setItem(SEEN_KEY, JSON.stringify(currentIds));
      } else {
        const seenIds: number[] = JSON.parse(raw);
        const hasNew = currentIds.some((id) => !seenIds.includes(id));
        if (hasNew) dispatch(setAppointmentNotification());
      }
    }
  }, [appointments, dispatch]);

  const filteredAppointments = useMemo(
    () => appointments.filter((item) => activeTab === "All" || item.status === activeTab),
    [appointments, activeTab]
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const handleTabClick = (tab: "All" | AppointmentStatus) => {
    dispatch(setActiveTab(tab));
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    dispatch(setPage(page));
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleStatusUpdate = async (appointmentId: number, status: "accepted" | "rejected") => {
    await dispatch(updateDoctorAppointmentStatus({ appointmentId, status }));
    dispatch(fetchDoctorAppointments({
      page: currentPage, limit,
      patientName: debouncedSearch || undefined,
      month: parsedMonth, year: parsedYear,
    }));
    dispatch(fetchDoctorAppointmentStats({ month: parsedMonth, year: parsedYear }));
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex min-h-screen bg-[#f0f4fb]">
      <DoctorSidebar />
      <main className="min-w-0 flex-1 px-3 pb-10 pt-20 sm:px-4 sm:pt-22 lg:px-8 lg:pt-24">
        <div className="mb-5 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-gray-500">Manage and track all your patient appointments</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto rounded-xl sm:rounded-2xl bg-white px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
            <FaCalendarAlt className="text-blue-600 text-sm sm:text-base shrink-0" />
            <input type="month" value={selectedMonth} onChange={(e) => dispatch(setSelectedMonth(e.target.value))}
              className="cursor-pointer bg-transparent text-xs sm:text-sm font-semibold text-gray-700 outline-none w-full"/>
            {selectedMonth && (
              <button onClick={() => dispatch(clearSelectedMonth())} className="ml-1 text-xs cursor-pointer text-gray-400 hover:text-red-500 shrink-0">
                <FaTimes />
              </button>
            )}
          </div>
        </div>
        <div className="mb-5 sm:mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard icon={<FaCalendarAlt />} title="Appointments" value={stats.total} bg="from-blue-500 to-indigo-600" />
          <StatCard icon={<FaUserCheck />} title="Accepted" value={stats.accepted} bg="from-cyan-500 to-blue-500" />
          <StatCard icon={<FaCheckCircle />} title="Completed" value={stats.completed} bg="from-green-500 to-emerald-600" />
          <StatCard icon={<FaTimesCircle />} title="Cancelled" value={stats.cancelled} bg="from-rose-500 to-pink-600" />
        </div>
        <div className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0.5 scrollbar-hide">
              {TABS.map((tab) => {
                const count = tab === "All" ? appointments.length : appointments.filter((a) => a.status === tab).length;
                return (
                  <button key={tab} onClick={() => handleTabClick(tab)} className={`shrink-0 flex items-center gap-1 sm:gap-1.5 rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm cursor-pointer font-semibold transition-all ${
                      activeTab === tab ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"}`}>
                    <span className="hidden sm:inline">{tab === "All" ? "All Appointments" : tab}</span>
                    <span className="sm:hidden">{tab === "All" ? "All" : tab}</span>
                    <span className={`rounded-full px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold ${
                      activeTab === tab ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="relative shrink-0">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-gray-400" />
              <input type="text" placeholder="Search patient..." value={search}
                onChange={(e) => dispatch(setSearch(e.target.value))} className="h-9 sm:h-10 w-full sm:w-48 lg:w-64 rounded-xl border border-gray-200 bg-gray-50 pl-8 sm:pl-9 pr-7 sm:pr-8 text-xs sm:text-sm outline-none transition focus:border-blue-400 focus:bg-white"/>
              {search && (
                <button onClick={() => dispatch(setSearch(""))} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-red-400">
                  <FaTimes className="text-xs sm:text-sm" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div ref={tableRef} className="rounded-xl sm:rounded-2xl bg-white shadow-sm">
          <div className="overflow-hidden">
            <div key={`${currentPage}-${debouncedSearch}-${selectedMonth}`} className={`overflow-x-auto ${slideDirection === "right" ? "animate-slideRight" : "animate-slideLeft"}`}
              style={{ scrollbarWidth: "thin", scrollbarColor: "#CBD5E1 transparent" }}>
              <table className="w-full border-collapse text-sm" style={{ minWidth: "700px" }}>
                <thead>
                  <tr className="bg-blue-600 text-white">
                    {["#", "Patient", "Date & Time", "Type", "Problem", "Status", "Action"].map((heading) => (
                      <th key={heading} className={`px-3 sm:px-5 py-3 sm:py-3.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${
                          heading === "Action" ? "text-center" : "text-left"} ${heading === "Problem" ? "hidden md:table-cell" : ""}`}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center text-sm sm:text-base font-semibold text-blue-600">
                        Loading appointments...
                      </td>
                    </tr>
                  )}
                  {!loading && filteredAppointments.map((item, index) => (
                    <tr key={item.id} className="transition hover:bg-blue-50/40">
                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-400">
                        {(currentPage - 1) * limit + index + 1}
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs sm:text-sm font-bold text-white">
                            {item.patientName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[80px] sm:max-w-[120px] lg:max-w-none">
                              {item.patientName}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-400 truncate max-w-[80px] sm:max-w-none">
                              {item.patientInfo}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 sm:px-5 py-3 sm:py-4">
                        <p className="text-xs sm:text-sm font-semibold text-gray-800">{item.date}</p>
                        <p className="text-[10px] sm:text-xs text-gray-400">{item.time}</p>
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <span className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold ${TYPE_STYLES[item.type]}`}>
                          {item.type === "Video Call" ? <FaVideo size={9} /> : <FaHospital size={9} />}
                          <span className="hidden sm:inline">{item.type}</span>
                          <span className="sm:hidden">{item.type === "Video Call" ? "Video" : "Clinic"}</span>
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 max-w-[140px] lg:max-w-none">
                        <span className="line-clamp-2">{item.problem}</span>
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <span className={`rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold ${STATUS_STYLES[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                          {item.status === "Pending" ? (
                            <>
                              <button disabled={actionLoadingId === item.id} onClick={() => handleStatusUpdate(item.id, "accepted")}
                                className="rounded-lg bg-blue-600 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                                {actionLoadingId === item.id ? "..." : "Accept"}
                              </button>
                              <button disabled={actionLoadingId === item.id} onClick={() => handleStatusUpdate(item.id, "rejected")}
                                className="rounded-lg border border-red-200 bg-red-50 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60">
                                {actionLoadingId === item.id ? "..." : "Reject"}
                              </button>
                              <button onClick={() => dispatch(setViewAppointment(item))} className="inline-flex items-center gap-1 cursor-pointer rounded-lg border border-blue-200 bg-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-blue-700 hover:bg-blue-100">
                                <FaEye size={9} />
                                <span className="hidden sm:inline">View</span>
                              </button>
                            </>
                          ) : (
                            <button onClick={() => dispatch(setViewAppointment(item))} className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg cursor-pointer border border-blue-200 bg-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-blue-700 hover:bg-blue-100">
                              <FaEye size={9} />
                              <span className="hidden sm:inline">View</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && filteredAppointments.length === 0 && (
                <div className="py-12 sm:py-16 text-center">
                  <p className="text-sm sm:text-base font-semibold text-gray-500">No Appointments Found</p>
                  <p className="mt-1 text-xs sm:text-sm text-gray-400">Try a different search term, tab, or month</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-b-xl sm:rounded-b-2xl border-t border-gray-100 px-3 sm:px-5 py-3 sm:py-4 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] sm:text-xs leading-relaxed">
              Page {currentPage} of {totalPages} — {totalCount} appointment{totalCount !== 1 ? "s" : ""}
              {debouncedSearch ? ` matching "${debouncedSearch}"` : ""}
              {selectedMonth ? ` in ${selectedMonth}` : ""}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}
                  className="rounded-lg border border-gray-200 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold cursor-pointer text-gray-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40">
                  Prev
                </button>
                {getPageNumbers().map((page, index) =>
                  page === "..." ? (
                    <span key={`ellipsis-${index}`} className="px-0.5 sm:px-1 text-xs">...</span>
                  ) : (
                    <button key={page} onClick={() => handlePageChange(page as number)} className={`h-7 w-7 sm:h-9 sm:w-9 rounded-lg cursor-pointer text-xs sm:text-sm font-bold transition ${
                        currentPage === page ? "bg-blue-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-blue-50"}`}>
                      {page}
                    </button>
                  )
                )}
                <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}
                  className="rounded-lg border border-gray-200 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-gray-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer">
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {viewAppointment && (
        <AppointmentModal appointment={viewAppointment} onClose={() => dispatch(setViewAppointment(null))} />
      )}

      <style>{`
        @keyframes slideRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-slideRight { animation: slideRight 0.35s ease; }
        .animate-slideLeft { animation: slideLeft 0.35s ease; }
        .animate-modalIn { animation: modalIn 0.25s ease; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

const AppointmentModal = ({ appointment, onClose }: { appointment: DoctorAppointmentItem; onClose: () => void }) => {
  const statusColor: Record<AppointmentStatus, string> = {
    Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Accepted: "bg-blue-100 text-blue-700 border-blue-200",
    Completed: "bg-green-100 text-green-700 border-green-200",
    Cancelled: "bg-red-100 text-red-700 border-red-200",
    Missed: "bg-orange-50 text-orange-700 border border-orange-300",
  };
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); };
  return (
    <div onClick={handleBackdrop} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm">
      <div className="animate-modalIn w-full sm:max-w-md overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-500 px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-3 sm:gap-4 pr-8">
            <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 text-xl sm:text-2xl font-extrabold text-white shadow-inner">
              {appointment.patientName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-200">Patient</p>
              <h2 className="text-base sm:text-lg font-extrabold leading-tight text-white truncate">{appointment.patientName}</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-blue-100 truncate">{appointment.patientInfo}</p>
            </div>
          </div>
          <span className="absolute bottom-3 sm:bottom-4 right-4 sm:right-6 rounded-full bg-white/20 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-white">
            #{appointment.id}
          </span>
          <button onClick={onClose} className="absolute right-3 sm:right-4 top-3 sm:top-4 flex h-7 w-7 sm:h-8 sm:w-8 items-center cursor-pointer justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30">
            <FaTimes size={12} />
          </button>
        </div>
        <div className={`flex items-center justify-between border-b px-4 sm:px-6 py-2 sm:py-2.5 ${statusColor[appointment.status]}`}>
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Status</span>
          <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest">{appointment.status}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 p-4 sm:p-5">
          <InfoRow icon={<FaCalendarAlt size={12} />} label="Date" value={appointment.date} />
          <InfoRow icon={<FaClock size={12} />} label="Time" value={appointment.time} />
          <InfoRow icon={appointment.type === "Video Call" ? <FaVideo size={12} /> : <FaHospital size={12} />} label="Type" value={appointment.type}/>
          <div className="col-span-2">
            <InfoRow icon={<FaStethoscope size={12} />} label="Reason / Problem" value={appointment.problem} />
          </div>
          {appointment.type === "Video Call" && appointment.status === "Accepted" && (
            <div className="col-span-2 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 sm:px-4 py-2.5 sm:py-3">
              <FaVideo className="shrink-0 text-blue-500" size={12} />
              <p className="text-[10px] sm:text-xs font-semibold text-blue-600">Meeting link will be available 10 minutes before the appointment.</p>
            </div>
          )}
        </div>
        <div className="border-t border-slate-100 px-4 sm:px-5 pb-4 sm:pb-5">
          <button onClick={onClose} className="w-full rounded-xl bg-blue-600 cursor-pointer py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2 sm:gap-3 rounded-xl bg-slate-50 px-3 sm:px-4 py-2.5 sm:py-3">
    <div className="mt-0.5 flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-xs sm:text-sm font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const StatCard = ({ icon, title, value, bg }: { icon: React.ReactNode; title: string; value: number; bg: string }) => (
  <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br ${bg} p-3 sm:p-5 text-white shadow transition hover:-translate-y-1 hover:shadow-md`}>
    <p className="text-xs sm:text-sm font-medium opacity-90 truncate">{title}</p>
    <p className="mt-1 sm:mt-2 text-2xl sm:text-4xl font-extrabold">{value}</p>
    <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs opacity-75">{title === "Appointments" ? "Total" : "This Period"}</p>
    <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-3xl sm:text-4xl opacity-20">{icon}</div>
  </div>
);

export default DoctorAppointments;