import { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { FaSearch, FaUserPlus, FaUsers } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAdminPatients, setSearch, setGenderFilter, setBloodGroupFilter,setStatusFilter, setPage, clearFilters,} from "../../store/slices/AdminPatientSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import type { PatientStatCardProps, FilterDropdownProps } from "../../types/admin";
import usePageTitle from "../../hooks/usePageTitle";

export const AdminPatients = () => {
  usePageTitle("Manage Patients");
  const dispatch = useAppDispatch();
  const { patients, loading, totalPatients, totalPages, currentPage, direction,
         search, genderFilter, bloodGroupFilter, statusFilter,} = useAppSelector((state) => state.adminPatients);
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchAdminPatients());
    }, 400);
    return () => clearTimeout(timer);
  }, [dispatch, currentPage, search, genderFilter, bloodGroupFilter, statusFilter]);

  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const dir = page > currentPage ? 1 : -1;
    dispatch(setPage({ page, dir }));
    window.scrollTo({ top: 200, behavior: "smooth" });
  };

  const totalMale = useMemo(() => patients.filter((p) => p.gender === "Male").length, [patients]);
  const totalFemale = useMemo(() => patients.filter((p) => p.gender === "Female").length, [patients]);

  return (
    <div className="flex min-h-screen bg-[#f0f4fb] pt-16">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-7">
        <div className="mb-4 sm:mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Patient <span className="text-blue-600">Records</span>
            </h1>
            <p className="mt-0.5 text-xs text-slate-400">Manage all registered patients</p>
          </div>
          <button onClick={() => dispatch(clearFilters())} className="self-start rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-blue-600 cursor-pointer shadow-sm hover:bg-blue-600 hover:text-white transition-colors sm:self-auto">
            Clear Filters
          </button>
        </div>
        <div className="mb-4 sm:mb-5 grid grid-cols-3 gap-2 sm:gap-3">
          <StatCard icon={<FaUsers />} title="Total Patients" value={String(totalPatients)} description="All registered patients" accent="bg-blue-500" />
          <StatCard icon={<FaUserPlus />} title="Total Male" value={String(totalMale)} description="Male patients" accent="bg-sky-500" />
          <StatCard icon={<FaUserPlus />} title="Total Female" value={String(totalFemale)} description="Female patients" accent="bg-indigo-400" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          <div className="grid gap-2 sm:gap-3 border-b border-blue-50 bg-white p-3 sm:p-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex h-9 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/40 px-3 col-span-1 xs:col-span-2 sm:col-span-2 lg:col-span-1">
              <FaSearch className="shrink-0 text-blue-300 text-xs" />
              <input type="text" placeholder="Search name or email..." value={search}
                onChange={(e) => dispatch(setSearch(e.target.value))}
                className="h-full w-full bg-transparent text-xs sm:text-sm text-slate-700 outline-none placeholder:text-slate-300" />
            </div>
            <FilterDropdown label="Gender" value={genderFilter} options={["All", "Male", "Female", "Others"]}
              isOpen={openFilter === "gender"}
              onToggle={() => setOpenFilter(openFilter === "gender" ? null : "gender")}
              onSelect={(v) => { dispatch(setGenderFilter(v)); setOpenFilter(null); }} />
            <FilterDropdown label="Blood Group" value={bloodGroupFilter} options={["All", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]}
              isOpen={openFilter === "blood"}
              onToggle={() => setOpenFilter(openFilter === "blood" ? null : "blood")}
              onSelect={(v) => { dispatch(setBloodGroupFilter(v)); setOpenFilter(null); }} />
            <FilterDropdown label="Status" value={statusFilter} options={["All", "Active", "Inactive"]}
              isOpen={openFilter === "status"}
              onToggle={() => setOpenFilter(openFilter === "status" ? null : "status")}
              onSelect={(v) => { dispatch(setStatusFilter(v)); setOpenFilter(null); }} />
          </div>
          <div className="w-full overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentPage}
                custom={direction}
                initial={{ x: direction === 1 ? 100 : -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction === 1 ? -100 : 100, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className={loading ? "opacity-50" : ""}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 700 }}>
                    <thead>
                      <tr className="border-b border-blue-50 bg-blue-50/60">
                        {["#", "Patient", "Email", "Phone", "Gender", "Blood", "DOB", "Registered", "Status"].map((h) => (
                          <th key={h} className="px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-400">
                            <span className="inline-flex items-center gap-2">
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                              Loading patients...
                            </span>
                          </td>
                        </tr>
                      ) : patients.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-xl">👥</div>
                              <p className="text-sm font-semibold text-slate-400">No patients found</p>
                              <p className="text-xs text-slate-300">Try adjusting your filters</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        patients.map((patient, index) => (
                          <tr key={patient.id} className="border-b border-slate-50 text-xs sm:text-sm text-slate-600 hover:bg-blue-50/40 transition-colors">
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-slate-400 whitespace-nowrap">
                              PT{(currentPage - 1) * 10 + index + 1}
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] sm:text-xs font-bold text-blue-600">
                                  {patient.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-semibold text-slate-800 whitespace-nowrap">{patient.name}</span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-500 max-w-[140px] truncate">{patient.email}</td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-600 whitespace-nowrap">{patient.phone}</td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                              <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-blue-600 whitespace-nowrap">
                                {patient.gender}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                              <span className="rounded-lg bg-sky-50 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-sky-600 whitespace-nowrap">
                                {patient.blood_group}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-400 whitespace-nowrap">{patient.dob}</td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-400 whitespace-nowrap">{patient.registeredOn}</td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                              <span className={`rounded-full px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                                patient.status === "Active" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                                {patient.status === "Active" ? "✓ " : "○ "}{patient.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-blue-50 px-3 sm:px-4 py-3">
            <p className="text-[11px] sm:text-xs text-slate-400">
              {totalPatients === 0 ? "No results" : `Page ${currentPage} of ${totalPages} · ${totalPatients} patients`}
            </p>
            <div className="flex items-center gap-1 flex-wrap">
              <button disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center cursor-pointer rounded-lg border border-blue-100 text-xs text-slate-500 hover:bg-blue-50 disabled:opacity-30 transition-colors">
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => changePage(i + 1)} className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg cursor-pointer border text-[11px] sm:text-xs font-semibold transition-colors ${
                    currentPage === i + 1 ? "border-blue-500 bg-blue-600 text-white" : "border-blue-100 text-slate-500 hover:bg-blue-50"}`}>
                  {i + 1}
                </button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-blue-100 text-xs text-slate-500 cursor-pointer hover:bg-blue-50 disabled:opacity-30 transition-colors">
                ›
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ icon, title, value, description, accent = "bg-blue-500" }: PatientStatCardProps & { accent?: string }) => (
  <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-3 sm:p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
    <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent} rounded-t-2xl`} />
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm sm:text-base text-white">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-sm text-slate-400 font-medium truncate">{title}</p>
        <p className="text-base sm:text-xl font-bold text-slate-900 leading-none mt-1 sm:mt-2">{value}</p>
        <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2 hidden sm:block">{description}</p>
      </div>
    </div>
  </div>
);

const FilterDropdown = ({ label, value, options, isOpen, onToggle, onSelect }: FilterDropdownProps) => (
  <div className="relative">
    <button type="button" onClick={onToggle} className="flex h-9 w-full items-center justify-between rounded-xl border cursor-pointer border-blue-100 bg-blue-50/40 px-3 text-left transition hover:border-blue-300">
      <span className="text-xs sm:text-sm text-slate-500 truncate">
        {label}: <span className="font-semibold text-blue-600">{value}</span>
      </span>
      <span className={`text-xs text-blue-400 cursor-pointer transition-transform duration-200 ml-1 shrink-0 ${isOpen ? "rotate-180" : ""}`}>▼</span>
    </button>
    {isOpen && (
      <div className="absolute left-0 top-11 z-50 w-full overflow-hidden rounded-xl border border-blue-100 bg-white shadow-lg">
        <div className="max-h-48 overflow-y-auto p-1.5">
          {options.map((option) => (
            <button key={option} type="button" onClick={() => onSelect(option)} className={`mb-0.5 w-full cursor-pointer rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                value === option ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}>
              {option}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
);