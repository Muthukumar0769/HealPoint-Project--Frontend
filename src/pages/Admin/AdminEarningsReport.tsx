import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaDownload, FaVideo, FaSpinner, FaUserMd, } from "react-icons/fa";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, } from "recharts";
import { AdminSidebar } from "./AdminSidebar";
import { fetchEarningsDashboard, setFilter, setPage, } from "../../store/slices/AdminEarningsSlice";
import type { RootState, AppDispatch } from "../../store/store";
import type { RecentConsultation } from "../../types/admin";
import usePageTitle from "../../hooks/usePageTitle";

const ROWS_PER_PAGE = 5;
const FILTERS = ["week", "month", "year"] as const;
type FilterType = "week" | "month" | "year";

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

export const AdminEarningsReport = () => {
  usePageTitle("Earnings Report");
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const tableRef = useRef<HTMLDivElement>(null);
  const { data, loading, error, filter, page } = useSelector((state: RootState) => state.adminEarnings);
  const [tablePage, setTablePage] = useState(1);

  useEffect(() => {
    dispatch(fetchEarningsDashboard({ filter, page }));
  }, [filter, page, dispatch]);

  useEffect(() => {
    setTablePage(1);
  }, [filter]);

  const handleFilterChange = (f: FilterType) => {
    dispatch(setFilter(f));
    dispatch(setPage(1));
  };

  const allRows: RecentConsultation[] = (data?.recentConsultations?.rows ?? []).filter((r) => r.consultation_type === "video_call");
  const totalTablePages = Math.ceil(allRows.length / ROWS_PER_PAGE);
  const paginatedRows = allRows.slice((tablePage - 1) * ROWS_PER_PAGE, tablePage * ROWS_PER_PAGE);

  const goToTablePage = (next: number) => {
    if (next < 1 || next > totalTablePages) return;
    setTablePage(next);
    if (tableRef.current) tableRef.current.scrollLeft = 0;
  };

  const summary = data?.summary;

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
    doc.text(`Filter: ${filter.charAt(0).toUpperCase() + filter.slice(1)}`, 15, 70);

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

    doc.save(`HealPoint_Earnings_${filter}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="flex min-h-screen bg-[#f0f4fb]">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-hidden px-3 pb-10 pt-20 sm:px-6 sm:pt-24 lg:px-8">
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
            <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-blue-100">
              {FILTERS.map((f) => (
                <button key={f} onClick={() => handleFilterChange(f)}
                  className={`cursor-pointer px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-extrabold transition ${filter === f ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
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
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-xs sm:text-sm font-extrabold text-slate-800">Revenue Trend</h2>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-slate-400">Video call earnings over time</p>
                </div>
                <div className="flex items-center gap-4 text-[11px] sm:text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-sm bg-blue-600" /> Video Call
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVideo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={48}
                    tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                  <Tooltip formatter={(value) => [formatINR(Number(value))]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 11 }} />
                  <Area type="monotone" dataKey="videoCall" name="Video Call" stroke="#2563eb"
                    strokeWidth={2} fill="url(#colorVideo)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-lg shadow-blue-100">
              <div className="mb-4">
                <h2 className="text-xs sm:text-sm font-extrabold text-slate-800">Recent Video Consultations</h2>
                <p className="mt-0.5 text-[11px] sm:text-xs text-slate-400">Latest video call transactions</p>
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
                    {Array.from({ length: totalTablePages }, (_, i) => i + 1).map((p) => (
                      <button key={p} onClick={() => goToTablePage(p)} className={`h-7 w-7 sm:h-8 sm:w-8 cursor-pointer rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-200 ${p === tablePage ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                        {p}
                      </button>
                    ))}
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