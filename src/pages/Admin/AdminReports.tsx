import { useEffect, useRef, useState, useCallback } from "react";
import {FaCalendarAlt, FaCheckCircle, FaChevronLeft, FaChevronRight, FaDownload,
  FaExclamationTriangle, FaSpinner, FaTimesCircle, FaUserMd, FaBed, FaSyncAlt,} from "react-icons/fa";
import { Cell, PieChart, Pie, ResponsiveContainer, Tooltip } from "recharts";
import { AdminSidebar } from "./AdminSidebar";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchAvailabilityDashboard, setActiveTab, setPage, setSelectedDate,} from "../../store/slices/AdminReportsSlice";
import type { AvailableDoctor, UnavailableDoctor, LeaveDoctor } from "../../types/admin";
import usePageTitle from "../../hooks/usePageTitle";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const COLORS = ["#1ab854", "#d73205", "#f59e0b"];
const TODAY = new Date().toISOString().split("T")[0];

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const formatTime = (time: string) => {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
};

const getImageUrl = (pic: string) => pic?.startsWith("http") ? pic : `${BASE_URL}/uploads/${pic}`;
const fallback = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=dbeafe&color=1d4ed8`;

export const AdminReports = () => {
  usePageTitle("Leave Reports");
  const dispatch = useAppDispatch();
  const { data, loading, error, selectedDate, activeTab, page } = useAppSelector((s) => s.adminReports);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const [animating, setAnimating] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  const doFetch = useCallback(() => {
    dispatch(fetchAvailabilityDashboard({ date: selectedDate }));
    setLastRefreshed(new Date());
  }, [dispatch, selectedDate]);

  useEffect(() => { doFetch(); }, [doFetch]);
  useEffect(() => {
    const onFocus = () => doFetch();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [doFetch]);

  const summary = data?.summary;
  const activeRows =
    activeTab === "available" ? data?.availableDoctors :
    activeTab === "unavailable" ? data?.unavailableDoctors :
    data?.onLeaveDoctors;

  const chartData = [
    { name: "Available",   value: data?.chartData.available  ?? 0 },
    { name: "Unavailable", value: data?.chartData.unavailable ?? 0 },
    { name: "On Leave",    value: data?.chartData.onLeave     ?? 0 },
  ];

  const goToPage = (nextPage: number) => {
    if (animating || nextPage === page) return;
    const dir = nextPage > page ? "right" : "left";
    setSlideDir(dir);
    setAnimating(true);
    setTimeout(() => {
      dispatch(setPage(nextPage));
      setSlideDir(dir === "right" ? "left" : "right");
      setTimeout(() => {
        setAnimating(false);
        setSlideDir(null);
        if (tableWrapperRef.current) tableWrapperRef.current.scrollLeft = 0;
      }, 300);
    }, 200);
  };

  const handleExport = async () => {
    const rows =
      activeTab === "available"   ? data?._allAvailable   ?? [] :
      activeTab === "unavailable" ? data?._allUnavailable ?? [] :
      data?._allLeave ?? [];
    if (!rows.length) return;

    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const now = new Date().toLocaleString("en-IN");
    const receiptNo = `RPT-${Date.now()}`;
    const title =
      activeTab === "available"   ? "Available Doctors" :
      activeTab === "unavailable" ? "Unavailable Doctors" :
      "On Leave Doctors";

    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.text("HealPoint", 15, 18);
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text("Doctor Availability & Leave Reports", 15, 27);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.text(title, 15, 50);
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
    doc.text(`Report ID: ${receiptNo}`, 15, 58);
    doc.text(`Generated On: ${now}`, 15, 64);
    doc.text(`Date Filter: ${formatDate(selectedDate)}`, 15, 70);

    let y = 84;
    const secTitle = (text: string) => {
      doc.setFillColor(239, 246, 255); doc.rect(15, y, 180, 10, "F");
      doc.setTextColor(37, 99, 235); doc.setFontSize(12); doc.setFont("helvetica", "bold");
      doc.text(text, 20, y + 7); y += 18;
    };
    const infoRow = (label: string, value: string) => {
      doc.setTextColor(100, 116, 139); doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text(label, 20, y);
      doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold");
      doc.text(value || "—", 90, y); y += 8;
    };

    secTitle("Summary");
    infoRow("Report Type", title);
    infoRow("Total Doctors",  String(data?.summary.totalDoctors      ?? 0));
    infoRow("Available",      String(data?.summary.availableDoctors  ?? 0));
    infoRow("Unavailable",    String(data?.summary.unavailableDoctors ?? 0));
    infoRow("On Leave",       String(data?.summary.onLeaveDoctors    ?? 0));
    y += 6;
    secTitle(`${title} — ${rows.length} Record${rows.length !== 1 ? "s" : ""}`);

    doc.setFillColor(248, 250, 252); doc.rect(15, y - 4, 180, 10, "F");
    doc.setTextColor(100, 116, 139); doc.setFontSize(9); doc.setFont("helvetica", "bold");

    if (activeTab === "leave") {
      const cols = [20, 55, 100, 135, 158, 178];
      ["#", "Doctor", "Specialization", "Date", "Type", "Reason"].forEach((h, i) => doc.text(h, cols[i], y + 3));
      y += 12;
      (rows as LeaveDoctor[]).forEach((r, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        if (idx % 2 === 0) { doc.setFillColor(249, 250, 251); doc.rect(15, y - 4, 180, 9, "F"); }
        doc.setTextColor(15, 23, 42); doc.setFontSize(9); doc.setFont("helvetica", "normal");
        doc.text(String(idx + 1), cols[0], y + 2);
        doc.text(r.doctor_name ?? "—", cols[1], y + 2);
        doc.text(r.specialization ?? "—", cols[2], y + 2);
        doc.text(formatDate(r.unavailable_date), cols[3], y + 2);
        doc.text(r.is_full_day ? "Full Day" : `Half (${r.start_time ?? ""}–${r.end_time ?? ""})`, cols[4], y + 2);
        doc.text(r.reason ?? "-", cols[5], y + 2);
        y += 9;
      });
    } else if (activeTab === "unavailable") {
      const cols = [20, 60, 115, 160];
      ["#", "Doctor", "Specialization", "Date"].forEach((h, i) => doc.text(h, cols[i], y + 3));
      y += 12;
      (rows as UnavailableDoctor[]).forEach((r, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        if (idx % 2 === 0) { doc.setFillColor(249, 250, 251); doc.rect(15, y - 4, 180, 9, "F"); }
        doc.setTextColor(15, 23, 42); doc.setFontSize(9); doc.setFont("helvetica", "normal");
        doc.text(String(idx + 1), cols[0], y + 2);
        doc.text(r.doctor_name ?? "—", cols[1], y + 2);
        doc.text(r.specialization ?? "—", cols[2], y + 2);
        doc.text(formatDate(r.date), cols[3], y + 2);
        y += 9;
      });
    } else {
      const cols = [20, 60, 115, 158];
      ["#", "Doctor", "Specialization", "Status"].forEach((h, i) => doc.text(h, cols[i], y + 3));
      y += 12;
      (rows as AvailableDoctor[]).forEach((r, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        if (idx % 2 === 0) { doc.setFillColor(249, 250, 251); doc.rect(15, y - 4, 180, 9, "F"); }
        doc.setTextColor(15, 23, 42); doc.setFontSize(9); doc.setFont("helvetica", "normal");
        doc.text(String(idx + 1), cols[0], y + 2);
        doc.text(r.doctor_name ?? "—", cols[1], y + 2);
        doc.text(r.specialization ?? "—", cols[2], y + 2);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(
          r.slots_status === "slots_full" ? 234 : 22,
          r.slots_status === "slots_full" ? 88  : 163,
          r.slots_status === "slots_full" ? 12  : 74
        );
        doc.text(r.slots_status === "slots_full" ? "Today slots finished" : "Available", cols[3], y + 2);
        y += 9;
      });
    }

    y += 4;
    doc.setDrawColor(226, 232, 240); doc.line(15, y, 195, y); y += 8;
    doc.setTextColor(15, 23, 42); doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text(`Total: ${rows.length} record${rows.length !== 1 ? "s" : ""}`, 20, y);
    y += 10;
    doc.setFillColor(240, 249, 255); doc.rect(15, y, 180, 14, "F");
    doc.setTextColor(37, 99, 235); doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text("This is an auto-generated availability report from HealPoint.", 20, y + 9);
    doc.save(`HealPoint_${activeTab}_doctors_${selectedDate}.pdf`);
  };

  const getAnimClass = () => {
    if (!slideDir) return "";
    return slideDir === "right" ? "slide-in-right" : "slide-in-left";
  };

  const timeAgo = () => {
    const diff = Math.round((Date.now() - lastRefreshed.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.round(diff / 60)}m ago`;
  };

  return (
    <div className="flex min-h-screen bg-[#f0f4fb]">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden px-3 pb-10 pt-20 sm:px-5 sm:pt-24 lg:px-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-lg sm:text-2xl font-extrabold text-slate-900">
              <FaCalendarAlt className="text-blue-600 shrink-0" />
              <span>Doctor Availability &amp; <span className="text-blue-600">Leave Reports</span></span>
            </h1>
            <p className="mt-1 text-[11px] sm:text-xs font-medium text-slate-500">
              View doctor available and unavailable status.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-md shadow-blue-100">
              <span className="text-[10px] font-semibold text-slate-400">Updated {timeAgo()}</span>
              <button onClick={doFetch} disabled={loading} title="Refresh data" className="cursor-pointer text-blue-500 hover:text-blue-700 disabled:opacity-40 transition-colors">
                <FaSyncAlt className={`text-xs ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-md shadow-blue-100">
              <FaCalendarAlt className="text-sm text-blue-600 shrink-0" />
              <input type="date" value={selectedDate} onChange={(e) => dispatch(setSelectedDate(e.target.value || TODAY))}
                className="cursor-pointer bg-transparent text-xs font-bold text-slate-600 outline-none w-[120px] sm:w-auto" />
              {selectedDate !== TODAY && (
                <button onClick={() => dispatch(setSelectedDate(TODAY))} className="cursor-pointer text-xs font-bold text-red-500 whitespace-nowrap">
                  Today
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard title="Total Doctors" value={summary?.totalDoctors ?? 0} icon={<FaUserMd />} color="blue"   />
          <StatCard title="Available" value={summary?.availableDoctors ?? 0} icon={<FaCheckCircle />} color="green"  />
          <StatCard title="Unavailable" value={summary?.unavailableDoctors ?? 0} icon={<FaTimesCircle />} color="orange" />
          <StatCard title="On Leave" value={summary?.onLeaveDoctors ?? 0} icon={<FaBed />} color="yellow" />
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_280px] min-w-0">
          <section className="rounded-2xl bg-white p-3 sm:p-4 shadow-lg shadow-blue-100 min-w-0 overflow-hidden">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <TabBtn active={activeTab === "available"} onClick={() => dispatch(setActiveTab("available"))}>
                  <span className="hidden xs:inline">Available Doctors</span>
                  <span className="xs:hidden">Available</span>
                  {(data?._allAvailable.length ?? 0) > 0 && (
                    <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                      {data?._allAvailable.length}
                    </span>
                  )}
                </TabBtn>
                <TabBtn active={activeTab === "unavailable"} onClick={() => dispatch(setActiveTab("unavailable"))}>
                  <span className="hidden xs:inline">Unavailable Doctors</span>
                  <span className="xs:hidden">Unavailable</span>
                  {(data?._allUnavailable.length ?? 0) > 0 && (
                    <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
                      {data?._allUnavailable.length}
                    </span>
                  )}
                </TabBtn>
                <TabBtn active={activeTab === "leave"} onClick={() => dispatch(setActiveTab("leave"))}>
                  On Leave
                  {(data?._allLeave.length ?? 0) > 0 && (
                    <span className="ml-1 rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold text-yellow-700">
                      {data?._allLeave.length}
                    </span>
                  )}
                </TabBtn>
              </div>
              <button onClick={handleExport} className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-extrabold text-white transition hover:bg-blue-700 self-start sm:self-auto whitespace-nowrap">
                <FaDownload className="text-[10px]" />
                Export
              </button>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                <FaSpinner className="animate-spin text-2xl" />
                <p className="text-sm font-semibold">Loading report…</p>
              </div>
            )}

            {!loading && error && (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <FaExclamationTriangle className="text-2xl text-red-400" />
                <p className="text-sm font-semibold text-slate-500">{error}</p>
                <button onClick={doFetch} className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white">
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                <div ref={tableWrapperRef}
                  style={{ overflowX: "auto", width: "100%", maxWidth: "100%", scrollbarWidth: "thin", scrollbarColor: "#93c5fd #f1f5f9" }}>
                  <div key={`${activeTab}-${page}`} className={getAnimClass()}>
                    <table className="border-collapse text-xs sm:text-sm" style={{ minWidth: 600, width: "100%" }}>
                      <thead>
                        <tr className="bg-slate-50 text-left text-[10px] sm:text-xs text-slate-500">
                          <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold whitespace-nowrap">Doctor</th>
                          <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold whitespace-nowrap">Specialization</th>
                          <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold whitespace-nowrap">Date</th>
                          <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold whitespace-nowrap">Status</th>
                          {activeTab === "leave" && (
                            <>
                              <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold whitespace-nowrap">Type</th>
                              <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold whitespace-nowrap">Reason</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {activeTab === "available" &&
                          (data?.availableDoctors.rows ?? []).map((doc: AvailableDoctor) => (
                            <tr key={doc.doctor_id} className="border-b border-slate-100 transition hover:bg-blue-50/40">
                              <td className="px-3 sm:px-4 py-3 sm:py-4">
                                <div className="flex items-center gap-2">
                                  <img src={getImageUrl(doc.profile_picture)} alt={doc.doctor_name} onError={(e) => { (e.target as HTMLImageElement).src = fallback(doc.doctor_name); }}
                                    className="h-7 w-7 sm:h-9 sm:w-9 shrink-0 rounded-full object-cover" />
                                  <p className="text-[11px] sm:text-xs font-extrabold text-slate-900 whitespace-nowrap">{doc.doctor_name}</p>
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 py-3 sm:py-4 text-[11px] sm:text-xs font-semibold text-slate-600 whitespace-nowrap">{doc.specialization}</td>
                              <td className="px-3 sm:px-4 py-3 sm:py-4 text-[11px] sm:text-xs font-semibold text-slate-600 whitespace-nowrap">{formatDate(doc.date)}</td>
                              <td className="px-3 sm:px-4 py-3 sm:py-4">
                                {doc.slots_status === "slots_full" ? (
                                  <span className="rounded-full bg-orange-100 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-extrabold text-orange-600 whitespace-nowrap">
                                    ⚠ Slots finished
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-green-100 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-extrabold text-green-700 whitespace-nowrap">
                                    Available
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}

                        {activeTab === "unavailable" &&
                          (data?.unavailableDoctors.rows ?? []).map((doc: UnavailableDoctor) => (
                            <tr key={doc.doctor_id} className="border-b border-slate-100 transition hover:bg-blue-50/40">
                              <td className="px-3 sm:px-4 py-3 sm:py-4">
                                <div className="flex items-center gap-2">
                                  <img src={getImageUrl(doc.profile_picture)} alt={doc.doctor_name}
                                    onError={(e) => { (e.target as HTMLImageElement).src = fallback(doc.doctor_name); }}
                                    className="h-7 w-7 sm:h-9 sm:w-9 shrink-0 rounded-full object-cover" />
                                  <p className="text-[11px] sm:text-xs font-extrabold text-slate-900 whitespace-nowrap">{doc.doctor_name}</p>
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 py-3 sm:py-4 text-[11px] sm:text-xs font-semibold text-slate-600 whitespace-nowrap">{doc.specialization}</td>
                              <td className="px-3 sm:px-4 py-3 sm:py-4 text-[11px] sm:text-xs font-semibold text-slate-600 whitespace-nowrap">{formatDate(doc.date)}</td>
                              <td className="px-3 sm:px-4 py-3 sm:py-4">
                                <span className="rounded-full bg-slate-100 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-extrabold text-slate-500 whitespace-nowrap">
                                  No slots today
                                </span>
                              </td>
                            </tr>
                          ))}

                        {activeTab === "leave" &&
                          (data?.onLeaveDoctors.rows ?? []).map((doc: LeaveDoctor) => (
                            <tr key={`${doc.doctor_id}-${doc.unavailable_date}`} className="border-b border-slate-100 transition hover:bg-blue-50/40">
                              <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                                <div className="flex items-center gap-2 min-w-[120px]">
                                  <img src={getImageUrl(doc.profile_picture)} alt={doc.doctor_name}
                                    onError={(e) => { (e.target as HTMLImageElement).src = fallback(doc.doctor_name); }}
                                    className="h-7 w-7 sm:h-9 sm:w-9 shrink-0 rounded-full object-cover" />
                                  <p className="text-[11px] sm:text-xs font-extrabold text-slate-900 whitespace-nowrap">{doc.doctor_name}</p>
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-semibold text-slate-600 whitespace-nowrap">{doc.specialization}</td>
                              <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-semibold text-slate-600 whitespace-nowrap">{formatDate(doc.unavailable_date)}</td>
                              <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-extrabold text-yellow-700 whitespace-nowrap">
                                  On Leave
                                </span>
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-semibold text-slate-600 whitespace-nowrap">
                                {doc.is_full_day ? "Full Day" : `Half (${formatTime(doc.start_time ?? "")} – ${formatTime(doc.end_time ?? "")})`}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                                <span className="block max-w-[120px] sm:max-w-[150px] truncate text-[11px] sm:text-xs font-semibold text-slate-600" title={doc.reason ?? "-"}>
                                  {doc.reason ?? "-"}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>

                    {(activeRows?.rows.length ?? 0) === 0 && (
                      <div className="py-10 text-center text-xs sm:text-sm font-bold text-slate-400">
                        No {activeTab === "leave" ? "on leave" : activeTab} doctors found for {formatDate(selectedDate)}.
                      </div>
                    )}
                  </div>
                </div>

                {(activeRows?.totalPages ?? 0) > 1 && (
                  <div className="mt-4 sm:mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[11px] sm:text-xs text-slate-500">
                    <span>Page {activeRows?.currentPage} of {activeRows?.totalPages} — {activeRows?.totalRecords} total</span>
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                      <PageBtn disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                        <FaChevronLeft className="text-[10px]" />
                      </PageBtn>
                      {Array.from({ length: activeRows?.totalPages ?? 0 }, (_, i) => i + 1).map((p) => (
                        <button key={p} onClick={() => goToPage(p)}
                          className={`h-7 w-7 sm:h-8 sm:w-8 cursor-pointer rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-200 ${
                            p === page ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                          {p}
                        </button>
                      ))}
                      <PageBtn disabled={page >= (activeRows?.totalPages ?? 1)} onClick={() => goToPage(page + 1)}>
                        <FaChevronRight className="text-[10px]" />
                      </PageBtn>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
          <aside className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1 xl:space-y-0">
            <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-lg shadow-blue-100">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">Leave Status Overview</h2>
              <div className="mt-4 h-40 sm:h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="value" innerRadius={45} outerRadius={65} paddingAngle={5}>
                      {chartData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-2">
                <StatusItem color="bg-green-500"  label="Available"   value={data?.chartData.available  ?? 0} />
                <StatusItem color="bg-red-500"    label="Unavailable" value={data?.chartData.unavailable ?? 0} />
                <StatusItem color="bg-yellow-400" label="On Leave"    value={data?.chartData.onLeave     ?? 0} />
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-lg shadow-blue-100">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">Quick Summary</h2>
              <p className="mt-1 text-[11px] sm:text-xs text-slate-400">{formatDate(selectedDate)}</p>
              <div className="mt-4 space-y-3">
                <SummaryBox title="Available Today"   value={data?.quickSummary.availableToday   ?? 0} color="text-green-600"  bg="bg-green-50"  />
                <SummaryBox title="Unavailable Today" value={data?.quickSummary.unavailableToday ?? 0} color="text-red-600"    bg="bg-red-50"    />
                <SummaryBox title="On Leave Today"    value={data?.quickSummary.onLeaveToday     ?? 0} color="text-yellow-600" bg="bg-yellow-50" />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

const TabBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick}
    className={`cursor-pointer rounded-xl px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-extrabold transition ${
      active ? "bg-blue-600 text-white shadow shadow-blue-200" : "bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600"}`}>
    {children}
  </button>
);

const PageBtn = ({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) => (
  <button onClick={onClick} disabled={disabled}
    className="flex h-7 w-7 sm:h-8 sm:w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40">
    {children}
  </button>
);

const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: "blue" | "green" | "orange" | "yellow" }) => {
  const colors = {
    blue:   "bg-blue-100 text-blue-600",
    green:  "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    yellow: "bg-yellow-100 text-yellow-600",
  };
  return (
    <div className="rounded-2xl bg-white p-3 sm:p-4 shadow shadow-blue-100">
      <div className={`flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-2xl text-base sm:text-lg ${colors[color]}`}>
        {icon}
      </div>
      <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs font-bold text-slate-500">{title}</p>
      <h3 className="mt-0.5 sm:mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">{value}</h3>
    </div>
  );
};

const StatusItem = ({ color, label, value }: { color: string; label: string; value: number }) => (
  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ${color}`} />
      <span className="text-[11px] sm:text-xs font-bold text-slate-600">{label}</span>
    </div>
    <span className="text-[11px] sm:text-xs font-extrabold text-slate-900">{value}</span>
  </div>
);

const SummaryBox = ({ title, value, color, bg }: { title: string; value: number; color: string; bg: string }) => (
  <div className={`rounded-xl ${bg} p-3 sm:p-4`}>
    <p className="text-[11px] sm:text-xs font-bold text-slate-500">{title}</p>
    <p className={`mt-1 text-xl sm:text-2xl font-extrabold ${color}`}>{value}</p>
  </div>
);

export default AdminReports;