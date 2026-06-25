import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaDownload, FaVideo, FaSpinner, FaUserMd, } from "react-icons/fa";
import { AdminSidebar } from "./AdminSidebar";
import { fetchEarningsDashboard, setYear, } from "../../store/slices/AdminEarningsSlice";
import type { RootState, AppDispatch } from "../../store/store";
import type { RecentConsultation } from "../../types/admin";
import usePageTitle from "../../hooks/usePageTitle";

//--------Helper functions---------

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20];
const DEFAULT_ROWS_PER_PAGE = 5;
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => String(CURRENT_YEAR - i));
const formatINR = (val: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
const formatDate = (date: string) => new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const StatCard = ({ label, value, icon, color }: {
  label: string; value: string; change: number; icon: string;
  color: "blue" | "purple" | "green" | "teal";
}) => {
  const bg: Record<string, string> = {
    blue: "bg-blue-50", purple: "bg-purple-50", green: "bg-green-50", teal: "bg-teal-50",
  };
  return (
    <div className={`rounded-2xl ${bg[color]} p-3 sm:p-4`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 leading-tight">{label}</p>
        <span className="text-base sm:text-lg">{icon}</span>
      </div>
      <p className="truncate text-lg sm:text-xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
};

//-------Logic for the smooth Revenue Trend curve------------

interface RevenueTrendItem {
  label: string;
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

const RevenueTrendChart = ({ trend }: { trend: RevenueTrendItem[] }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  if (!trend || trend.length === 0) {
    return <div className="flex h-44 items-center justify-center text-sm text-slate-400 font-semibold">No revenue data available</div>;
  }
  const { linePath, areaPath, points } = buildRevenuePath(trend);
  const maxVal = Math.max(...trend.map(t => t.revenue), 1);
  const yLabels = [maxVal, Math.round(maxVal * 0.66), Math.round(maxVal * 0.33), 0];
  const totalRevenue = trend.reduce((s, t) => s + t.revenue, 0);
  const peakItem = trend.reduce((best, t) => (t.revenue > best.revenue ? t : best));
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
            <linearGradient id="colorVideoTrend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 46, 93, 139].map(y => (
            <line key={y} x1="0" y1={y} x2="380" y2={y} stroke="#f0fdf4" strokeWidth="1" />
          ))}
          {areaPath && <path d={areaPath} fill="url(#colorVideoTrend)" />}
          {linePath && <path d={linePath} stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          {points.map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="4" fill="#fff" stroke="#10b981" strokeWidth="2" />
              <circle cx={cx} cy={cy} r="14" fill="transparent" onMouseEnter={() => setHoverIndex(i)} onClick={() => setHoverIndex(i)} style={{ cursor: "pointer" }} />
            </g>
          ))}
          {trend.map((t, i) => (
            <text key={i} x={points[i]?.[0] ?? 0} y={138} textAnchor="middle" fontSize="9" fill="#94a3b8">{t.label}</text>
          ))}
        </svg>
        {hoverIndex !== null && trend[hoverIndex] && (
          <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg"
            style={{ left: `calc(2rem + ${(points[hoverIndex][0] / 380) * 100}% * (100% - 2rem) / 100%)`, top: `${(points[hoverIndex][1] / 140) * 100}%` }}>
            {trend[hoverIndex].label}: <span className="text-emerald-300">{formatINR(trend[hoverIndex].revenue)}</span>
            <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-slate-900" />
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-4 rounded-xl bg-emerald-50 px-3 py-2">
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-500">Total</span>
          <b className="text-xs text-slate-800">{formatINR(totalRevenue)}</b>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <span className="text-xs text-slate-500">Peak</span>
          <b className="text-xs text-slate-800">{peakItem.label}</b>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-200" />
          <span className="text-xs text-slate-500">Avg/Month</span>
          <b className="text-xs text-slate-800">{formatINR(avgRevenue)}</b>
        </div>
      </div>
    </div>
  );
};

//----Main Component-----------

export const AdminEarningsReport = () => {
  usePageTitle("Earnings Report");
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const tableRef = useRef<HTMLDivElement>(null);
  const { data, loading, error, year } = useSelector((state: RootState) => state.adminEarnings);
  const [tablePage, setTablePage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  useEffect(() => {
    dispatch(fetchEarningsDashboard({ year }));
  }, [year, dispatch]);

  useEffect(() => {
    setTablePage(1);
  }, [year]);

  const trend: RevenueTrendItem[] = (data?.trendData ?? []).map((t) => ({
    label: t.label,
    revenue: t.videoCall,
  }));

  const allRows: RecentConsultation[] = (data?.recentConsultations?.rows ?? []).filter((r) => r.consultation_type === "video_call");
  const totalTablePages = Math.max(1, Math.ceil(allRows.length / rowsPerPage));
  const paginatedRows = allRows.slice((tablePage - 1) * rowsPerPage, tablePage * rowsPerPage);

  const goToTablePage = (next: number) => {
    if (next < 1 || next > totalTablePages) return;
    setTablePage(next);
    if (tableRef.current) tableRef.current.scrollLeft = 0;
  };

  const handleRowsPerPageChange = (value: number) => {
    setRowsPerPage(value);
    setTablePage(1);
  };

  const summary = data?.summary;

  //---------Use Jspdf for pdf----------

  const handleExport = async () => {
    if (!summary) return;
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const now = new Date().toLocaleString("en-IN");
    const receiptNo = `ERN-${Date.now()}`;

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("HealPoint", 15, 18);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Earnings Report — Admin Dashboard", 15, 27);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Earnings Report", 15, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Report ID: ${receiptNo}`, 15, 58);
    doc.text(`Generated On: ${now}`, 15, 64);
    doc.text(`Year: ${year}`, 15, 70);

    let y = 84;
    const sectionTitle = (text: string) => {
      doc.setFillColor(239, 246, 255);
      doc.rect(15, y, 180, 10, "F");
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(text, 20, y + 7);
      y += 18;
    };
    const infoRow = (label: string, value: string) => {
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(label, 20, y);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(value || "—", 100, y);
      y += 8;
    };

    sectionTitle("Summary");
    infoRow("Total Revenue", formatINR(summary.totalRevenue));
    infoRow("Total Consultations", String(summary.totalConsultations));
    infoRow("Avg per Consultation", formatINR(summary.avgPerConsultation));

    y += 6;
    sectionTitle(`Recent Video Consultations — ${allRows.length} records`);

    const cols = [20, 55, 100, 145, 170];
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y - 4, 180, 10, "F");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    ["#", "Patient", "Doctor", "Date", "Amount"].forEach((h, i) => doc.text(h, cols[i], y + 3));
    y += 12;

    allRows.forEach((row, idx) => {
      if (y > 270) { doc.addPage(); y = 20; }
      if (idx % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(15, y - 4, 180, 9, "F");
      }
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(String(idx + 1), cols[0], y + 2);
      doc.text(row.patient_name || "—", cols[1], y + 2);
      doc.text(row.doctor_name || "—", cols[2], y + 2);
      doc.text(row.consultation_date ? formatDate(row.consultation_date) : "—", cols[3], y + 2);
      doc.setFont("helvetica", "bold");
      doc.text(formatINR(row.amount), cols[4], y + 2);
      y += 9;
    });

    doc.save(`HealPoint_Earnings_${year}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="flex min-h-screen bg-[#f0f4fb]">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-hidden px-3 pb-10 pt-20 sm:px-6 sm:pt-24 lg:px-8 xl:px-7">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-extrabold text-slate-900">
              <FaCalendarAlt className="text-blue-600 text-lg sm:text-xl" />
              Earnings <span className="text-blue-600">Report</span>
            </h1>
            <p className="mt-1 text-[11px] sm:text-xs font-medium text-slate-500">
              Financial overview of video call consultations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => navigate("/admin/earnings/doctors")} className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-extrabold text-blue-600 transition hover:bg-blue-600 hover:text-white">
              <FaUserMd className="text-xs sm:text-sm" />
              <span className="hidden xs:inline sm:inline">Top Earning Doctors</span>
              <span className="xs:hidden sm:hidden">Doctors</span>
            </button>
            <button onClick={handleExport} disabled={!data}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-extrabold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-50">
              <FaDownload className="text-[10px] sm:text-xs" /> Export
            </button>
          </div>
        </div>
        {error && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-white py-16 text-sm font-bold text-blue-500 shadow-sm mb-5">
            <FaSpinner className="animate-spin" /> Loading earnings data…
          </div>
        )}

        {!loading && data && summary && (
          <>
            <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              <StatCard label="Total Revenue" value={formatINR(summary.totalRevenue)} change={summary.revenueChange ?? 0} icon="💰" color="blue" />
              <StatCard label="Total Consultations" value={String(summary.totalConsultations)} change={summary.consultationChange ?? 0} icon="🩺" color="purple" />
              <StatCard label="Avg per Visit" value={formatINR(summary.avgPerConsultation)} change={summary.avgChange ?? 0} icon="📊" color="teal" />
            </div>
            <div className="mb-5 rounded-2xl bg-white p-4 sm:p-5 shadow-lg shadow-blue-100">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xs sm:text-sm font-extrabold text-slate-800">Revenue Trend</h2>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-slate-400">
                    Monthly revenue from video consultations
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Video Call Revenue
                  </span>
                  <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
                    <FaCalendarAlt className="text-blue-400 text-xs" />
                    <select
                      value={year}
                      onChange={(e) => dispatch(setYear(e.target.value))}
                      className="cursor-pointer border-none bg-transparent text-xs font-bold text-slate-700 outline-none"
                    >
                      {YEAR_OPTIONS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <RevenueTrendChart trend={trend} />
            </div>
            <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-lg shadow-blue-100">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xs sm:text-sm font-extrabold text-slate-800">Recent Video Consultations</h2>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-slate-400">Latest video call transactions</p>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <span className="text-[11px] sm:text-xs text-slate-400">Rows per page</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                    className="h-7 sm:h-8 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-[11px] sm:text-xs font-medium text-slate-600 outline-none"
                  >
                    {PAGE_SIZE_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div ref={tableRef} className="overflow-x-auto rounded-xl -mx-1 px-1">
                <table className="w-full border-collapse text-xs sm:text-sm" style={{ minWidth: 500 }}>
                  <thead>
                    <tr className="bg-slate-50 text-left text-[10px] sm:text-xs text-slate-500">
                      <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold">Patient</th>
                      <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold">Doctor</th>
                      <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold hidden sm:table-cell">Type</th>
                      <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold">Date</th>
                      <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-semibold">Amount</th>
                      <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs sm:text-sm font-semibold text-slate-400">
                          No video consultations found.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-100 transition hover:bg-blue-50/40">
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                            <div className="flex items-center gap-2">
                              <img src={row.patient_profile || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.patient_name || "P")}&background=dbeafe&color=1d4ed8`}
                                alt={row.patient_name} className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 rounded-full object-cover" />
                              <span className="text-[11px] sm:text-xs font-bold text-slate-800 truncate max-w-[70px] sm:max-w-none">{row.patient_name || "—"}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                            <div className="flex items-center gap-2">
                              <img src={row.doctor_profile || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.doctor_name || "D")}&background=dcfce7&color=166534`} alt={row.doctor_name}
                                className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 rounded-full object-cover" />
                              <div className="min-w-0">
                                <p className="text-[11px] sm:text-xs font-bold text-slate-800 truncate max-w-[70px] sm:max-w-none">{row.doctor_name || "—"}</p>
                                <p className="text-[9px] sm:text-[10px] text-slate-400 truncate max-w-[70px] sm:max-w-none">{row.specialization}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 hidden sm:table-cell">
                            <span className="inline-flex items-center gap-1 rounded-full px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-extrabold bg-blue-100 text-blue-700 whitespace-nowrap">
                              <FaVideo className="text-[8px] sm:text-[9px]" /> Video Call
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs text-slate-500 whitespace-nowrap">
                            {row.consultation_date ? formatDate(row.consultation_date) : "—"}
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right text-[11px] sm:text-xs font-extrabold text-slate-800 whitespace-nowrap">
                            {formatINR(row.amount)}
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                            <span className={`rounded-full px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-extrabold whitespace-nowrap ${row.payment_status === "paid" ? "bg-green-100 text-green-700"
                              : row.payment_status === "pending" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>
                              {row.payment_status ? row.payment_status.charAt(0).toUpperCase() + row.payment_status.slice(1) : "—"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {totalTablePages > 1 && (
                <div className="mt-4 sm:mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[11px] sm:text-xs text-slate-500">
                  <span>Page {tablePage} of {totalTablePages} — {allRows.length} total</span>
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                    <button disabled={tablePage <= 1} onClick={() => goToTablePage(tablePage - 1)}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 transition disabled:cursor-not-allowed disabled:opacity-40">
                      <FaChevronLeft className="text-[10px] sm:text-xs" />
                    </button>
                    {(() => {
                      const pages: (number | string)[] = [];
                      if (totalTablePages <= 7) {
                        for (let i = 1; i <= totalTablePages; i++) pages.push(i);
                      } else {
                        pages.push(1);
                        if (tablePage > 3) pages.push("...");
                        for (let i = Math.max(2, tablePage - 1); i <= Math.min(totalTablePages - 1, tablePage + 1); i++) pages.push(i);
                        if (tablePage < totalTablePages - 2) pages.push("...");
                        pages.push(totalTablePages);
                      }
                      return pages.map((p, i) =>
                        p === "..." ? (
                          <button key={`dot-${i}`} onClick={() => goToTablePage(i === 1 ? Math.max(1, tablePage - 5) : Math.min(totalTablePages, tablePage + 5))}
                            className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer flex items-center justify-center rounded-xl border border-slate-200 text-[10px] sm:text-xs text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition">
                            …
                          </button>
                        ) : (
                          <button key={p} onClick={() => goToTablePage(Number(p))} className={`h-7 w-7 sm:h-8 sm:w-8 cursor-pointer rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-200 ${p === tablePage ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                            {p}
                          </button>
                        )
                      );
                    })()}
                    <button disabled={tablePage >= totalTablePages} onClick={() => goToTablePage(tablePage + 1)}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 transition disabled:cursor-not-allowed disabled:opacity-40">
                      <FaChevronRight className="text-[10px] sm:text-xs" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminEarningsReport;