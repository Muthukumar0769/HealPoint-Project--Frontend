import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaArrowLeft, FaSearch, FaChevronLeft, FaChevronRight, FaTrophy, FaSpinner, FaUserMd, } from "react-icons/fa";
import { AdminSidebar } from "./AdminSidebar";
import API from "../../api/axios";
import type { ApiData } from "../../types/admin";
import usePageTitle from "../../hooks/usePageTitle";

const formatINR = (val: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
type FilterType = "week" | "month" | "year";
const LIMIT = 5;
const RANK_COLORS = ["text-yellow-500", "text-slate-400", "text-orange-400"];
const RANK_BG = ["bg-yellow-50", "bg-slate-50", "bg-orange-50"];

export const AdminDoctorEarnings = () => {
  usePageTitle("Doctor Earnings");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialFilter = (searchParams.get("filter") as FilterType) ?? "month";
  const [filter] = useState<FilterType>(initialFilter);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [allRows, setAllRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const [animating, setAnimating] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);

  const fetchData = async (pageNum: number, currentFilter: FilterType, searchQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      const first = await API.get("/admin/dashboard/appointmentsOverview", {
        params: { page: 1, limit: LIMIT, filter: currentFilter, search: searchQuery },
      });
      if (!first.data?.success) { setError("Failed to load data."); return; }

      const totalPages = first.data.data.doctorSummary.totalPages;
      const restRequests = Array.from({ length: totalPages - 1 }, (_, i) =>
        API.get("/admin/dashboard/appointmentsOverview", {
          params: { page: i + 2, limit: LIMIT, filter: currentFilter, search: searchQuery },
        })
      );
      const restResponses = await Promise.all(restRequests);
      const allData = [first, ...restResponses].flatMap(
        r => r.data?.data?.doctorSummary?.rows ?? []
      );
      const sorted = [...allData].sort((a, b) => b.earnings - a.earnings);
      const filtered = searchQuery
        ? sorted.filter(d =>d.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.specialization.toLowerCase().includes(searchQuery.toLowerCase())
        ): sorted;
      setAllRows(filtered);
      setApiData({
        doctorSummary: {
          totalRecords: filtered.length,
          totalPages: Math.ceil(filtered.length / LIMIT),
          currentPage: pageNum,
          rows: [],
        },
        insights: first.data.data.insights,
      });
    } catch (err) {
      console.error("Failed to fetch doctor earnings:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); fetchData(1, filter, search); }, [filter]);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
    fetchData(1, filter, val);
  };

  const goToPage = (nextPage: number) => {
    if (animating || nextPage === page) return;
    const dir = nextPage > page ? "right" : "left";
    setSlideDir(dir);
    setAnimating(true);
    setTimeout(() => {
      setPage(nextPage);
      setAnimKey((k) => k + 1);
      setSlideDir(dir === "right" ? "left" : "right");
      if (tableRef.current) tableRef.current.scrollLeft = 0;
      setTimeout(() => {
        setAnimating(false);
        setSlideDir(null);
      }, 300);
    }, 200);
  };

  const totalRecords = allRows.length;
  const totalPages = Math.ceil(totalRecords / LIMIT) || 1;
  const currentPage = page;
  const rows = allRows.slice((page - 1) * LIMIT, page * LIMIT);
  const allStats = apiData?.insights.doctorStats ?? [];
  const grandTotalConsultations = allStats.reduce((s, d) => s + d.total, 0);
  const grandTotalEarnings = allRows.reduce((s, d) => s + d.earnings, 0);

  return (
    <div className="flex min-h-screen bg-[#f0f4fb]">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-hidden px-4 pb-10 pt-24 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-blue-50 hover:text-blue-600">
              <FaArrowLeft className="text-xs" />
            </button>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
                <FaTrophy className="text-yellow-500" />
                Top Earning <span className="text-blue-600">Doctors</span>
              </h1>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                All doctors ranked by consultation revenue
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm shadow-blue-100">
            <p className="text-[11px] font-bold text-slate-500">Total Doctors</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{totalRecords}</p>
          </div>
          <div className="rounded-2xl bg-blue-50 p-4 shadow-sm shadow-blue-100">
            <p className="text-[11px] font-bold text-slate-500">Total Earnings</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {loading ? "—" : formatINR(grandTotalEarnings)}
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4 shadow-sm">
            <p className="text-[11px] font-bold text-slate-500">Total Consultations</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {loading ? "—" : grandTotalConsultations.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input type="text" placeholder="Search by name or specialization…" value={search} onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-4 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>
          <p className="text-xs text-slate-400">
            {totalRecords} doctor{totalRecords !== 1 ? "s" : ""} found
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-white py-16 text-sm font-bold text-blue-500 shadow-sm">
            <FaSpinner className="animate-spin" /> Loading doctor earnings…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-6 py-8 text-center">
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <button onClick={() => fetchData(page, filter, search)} className="mt-4 cursor-pointer text-sm text-blue-600 hover:underline">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-blue-100">
            <div ref={tableRef} className="overflow-x-auto">
              <div key={animKey} className={slideDir === "right" ? "slide-in-right" : slideDir === "left" ? "slide-in-left" : ""}>
                <table className="w-full border-collapse text-sm" style={{ minWidth: 600 }}>
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs text-slate-500">
                      <th className="px-4 py-3 font-semibold">Rank</th>
                      <th className="px-4 py-3 font-semibold">Doctor</th>
                      <th className="px-4 py-3 font-semibold">Specialization</th>
                      <th className="px-4 py-3 text-center font-semibold">Total</th>
                      <th className="px-4 py-3 text-center font-semibold">Completed</th>
                      <th className="px-4 py-3 text-center font-semibold">Missed</th>
                      <th className="px-4 py-3 text-right font-semibold">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-sm font-bold text-slate-400">
                          No doctors found{search ? ` matching "${search}"` : ""}.
                        </td>
                      </tr>
                    ) : (
                      rows.map((doc, idx) => {
                        const globalRank = (currentPage - 1) * LIMIT + idx;
                        const isTopThree = globalRank < 3;
                        const rankLabel = globalRank === 0 ? "🥇" : globalRank === 1 ? "🥈" :
                          globalRank === 2 ? "🥉" : `${globalRank + 1}`;
                        const rowBg = isTopThree ? RANK_BG[globalRank] : idx % 2 === 0 ? "bg-white" : "bg-slate-50/60";
                        return (
                          <tr key={doc.doctor_id} className={`border-b border-slate-100 transition hover:bg-blue-50/40 ${rowBg}`}>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-extrabold ${isTopThree ? RANK_COLORS[globalRank] : "text-slate-400"}`}>
                                {rankLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <img src={doc.profile_picture ? doc.profile_picture : `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.doctor_name)}&background=dbeafe&color=1d4ed8`} alt={doc.doctor_name}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.doctor_name)}&background=dbeafe&color=1d4ed8`;
                                  }}
                                  className="h-9 w-9 flex-shrink-0 rounded-full object-cover" />
                                <div>
                                  <p className="text-xs font-extrabold text-slate-800">{doc.doctor_name}</p>
                                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <FaUserMd className="text-blue-400" /> Doctor
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                {doc.specialization}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs font-extrabold text-slate-700">{doc.total}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700">
                                {doc.completed}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-1 text-[10px] font-extrabold text-yellow-600">
                                {doc.missed}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-extrabold text-slate-900">
                                {formatINR(doc.earnings)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
                <span>Showing{" "}
                  <span className="font-semibold text-slate-800">
                    {(currentPage - 1) * LIMIT + 1}–{Math.min(currentPage * LIMIT, totalRecords)}
                  </span>{" "}of <span className="font-semibold text-slate-800">{totalRecords}</span> doctors
                </span>
                <div className="flex items-center gap-1.5">
                  <button disabled={page <= 1 || animating} onClick={() => goToPage(Math.max(1, page - 1))}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 transition disabled:cursor-not-allowed disabled:opacity-40">
                    <FaChevronLeft className="text-xs" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => goToPage(p)} disabled={animating} className={`h-8 w-8 cursor-pointer rounded-xl text-xs font-bold transition-all duration-200 ${p === currentPage ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                      {p}
                    </button>
                  ))}
                  <button disabled={page >= totalPages || animating} onClick={() => goToPage(Math.min(totalPages, page + 1))} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 transition disabled:cursor-not-allowed disabled:opacity-40">
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDoctorEarnings;