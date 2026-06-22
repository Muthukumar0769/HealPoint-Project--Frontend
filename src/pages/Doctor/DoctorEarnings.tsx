import { useEffect, useRef, useState } from "react";
import { FaRupeeSign, FaCalendarCheck, FaCheckCircle, FaWallet, FaDownload, FaVideo, FaHospital, FaChevronLeft, FaChevronRight, FaCalendarAlt } from "react-icons/fa";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { DoctorSidebar } from "./DoctorSidebar";
import API from "../../api/axios";
import type { Summary, Payment, MonthlyData } from "../../types/doctor";
import { useAppDispatch } from "../../store/hooks";
import { clearEarningNotification, setEarningNotification } from "../../store/slices/NotificationSlice";
import usePageTitle from "../../hooks/usePageTitle";

const SEEN_KEY = "doctor_seen_earning_ids";
const PIE_COLOR_VIDEO = "#2563EB";
const PIE_COLOR_CLINIC = "#38BDF8";
const PAGE_LIMIT = 5;

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-xl">
      {label && <p className="mb-1 text-xs font-semibold text-slate-400">{label}</p>}
      <p>₹{Number(payload[0].value).toLocaleString("en-IN")}</p>
    </div>
  );
};

export const DoctorEarnings = () => {
  usePageTitle("My Earnings");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("");
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const isOnPage = useRef(false);
  const totalPages = Math.ceil(totalPayments / PAGE_LIMIT);
  const [slideDirection, setSlideDirection] = useState<"right" | "left">("right");
  const [animKey, setAnimKey] = useState(0);

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
        console.error("Earnings fetch error:", err);
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
        const params: any = { page: currentPage, limit: PAGE_LIMIT };
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
  }, [currentPage, dateFilter]);

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

  const pieData = summary && (summary.video_earnings > 0 || summary.clinic_earnings > 0)
    ? [
      { name: "Video Call", value: summary.video_earnings },
      { name: "Clinic Visit", value: summary.clinic_earnings },
    ]
    : [];

  const transactionTotal = payments.reduce((sum, p) => sum + p.amount, 0);

  const statCards = [
    {
      icon: <FaWallet />,
      label: "Total Earnings",
      value: `₹${(summary?.total_earnings ?? 0).toLocaleString("en-IN")}`,
      iconBg: "bg-blue-600",
      accent: "from-blue-50 to-white",
    },
    {
      icon: <FaCalendarCheck />,
      label: "Paid Appointments",
      value: summary?.paid_appointments ?? "—",
      iconBg: "bg-sky-500",
      accent: "from-sky-50 to-white",
    },
    {
      icon: <FaCheckCircle />,
      label: "Completed",
      value: summary?.completed_appointments ?? "—",
      iconBg: "bg-blue-500",
      accent: "from-blue-50 to-white",
    },
  ];

  const handleExportPDF = async () => {
    if (exportLoading) return;
    setExportLoading(true);

    let allPayments: Payment[] = [];
    try {
      const res = await API.get("/doctor/earnings/payments", {
        params: { page: 1, limit: 10000 },
      });
      allPayments = res.data?.data?.payments ?? [];
    } catch (err) {
      console.error("Export fetch error:", err);
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

  return (
    <div className="flex min-h-screen bg-[#f0f4fb]">
      <DoctorSidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden px-4 pb-16 pt-24 sm:px-8 lg:px-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Payments & <span className="text-blue-600">Earnings</span>
            </h1>
          </div>
          <p className="ml-4 text-sm font-medium text-slate-400 pl-4">Track your consultation income and payment history.</p>
        </div>
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
            <span className="text-base">⚠</span>
            {error}
          </div>
        )}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {statCards.map((card) => (
            <div key={card.label} className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white px-6 py-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-100">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-60`} />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{card.label}</p>
                  <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                    {loading ? <span className="inline-block h-8 w-28 animate-pulse rounded-xl bg-slate-100" /> : card.value}
                  </p>
                </div>
                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${card.iconBg} text-white text-base shadow-sm`}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Monthly Earnings</h2>
                <p className="mt-0.5 text-xs font-medium text-slate-400">Revenue over the last 6 months</p>
              </div>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-xs font-bold text-blue-700">2026</span>
            </div>
            <div className="h-[220px]">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                </div>
              ) : monthly.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">No monthly data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} margin={{ top: 6, right: 8, left: -20, bottom: 0 }} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis
                      domain={[0, 10000]}
                      ticks={[0, 500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000]}
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v}`}/>
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#EFF6FF" }} />
                    <Bar dataKey="earnings" fill="#2563EB" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="xl:col-span-2 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm flex flex-col">
            <div className="mb-4">
              <h2 className="text-base font-extrabold text-slate-900">Earnings Breakdown</h2>
              <p className="mt-0.5 text-xs font-medium text-slate-400">Split by consultation type</p>
            </div>
            <div className="h-[160px] flex-shrink-0">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                </div>
              ) : pieData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={4} dataKey="value">
                      <Cell key="cell-video" fill={PIE_COLOR_VIDEO} />
                      <Cell key="cell-clinic" fill={PIE_COLOR_CLINIC} />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-auto space-y-2.5 pt-4">
              <LegendItem icon={<FaVideo />} title="Video Call" amount={summary?.video_earnings ?? 0} iconBg={PIE_COLOR_VIDEO} text="text-blue-700" />
              <LegendItem icon={<FaHospital />} title="Clinic Visit" amount={summary?.clinic_earnings ?? 0} iconBg={PIE_COLOR_CLINIC} text="text-sky-700" />
              <div className="flex items-center justify-between rounded-xl bg-blue-600 px-4 py-3.5 mt-1">
                <span className="text-xs font-bold text-blue-100">Total Received</span>
                <span className="text-lg font-extrabold text-white">₹{(summary?.total_earnings ?? 0).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Payment History</h2>
              <p className="mt-0.5 text-xs font-medium text-slate-400">
                {paymentsLoading ? "Loading…" : `${totalPayments} completed transaction${totalPayments !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2">
                <FaCalendarAlt className="text-xs text-blue-400 flex-shrink-0" />
                <input type="date" value={dateFilter} onChange={handleDateChange}
                  className="border-none bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"/>
                {dateFilter && (
                  <button onClick={handleClearDate} className="ml-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-red-100 hover:text-red-500 font-bold text-xs">
                    ✕
                  </button>
                )}
              </div>
              <button onClick={handleExportPDF} disabled={exportLoading || paymentsLoading} className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-200 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50">
                {exportLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FaDownload className="text-xs" />
                    Export PDF
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="px-6 py-4">
            {paymentsLoading ? (
              <div className="space-y-3 py-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 w-full animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : payments.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-300 text-2xl">
                  <FaRupeeSign />
                </div>
                <p className="font-bold text-slate-400 text-sm">
                  {dateFilter ? "No payment records found for this date." : "No payment records found."}
                </p>
              </div>
            ) : (
              <div key={animKey} className={`overflow-x-auto ${slideDirection === "right" ? "slide-in-right" : "slide-in-left"}`}>
                <table className="w-full min-w-[680px] border-collapse text-sm">
                  <thead>
                    <tr className="rounded-xl">
                      {["#", "Patient", "Date & Time", "Type", "Amount", "Status"].map((h) => (
                        <th key={h} className="bg-slate-50 px-4 py-3 text-left text-xs font-extrabold uppercase tracking-widest text-slate-400 first:rounded-l-xl last:rounded-r-xl">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((item, index) => (
                      <tr key={item.id} className="group border-b border-slate-50 transition-colors duration-150 hover:bg-blue-50/50 last:border-0">
                        <td className="px-4 py-4 text-xs font-bold text-slate-300">
                          {(currentPage - 1) * PAGE_LIMIT + index + 1}
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-extrabold text-slate-900">{item.patient}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <p className="font-bold text-slate-700 text-xs">{item.date}</p>
                          <p className="mt-0.5 text-xs font-semibold text-slate-400">{item.time}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                              item.type === "Video Call" ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                                : "bg-sky-50 text-sky-700 ring-1 ring-sky-100"}`}>
                            {item.type === "Video Call" ? <FaVideo className="text-[9px]" /> : <FaHospital className="text-[9px]" />}
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 text-base font-extrabold text-blue-600">
                            <FaRupeeSign className="text-xs" />
                            {item.amount.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                            <span className="text-[10px]">✓</span>
                            {item.status}
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
            <div className="border-t border-slate-100 px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                <p className="text-xs font-bold text-slate-500">
                  Page {currentPage} · {payments.length} transaction{payments.length !== 1 ? "s" : ""}
                </p>
                <div className="h-4 w-px bg-blue-200" />
                <p className="text-base font-extrabold text-blue-600">₹{transactionTotal.toLocaleString("en-IN")}</p>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <p className="mr-2 hidden text-xs font-semibold text-slate-400 sm:block">
                    {(currentPage - 1) * PAGE_LIMIT + 1}–{Math.min(currentPage * PAGE_LIMIT, totalPayments)} of {totalPayments}
                  </p>

                  <button onClick={() => {
                      setSlideDirection("left");
                      setAnimKey(k => k + 1);
                      setCurrentPage((p) => Math.max(1, p - 1));
                    }}
                    disabled={currentPage === 1}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 shadow-sm transition hover:bg-blue-50 hover:border-blue-200 disabled:cursor-not-allowed disabled:opacity-40">
                    <FaChevronLeft className="text-xs" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce((acc: (number | string)[], p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === "..." ? (
                        <span key={`ellipsis-${idx}`} className="px-1 text-xs font-bold text-slate-400">…</span>
                      ) : (
                        <button key={p}
                          onClick={() => {
                            setSlideDirection((p as number) > currentPage ? "right" : "left");
                            setAnimKey(k => k + 1);
                            setCurrentPage(p as number);
                          }}
                          className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-xs font-extrabold transition ${
                            currentPage === p ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                              : "border border-blue-100 bg-white text-slate-600 hover:bg-blue-50 hover:border-blue-200"}`}>
                          {p}
                        </button>
                      )
                    )}

                  <button onClick={() => {
                      setSlideDirection("right");
                      setAnimKey(k => k + 1);
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                    }}
                    disabled={currentPage === totalPages}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 shadow-sm transition hover:bg-blue-50 hover:border-blue-200 disabled:cursor-not-allowed disabled:opacity-40">
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const LegendItem = ({icon,title,amount,iconBg,text}: {
  icon: React.ReactNode;
  title: string;
  amount: number;
  iconBg: string;
  text: string;
}) => (
  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white text-xs"
        style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <span className="text-sm font-bold text-slate-700">{title}</span>
    </div>
    <span className={`text-sm font-extrabold ${text}`}>₹{amount.toLocaleString("en-IN")}</span>
  </div>
);

export default DoctorEarnings;