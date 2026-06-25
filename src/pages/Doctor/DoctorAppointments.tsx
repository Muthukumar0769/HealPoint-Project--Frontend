import { useEffect, useState, useMemo, useRef } from "react";
import { FaCalendarAlt, FaCheckCircle, FaChevronDown, FaTimesCircle, FaUserCheck, FaVideo, FaSearch, FaEye, FaHospital, FaTimes, FaClock, FaStethoscope, } from "react-icons/fa";
import { DoctorSidebar } from "./DoctorSidebar";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  clearSelectedMonth, fetchDoctorAppointments, fetchDoctorAppointmentStats, setActiveTab,
  setDebouncedSearch, setPage, setSearch, setSelectedMonth, setViewAppointment, updateDoctorAppointmentStatus, setLimit
} from "../../store/slices/DoctorAppointmentSlice";
import type { AppointmentStatus, AppointmentType, DoctorAppointmentItem } from "../../types/doctor";
import { clearAppointmentNotification, setAppointmentNotification } from "../../store/slices/NotificationSlice";
import usePageTitle from "../../hooks/usePageTitle";

//--------Helper Functions-------------

const SEEN_KEY = "doctor_seen_appointment_ids";
const TABS: ("All" | AppointmentStatus)[] = ["All", "Accepted", "Completed", "Missed", "Cancelled"];
const LIMIT_OPTIONS = [5, 10, 20, 50];
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

//----------Pagination limit given by user separate componet for that-------------

const EntriesSelector = ({ limit, onLimitChange }: { limit: number; onLimitChange: (v: number) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(p => !p)}
        className="flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50">
        <span>{limit}</span>
        <FaChevronDown className={`text-[9px] text-blue-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1.5 w-16 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl">
          {LIMIT_OPTIONS.map(opt => (
            <button key={opt} onClick={() => { onLimitChange(opt); setOpen(false); }}
              className={`block w-full px-3 py-2 text-left text-xs font-bold transition ${opt === limit ? "bg-blue-500 text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"}`}>               {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

//-----Main Component--------------

export const DoctorAppointments = () => {
  usePageTitle("My Appointments");
  const tableRef = useRef<HTMLDivElement | null>(null);
  const dispatch = useAppDispatch();
  const isOnPage = useRef(false);
  const { appointments, stats, loading, activeTab, search, debouncedSearch, selectedMonth,
    actionLoadingId, currentPage, totalCount, limit, slideDirection, viewAppointment } = useAppSelector((state) => state.doctorAppointments);
  const parsedMonth = selectedMonth ? Number(selectedMonth.split("-")[1]) : undefined;
  const parsedYear = selectedMonth ? Number(selectedMonth.split("-")[0]) : undefined;

  //---------Debounce for Search-----------

  useEffect(() => {
    const timer = setTimeout(() => dispatch(setDebouncedSearch(search.trim())), 400);
    return () => clearTimeout(timer);
  }, [search, dispatch]);

  //---------Dispatch the reducers ---------

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
  const handleLimitChange = (val: number) => {
    dispatch(setLimit(val));
    dispatch(setPage(1));
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
    if (currentPage > 4) pages.push("...");
    const start = Math.max(2, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 3) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex min-h-screen bg-[#f0f4fb]">
      <DoctorSidebar />
      <main className="min-w-0 flex-1 px-3 pb-7 pt-18 sm:px-4 sm:pt-20 lg:px-6 lg:pt-22 xl:px-7">
        <div className="mb-3 sm:mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-gray-500">Manage and track all your patient appointments</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl bg-white px-3 py-1.5 sm:py-2 shadow-sm">
            <FaCalendarAlt className="text-blue-600 text-sm sm:text-base shrink-0" />
            <input type="month" value={selectedMonth} onChange={(e) => dispatch(setSelectedMonth(e.target.value))}
              className="cursor-pointer bg-transparent text-xs sm:text-sm font-semibold text-gray-700 outline-none w-full" />
            {selectedMonth && (
              <button onClick={() => dispatch(clearSelectedMonth())} className="ml-1 text-xs cursor-pointer text-gray-400 hover:text-red-500 shrink-0">
                <FaTimes />
              </button>
            )}
          </div>
        </div>
        <div className="mb-3 sm:mb-5 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
          <StatCard icon={<FaCalendarAlt />} title="Appointments" value={stats.total} bg="from-blue-500 to-indigo-600" />
          <StatCard icon={<FaUserCheck />} title="Accepted" value={stats.accepted} bg="from-cyan-500 to-blue-500" />
          <StatCard icon={<FaCheckCircle />} title="Completed" value={stats.completed} bg="from-green-500 to-emerald-600" />
          <StatCard icon={<FaTimesCircle />} title="Missed" value={stats.missed} bg="from-orange-500 to-amber-600" />
          <StatCard icon={<FaTimesCircle />} title="Cancelled" value={stats.cancelled} bg="from-rose-500 to-pink-600" />
        </div>
        <div className="mb-3 sm:mb-4 rounded-xl bg-white p-2.5 sm:p-3 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0.5 scrollbar-hide">
              {TABS.map((tab) => {
                const count = tab === "All" ? appointments.length : appointments.filter((a) => a.status === tab).length;
                return (
                  <button key={tab} onClick={() => handleTabClick(tab)} className={`shrink-0 flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs cursor-pointer font-semibold transition-all ${activeTab === tab ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"}`}>
                    <span className="hidden sm:inline">{tab === "All" ? "All Appointments" : tab}</span>
                    <span className="sm:hidden">{tab === "All" ? "All" : tab}</span>
                    <span className={`rounded-full px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold ${activeTab === tab ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
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
                onChange={(e) => dispatch(setSearch(e.target.value))} className="h-8 sm:h-9 w-full sm:w-44 lg:w-56 rounded-xl border border-gray-200 bg-gray-50 pl-8 sm:pl-9 pr-7 sm:pr-8 text-xs sm:text-sm outline-none transition focus:border-blue-400 focus:bg-white" />
              {search && (
                <button onClick={() => dispatch(setSearch(""))} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-red-400">
                  <FaTimes className="text-xs sm:text-sm" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div ref={tableRef} className=" rounded-xl bg-white shadow-sm">
          <div className="overflow-hidden">
            <div key={`${currentPage}-${debouncedSearch}-${selectedMonth}`} className={`overflow-x-auto ${slideDirection === "right" ? "animate-slideRight" : "animate-slideLeft"}`}
              style={{ scrollbarWidth: "thin", scrollbarColor: "#CBD5E1 transparent" }}>
              <table className="w-full border-collapse text-sm" style={{ minWidth: "700px" }}>
                <thead>
                  <tr className="bg-blue-600 text-white">
                    {["#", "Patient", "Date & Time", "Type", "Problem", "Status", "Action"].map((heading) => (
                      <th key={heading} className={`px-2.5 sm:px-4 py-2.5 sm:py-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${heading === "Action" ? "text-center" : "text-left"} ${heading === "Problem" ? "hidden md:table-cell" : ""}`}>
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
                      <td className="px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs font-medium text-gray-400">
                        {(currentPage - 1) * limit + index + 1}
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs sm:text-sm font-bold text-white">
                            {item.patientName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] sm:text-xs font-semibold text-gray-900 truncate max-w-[80px] sm:max-w-[120px] lg:max-w-none">
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
                                className="rounded-lg bg-blue-600 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                                {actionLoadingId === item.id ? "..." : "Accept"}
                              </button>
                              <button disabled={actionLoadingId === item.id} onClick={() => handleStatusUpdate(item.id, "rejected")}
                                className="rounded-lg border border-red-200 bg-red-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60">
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
                <div className="py-8 sm:py-10 text-center">
                  <p className="text-sm sm:text-base font-semibold text-gray-500">No Appointments Found</p>
                  <p className="mt-1 text-xs sm:text-sm text-gray-400">Try a different search term, tab, or month</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-b-xl border-t border-gray-100 px-3 sm:px-4 py-2.5 sm:py-3 sm:flex-row sm:items-center sm:justify-between">
            {totalPages > 1 && (
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold cursor-pointer text-gray-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40">
                  Prev
                </button>
                {
                  getPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <button key={`ellipsis-${index}`} onClick={() => handlePageChange(index === 1 ? Math.max(1, currentPage - 5) : Math.min(totalPages, currentPage + 5))}
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg cursor-pointer border border-gray-200 text-xs text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition">
                        …
                      </button>
                    ) : (
                      <button key={page} onClick={() => handlePageChange(page as number)}
                        className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg cursor-pointer text-xs font-bold transition ${currentPage === page ? "bg-blue-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-blue-50"}`}>
                        {page}
                      </button>
                    )
                  )}
                <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold cursor-pointer text-gray-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40">
                  Next
                </button>
              </div>
            )
            }
            <div className="flex items-center gap-2">
              <EntriesSelector limit={limit} onLimitChange={handleLimitChange} />
              <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                Entries&nbsp;
                <span className="font-bold text-blue-600">
                  {totalCount === 0 ? 0 : (currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, totalCount)}
                </span>
                &nbsp;of&nbsp;
                <span className="font-bold text-slate-700">{totalCount}</span>
              </span>
            </div>
          </div >
        </div >
      </main >

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
    </div >
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
      <div className="animate-modalIn w-full sm:max-w-sm overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-500 px-4 sm:px-5 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4 pr-8">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-xl sm:text-2xl font-extrabold text-white shadow-inner">
              {appointment.patientName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-200">Patient</p>
              <h2 className="text-sm sm:text-base font-extrabold leading-tight text-white truncate">{appointment.patientName}</h2>
              <p className="mt-0.5 text-[10px] sm:text-xs text-blue-100 truncate">{appointment.patientInfo}</p>
            </div>
          </div>
          <span className="absolute top-12 sm:top-14 right-4 sm:right-6 rounded-full bg-white/20 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-white">
            #{appointment.id}
          </span>
          <button onClick={onClose} className="absolute right-3 sm:right-4 top-3 sm:top-4 flex h-7 w-7 sm:h-8 sm:w-8 items-center cursor-pointer justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30">
            <FaTimes size={12} />
          </button>
        </div>
        <div className={`flex items-center justify-between border-b px-4 sm:px-5 py-1.5 sm:py-2 ${statusColor[appointment.status]}`}>
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Status</span>
          <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest">{appointment.status}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 sm:p-4">
          <InfoRow icon={<FaCalendarAlt size={12} />} label="Date" value={appointment.date} />
          <InfoRow icon={<FaClock size={12} />} label="Time" value={appointment.time} />
          <InfoRow icon={appointment.type === "Video Call" ? <FaVideo size={12} /> : <FaHospital size={12} />} label="Type" value={appointment.type} />
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
        <div className="border-t border-slate-100 px-3 sm:px-4 pb-3 sm:pb-4">
          <button onClick={onClose} className="w-full rounded-xl bg-blue-600 cursor-pointer py-2 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-2.5 sm:px-3 py-2 sm:py-2.5">
    <div className="mt-0.5 flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-[11px] sm:text-xs font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const StatCard = ({ icon, title, value, bg }: { icon: React.ReactNode; title: string; value: number; bg: string }) => {
  const accent = bg.includes("cyan") ? "border-t-cyan-500" : bg.includes("green") || bg.includes("emerald")
    ? "border-t-emerald-500" : bg.includes("orange") || bg.includes("amber") ? "border-t-amber-500"
      : bg.includes("rose") || bg.includes("pink") ? "border-t-rose-500" : "border-t-blue-500";

  const iconTint = bg.includes("cyan") ? "bg-cyan-50 text-cyan-600" : bg.includes("green") || bg.includes("emerald")
    ? "bg-emerald-50 text-emerald-600" : bg.includes("orange") || bg.includes("amber") ? "bg-amber-50 text-amber-600"
      : bg.includes("rose") || bg.includes("pink") ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600";

  return (
    <div className={`group relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-3 sm:p-4 shadow-sm border border-gray-100 border-t-2 ${accent} transition hover:shadow-md`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 truncate">{title}</p>
          <p className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">{value}</p>
          <p className="mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] font-semibold text-slate-400">
            {title === "Appointments" ? "Total" : "This Period"}
          </p>
        </div>
        <div className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl text-sm sm:text-base shadow-sm ${iconTint}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointments;