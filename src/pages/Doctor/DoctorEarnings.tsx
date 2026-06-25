import { useEffect, useRef, useState } from "react";
import { FaRupeeSign, FaCalendarCheck, FaCheckCircle, FaWallet, FaDownload, FaVideo, FaHospital, FaChevronLeft, FaChevronRight, FaCalendarAlt, FaChevronDown } from "react-icons/fa";
import { DoctorSidebar } from "./DoctorSidebar";
import API from "../../api/axios";
import type { Summary, Payment, MonthlyData } from "../../types/doctor";
import { useAppDispatch } from "../../store/hooks";
import { clearEarningNotification, setEarningNotification } from "../../store/slices/NotificationSlice";
import usePageTitle from "../../hooks/usePageTitle";

//--------Helper Functions----------

const SEEN_KEY = "doctor_seen_earning_ids";
const PAGE_OPTIONS = [5, 10, 25, 50];

//------Safely access the data using this shape---------

const extractArray = (res: any, key: string): any[] => {
  const d = res?.data;
  if (Array.isArray(d?.[key])) return d[key];
  if (Array.isArray(d?.data?.[key])) return d.data[key];
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d)) return d;
  return [];
};

const extractSummary = (res: any): Summary | null => {
  const d = res?.data;
  return d?.data ?? d ?? null;
};

//-----main Component-----------

export const DoctorEarnings = () => {
  usePageTitle("My Earnings");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(5);
  const [showLimitDropdown, setShowLimitDropdown] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const dispatch = useAppDispatch();
  const isOnPage = useRef(false);
  const totalPages = Math.ceil(totalPayments / pageLimit);
  const [slideDirection, setSlideDirection] = useState<"right" | "left">("right");
  const [animKey, setAnimKey] = useState(0);
  const limitDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (limitDropdownRef.current && !limitDropdownRef.current.contains(e.target as Node)) {
        setShowLimitDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  //--------Fetch the Earnings data in different APIs Parallely using Promise.all---

  useEffect(() => {
    const fetchSummaryAndMonthly = async () => {
      try {
        setLoading(true);
        setError(null);
        const [sumRes, monRes, allPayRes] = await Promise.all([
          API.get("/doctor/earnings/summary"),
          API.get("/doctor/earnings/monthly"),
          API.get("/doctor/earnings/payments", { params: { page: 1, limit: 1000 } }),
        ]);
        const rawSummary = extractSummary(sumRes) ?? {
          total_earnings: 0, paid_appointments: 0, completed_appointments: 0,
          video_earnings: 0, clinic_earnings: 0,
        };
        const rawMonthly: MonthlyData[] = extractArray(monRes, "monthly");
        const allPayments: Payment[] = allPayRes.data?.data?.payments ?? [];
        const video = allPayments.filter(p => p.type === "Video Call").reduce((s, p) => s + p.amount, 0);
        const clinic = allPayments.filter(p => p.type !== "Video Call").reduce((s, p) => s + p.amount, 0);
        setSummary({
          ...rawSummary,
          video_earnings: rawSummary.video_earnings > 0 ? rawSummary.video_earnings : video,
          clinic_earnings: rawSummary.clinic_earnings > 0 ? rawSummary.clinic_earnings : clinic,
        });
        setMonthly(rawMonthly);
      } catch (err) {
        setError("Failed to load earnings data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchSummaryAndMonthly();
  }, []);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setPaymentsLoading(true);
        const params: any = { page: currentPage, limit: pageLimit };
        if (dateFilter) params.date = dateFilter;
        const payRes = await API.get("/doctor/earnings/payments", { params });
        const rawPayments: Payment[] = payRes.data?.data?.payments ?? [];
        const total = payRes.data?.data?.totalItems ?? 0;
        setPayments(rawPayments);
        setTotalPayments(total);
      } catch (err) {
        console.error("Payments fetch error:", err);
      } finally {
        setPaymentsLoading(false);
      }
    };
    fetchPayments();
  }, [currentPage, dateFilter, pageLimit]);

  useEffect(() => {
    isOnPage.current = true;
    dispatch(clearEarningNotification());
    return () => { isOnPage.current = false; };
  }, [dispatch]);

  useEffect(() => {
    if (payments.length === 0) return;
    const currentIds = payments.map((a) => a.id);
    if (isOnPage.current) {
      localStorage.setItem(SEEN_KEY, JSON.stringify(currentIds));
      dispatch(clearEarningNotification());
    } else {
      const raw = localStorage.getItem(SEEN_KEY);
      if (raw === null) {
        localStorage.setItem(SEEN_KEY, JSON.stringify(currentIds));
      } else {
        const seenIds: number[] = JSON.parse(raw);
        const hasNew = currentIds.some((id) => !seenIds.includes(id));
        if (hasNew) dispatch(setEarningNotification());
      }
    }
  }, [payments, dispatch]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleClearDate = () => {
    setDateFilter("");
    setCurrentPage(1);
  };

  const handleLimitChange = (limit: number) => {
    setPageLimit(limit);
    setCurrentPage(1);
    setShowLimitDropdown(false);
    setAnimKey(k => k + 1);
  };

  const transactionTotal = payments.reduce((sum, p) => sum + p.amount, 0);

  const statCards = [
    { icon: <FaWallet />, label: "Total Earnings", value: `₹${(summary?.total_earnings ?? 0).toLocaleString("en-IN")}`, iconBg: "bg-blue-600", accent: "from-blue-50 to-white" },
    { icon: <FaCalendarCheck />, label: "Paid Appointments", value: summary?.paid_appointments ?? "—", iconBg: "bg-sky-500", accent: "from-sky-50 to-white" },
    { icon: <FaCheckCircle />, label: "Completed", value: summary?.completed_appointments ?? "—", iconBg: "bg-blue-500", accent: "from-blue-50 to-white" },
  ];

  const handleExportPDF = async () => {
    if (exportLoading) return;
    setExportLoading(true);
    let allPayments: Payment[] = [];
    try {
      const res = await API.get("/doctor/earnings/payments", { params: { page: 1, limit: 10000 } });
      allPayments = res.data?.data?.payments ?? [];
    } catch (err) {
      setExportLoading(false);
      return;
    }
    if (!allPayments.length) { setExportLoading(false); return; }
    const allTransactionTotal = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const now = new Date().toLocaleString("en-IN");
    const receiptNo = `EARN-${Date.now()}`;
    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.text("HealPoint", 15, 18);
    doc.setFontSize(11); doc.setFont("helvetica", "normal"); doc.text("Doctor Earnings Report", 15, 27);
    doc.setTextColor(15, 23, 42); doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.text("Payment History", 15, 50);
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
    doc.text(`Report ID: ${receiptNo}`, 15, 58); doc.text(`Generated On: ${now}`, 15, 64);
    let y = 78;
    const sectionTitle = (title: string) => {
      doc.setFillColor(239, 246, 255); doc.rect(15, y, 180, 10, "F");
      doc.setTextColor(37, 99, 235); doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(title, 20, y + 7); y += 18;
    };
    const infoRow = (label: string, value: string) => {
      doc.setTextColor(100, 116, 139); doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text(label, 20, y);
      doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold"); doc.text(value || "—", 90, y); y += 8;
    };
    sectionTitle("Earnings Summary");
    infoRow("Total Earnings", `Rs. ${(summary?.total_earnings ?? 0).toLocaleString("en-IN")}`);
    infoRow("Paid Appointments", String(summary?.paid_appointments ?? 0));
    infoRow("Completed Appointments", String(summary?.completed_appointments ?? 0));
    infoRow("Video Call Earnings", `Rs. ${(summary?.video_earnings ?? 0).toLocaleString("en-IN")}`);
    infoRow("Clinic Visit Earnings", `Rs. ${(summary?.clinic_earnings ?? 0).toLocaleString("en-IN")}`);
    y += 6; sectionTitle("Payment Transactions");
    doc.setFillColor(248, 250, 252); doc.rect(15, y - 4, 180, 10, "F");
    doc.setTextColor(100, 116, 139); doc.setFontSize(9); doc.setFont("helvetica", "bold");
    const cols = [20, 48, 93, 130, 158, 183];
    ["#", "Patient", "Date & Time", "Type", "Amount", "Status"].forEach((h, i) => doc.text(h, cols[i], y + 3));
    y += 12;
    allPayments.forEach((p, idx) => {
      if (y > 270) { doc.addPage(); y = 20; }
      if (idx % 2 === 0) { doc.setFillColor(249, 250, 251); doc.rect(15, y - 4, 180, 9, "F"); }
      doc.setTextColor(15, 23, 42); doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(String(idx + 1), cols[0], y + 2); doc.text(p.patient, cols[1], y + 2);
      doc.text(`${p.date}  ${p.time}`, cols[2], y + 2); doc.text(p.type, cols[3], y + 2);
      doc.setFont("helvetica", "bold"); doc.setTextColor(37, 99, 235);
      doc.text(`Rs. ${p.amount.toLocaleString("en-IN")}`, cols[4], y + 2);
      doc.setFont("helvetica", "normal"); doc.setTextColor(22, 163, 74);
      doc.text(`\u2713 ${p.status}`, cols[5], y + 2); y += 9;
    });
    y += 4; doc.setDrawColor(226, 232, 240); doc.line(15, y, 195, y); y += 8;
    doc.setTextColor(15, 23, 42); doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text(`Total (${allPayments.length} transactions)`, 20, y);
    doc.setTextColor(37, 99, 235); doc.text(`Rs. ${allTransactionTotal.toLocaleString("en-IN")}`, 148, y); y += 18;
    doc.setFillColor(240, 249, 255); doc.rect(15, y, 180, 14, "F");
    doc.setTextColor(37, 99, 235); doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text("This is an auto-generated earnings report from HealPoint.", 20, y + 9);
    doc.save(`HealPoint_Earnings_${receiptNo}.pdf`);
    setExportLoading(false);
  };

  const maxEarnings = Math.max(...monthly.map(m => m.earnings), 1);
  const yMax = Math.ceil(Math.max(...monthly.map(m => m.earnings), 1000) * 1.2);
  const yTicks = (() => {
    const step = Math.ceil(yMax / 5 / 1000) * 1000 || 1000;
    return [0, step, step * 2, step * 3, step * 4, step * 5];
  })();
  const chartHeight = 200;
  const chartPadTop = 20;
  const barAreaHeight = chartHeight - chartPadTop;

  const formatYLabel = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  const rangeStart = totalPayments === 0 ? 0 : (currentPage - 1) * pageLimit + 1;
  const rangeEnd = Math.min(currentPage * pageLimit, totalPayments);

  const paginationPages = (() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  })();

  return (
    <div className="flex min-h-screen bg-[#f0f4fb]">
      <DoctorSidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden px-3 pb-12 pt-16 sm:px-5 sm:pt-20 lg:px-7 lg:pt-22 xl:px-7">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight text-slate-900">
            Payments & <span className="text-blue-600">Earnings</span>
          </h1>
          <p className="mt-0.5 text-xs font-medium text-slate-400">Track your consultation income and payment history.</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
            <span>⚠</span>{error}
          </div>
        )}
        <div className="mb-4 sm:mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {statCards.map((card) => (
            <div key={card.label} className="relative overflow-hidden rounded-xl border border-blue-100 bg-white px-4 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-100">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-60`} />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{card.label}</p>
                  <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                    {loading ? <span className="inline-block h-7 w-24 animate-pulse rounded-xl bg-slate-100" /> : card.value}
                  </p>
                </div>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.iconBg} text-white text-sm shadow-sm`}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mb-4 sm:mb-6 rounded-xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Monthly Earnings</h2>
              <p className="mt-0.5 text-[10px] font-medium text-slate-400">Revenue overview · up to ₹5,00,000</p>
            </div>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-700">2026</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center" style={{ height: chartHeight }}>
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            </div>
          ) : monthly.length === 0 ? (
            <div className="flex items-center justify-center text-xs font-semibold text-slate-400" style={{ height: chartHeight }}>
              No monthly data available
            </div>
          ) : (
            <div className="flex" style={{ height: chartHeight + 36 }}>
              <div className="flex flex-col justify-between pr-2 pb-7" style={{ height: chartHeight }}>
                {[...yTicks].reverse().map((tick) => (
                  <span key={tick} className="text-[9px] font-semibold text-slate-400 leading-none text-right whitespace-nowrap">
                    {formatYLabel(tick)}
                  </span>
                ))}
              </div>
              <div className="flex-1 relative min-w-0">
                <div className="absolute inset-0 pb-7 pointer-events-none">
                  {[...yTicks].reverse().map((tick, i) => (
                    <div key={tick} className="absolute w-full border-t border-slate-100"
                      style={{ top: `${(i / (yTicks.length - 1)) * barAreaHeight}px` }} />
                  ))}
                </div>
                <div className="absolute top-0 left-0 right-0 flex items-end justify-around pb-7" style={{ height: chartHeight }}>
                  {monthly.map((m, i) => {
                    const barH = Math.max(4, (m.earnings / yMax) * barAreaHeight);
                    const isHovered = hoveredBar === i;
                    const isMax = m.earnings === maxEarnings && m.earnings > 0;
                    return (
                      <div key={i} className="relative flex flex-col items-center flex-1 mx-0.5"
                        onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)} style={{ cursor: "pointer" }}>
                        {isHovered && (
                          <div className="absolute z-20 whitespace-nowrap rounded-xl bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-xl pointer-events-none" style={{ bottom: barH + 10 }}>
                            <p className="text-slate-400 text-[9px] mb-0.5">{m.month}</p>
                            <p className="text-blue-300">₹{m.earnings.toLocaleString("en-IN")}</p>
                            <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-slate-900" />
                          </div>
                        )}
                        <div className="relative w-full max-w-[32px] rounded-t-xl transition-all duration-300"
                          style={{ height: barH, background: isHovered ? "linear-gradient(180deg, #1d4ed8 0%, #3b82f6 100%)" : isMax ? "linear-gradient(180deg, #2563eb 0%, #60a5fa 100%)" : "linear-gradient(180deg, #93c5fd 0%, #bfdbfe 100%)", boxShadow: isHovered ? "0 8px 24px 0 #3b82f650" : isMax ? "0 4px 16px 0 #3b82f630" : "none", transform: isHovered ? "scaleY(1.03)" : "scaleY(1)", transformOrigin: "bottom" }}>
                          <div className="absolute top-0 left-0 right-0 rounded-t-xl opacity-30" style={{ height: "35%", background: "linear-gradient(180deg, #fff 0%, transparent 100%)" }} />
                          {(isMax || isHovered) && (
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-extrabold text-blue-600">
                              ₹{m.earnings >= 1000 ? `${(m.earnings / 1000).toFixed(0)}k` : m.earnings}
                            </div>
                          )}
                        </div>
                        <span className="mt-1.5 text-[9px] font-bold text-slate-400 select-none">{m.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {!loading && monthly.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl bg-blue-50 px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[10px] text-slate-500">Total</span>
                <b className="text-[10px] text-slate-800">₹{monthly.reduce((s, m) => s + m.earnings, 0).toLocaleString("en-IN")}</b>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-300" />
                <span className="text-[10px] text-slate-500">Peak</span>
                <b className="text-[10px] text-slate-800">{monthly.reduce((best, m) => m.earnings > best.earnings ? m : best).month}</b>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-200" />
                <span className="text-[10px] text-slate-500">Avg/Month</span>
                <b className="text-[10px] text-slate-800">₹{Math.round(monthly.reduce((s, m) => s + m.earnings, 0) / monthly.length).toLocaleString("en-IN")}</b>
              </div>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-blue-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Payment History</h2>
              <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                {paymentsLoading ? "Loading…" : `${totalPayments} completed transaction${totalPayments !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                <FaCalendarAlt className="text-xs text-blue-400 shrink-0" />
                <input type="date" value={dateFilter} onChange={handleDateChange}
                  className="border-none bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer" />
                {dateFilter && (
                  <button onClick={handleClearDate} className="ml-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-red-100 hover:text-red-500 font-bold text-xs">✕</button>
                )}
              </div>
              <button onClick={handleExportPDF} disabled={exportLoading || paymentsLoading}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                {exportLoading ? (
                  <><div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /><span>Exporting...</span></>
                ) : (
                  <><FaDownload className="text-[10px]" /><span>Export PDF</span></>
                )}
              </button>
            </div>
          </div>

          <div className="px-3 sm:px-5 py-3 sm:py-4">
            {paymentsLoading ? (
              <div className="space-y-3 py-4">
                {[...Array(pageLimit)].map((_, i) => (
                  <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : payments.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-300 text-xl">
                  <FaRupeeSign />
                </div>
                <p className="font-bold text-slate-400 text-xs">
                  {dateFilter ? "No payment records found for this date." : "No payment records found."}
                </p>
              </div>
            ) : (
              <div key={animKey} className={`overflow-x-auto ${slideDirection === "right" ? "slide-in-right" : "slide-in-left"}`}
                style={{ scrollbarWidth: "thin", scrollbarColor: "#CBD5E1 transparent" }}>
                <table className="w-full border-collapse text-sm" style={{ minWidth: "560px" }}>
                  <thead>
                    <tr>
                      {["#", "Patient", "Date & Time", "Type", "Amount", "Status"].map((h) => (
                        <th key={h} className="bg-slate-50 px-3 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest text-slate-400 first:rounded-l-xl last:rounded-r-xl">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((item, index) => (
                      <tr key={item.id} className="group border-b border-slate-50 transition-colors duration-150 hover:bg-blue-50/50 last:border-0">
                        <td className="px-3 py-3 text-xs font-bold text-slate-300">
                          {(currentPage - 1) * pageLimit + index + 1}
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-xs font-extrabold text-slate-900 truncate max-w-[100px] block">{item.patient}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <p className="font-bold text-slate-700 text-[10px]">{item.date}</p>
                          <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{item.time}</p>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${item.type === "Video Call" ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100" : "bg-sky-50 text-sky-700 ring-1 ring-sky-100"}`}>
                            {item.type === "Video Call" ? <FaVideo className="text-[8px]" /> : <FaHospital className="text-[8px]" />}
                            <span className="hidden sm:inline">{item.type}</span>
                            <span className="sm:hidden">{item.type === "Video Call" ? "Video" : "Clinic"}</span>
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-0.5 text-sm font-extrabold text-blue-600">
                            <FaRupeeSign className="text-[10px]" />
                            {item.amount.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                            <span className="text-[9px]">✓</span>{item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {(!paymentsLoading && payments.length > 0) && (
            <div className="border-t border-slate-100 px-3 sm:px-5 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2">
                <p className="text-[10px] font-bold text-slate-500">
                  Page {currentPage} · {payments.length} transaction{payments.length !== 1 ? "s" : ""}
                </p>
                <div className="h-4 w-px bg-blue-200" />
                <p className="text-sm font-extrabold text-blue-600">₹{transactionTotal.toLocaleString("en-IN")}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setSlideDirection("left"); setAnimKey(k => k + 1); setCurrentPage(p => Math.max(1, p - 1)); }} disabled={currentPage === 1}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                      <FaChevronLeft className="text-[10px]" />
                    </button>
                    {paginationPages.map((p, idx) =>
                      p === "..." ? (
                        <button key={`e-${idx}`} onClick={() => { setSlideDirection(idx === 1 ? "left" : "right"); setAnimKey(k => k + 1); setCurrentPage(idx === 1 ? Math.max(1, currentPage - 5) : Math.min(totalPages, currentPage + 5)); }}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-xs text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition">
                          …
                        </button>
                      ) : (
                        <button key={p} onClick={() => { setSlideDirection((p as number) > currentPage ? "right" : "left"); setAnimKey(k => k + 1); setCurrentPage(p as number); }}
                          className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-xs font-extrabold transition shadow-sm ${currentPage === p ? "bg-blue-600 text-white shadow-blue-200" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                          {p}
                        </button>
                      )
                    )}
                    <button onClick={() => { setSlideDirection("right"); setAnimKey(k => k + 1); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                      disabled={currentPage === totalPages} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                      <FaChevronRight className="text-[10px]" />
                    </button>
                  </div>
                )}
                <div className="relative" ref={limitDropdownRef}>
                  <button onClick={() => setShowLimitDropdown(v => !v)} className="flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 cursor-pointer">
                    <span>{pageLimit}</span>
                    <FaChevronDown className={`text-[9px] text-slate-400 transition-transform ${showLimitDropdown ? "rotate-180" : ""}`} />
                  </button>
                  {showLimitDropdown && (
                    <div className="absolute bottom-10 right-0 z-50 w-20 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                      {PAGE_OPTIONS.map(opt => (
                        <button key={opt} onClick={() => handleLimitChange(opt)}
                          className={`w-full px-3 py-2 text-left text-xs font-bold transition cursor-pointer ${pageLimit === opt ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-blue-600 whitespace-nowrap">
                  {rangeStart}–{rangeEnd} of {totalPayments}
                </span>
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes slideRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes slideLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
          .slide-in-right { animation: slideRight 0.35s ease; }
          .slide-in-left { animation: slideLeft 0.35s ease; }
        `}</style>
      </main>
    </div>
  );
};

export default DoctorEarnings;