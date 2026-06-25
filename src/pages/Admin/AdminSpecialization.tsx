import { useEffect, useRef, useState } from "react";
import { FaEdit, FaPlus, FaSearch, FaTrash, FaTimes, FaSave, FaUserMd } from "react-icons/fa";
import { MdGridView } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { AdminSidebar } from "./AdminSidebar";
import type { Specialization } from "../../types/admin";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchAdminSpecializations, deleteSpecialization, setSearch, setPage, setPageSize } from "../../store/slices/AdminSpecializationSlice";
import usePageTitle from "../../hooks/usePageTitle";

//------Helper Functions---------

const SPEC_COLORS = [
  { icon: "bg-blue-100", text: "text-blue-600" },
  { icon: "bg-violet-100", text: "text-violet-600" },
  { icon: "bg-rose-100", text: "text-rose-600" },
  { icon: "bg-cyan-100", text: "text-cyan-600" },
  { icon: "bg-emerald-100", text: "text-emerald-600" },
  { icon: "bg-amber-100", text: "text-amber-600" },
];

//-----Main Component---------

export const AdminSpecialization = () => {
  usePageTitle("Specializations");
  const dispatch = useAppDispatch();
  const { specializations, loading, search, currentPage, totalPages, totalDepartments, direction, pageSize } =
    useAppSelector((state) => state.adminSpecializations);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null; name: string }>({
    open: false, id: null, name: "",
  });

  const limit = 6;

  useEffect(() => {
    const timer = setTimeout(() => { dispatch(fetchAdminSpecializations()); }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, search]);

  //-------Fetch immediately when page or page-size changes (no debounce)-----------
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    dispatch(fetchAdminSpecializations());
  }, [dispatch, currentPage, pageSize]);

  const openAddForm = () => {
    setEditingId(null);
    setForm({ name: "", description: "" });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEditForm = async (item: Specialization) => {
    try {
      const res = await API.get(`/departments/${item.id}`);
      const rawDepartment = res.data?.specialization;
      if (!rawDepartment) { toast.error("Department data not found"); return; }
      setEditingId(item.id);
      setForm({ name: rawDepartment.name, description: rawDepartment.description });
      setIsFormOpen(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Failed to load specialization");
    }
  };

  const closeForm = () => {
    setEditingId(null);
    setForm({ name: "", description: "" });
    setIsFormOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

//-------Add Speciaization button logic----------

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.description.trim()) return toast.error("Description is required");
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() };
      if (editingId) {
        await API.put(`/departments/${editingId}`, payload);
        toast.success("Specialization updated successfully");
      } else {
        await API.post("/departments", payload);
        toast.success("Specialization added successfully");
      }
      closeForm();
      dispatch(fetchAdminSpecializations());
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Save failed");
    }
  };

  const openDeleteModal = (id: number, name: string) => setDeleteModal({ open: true, id, name });
  const closeDeleteModal = () => setDeleteModal({ open: false, id: null, name: "" });

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    const result = await dispatch(deleteSpecialization(deleteModal.id));
    if (deleteSpecialization.fulfilled.match(result)) {
      toast.success("Specialization deleted successfully");
      closeDeleteModal();
    } else {
      toast.error(result.payload as string);
    }
  };

  const handlePageChange = (page: number) => {
    dispatch(setPage({ page, dir: page > currentPage ? 1 : -1 }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#f0f4fb] pt-16 lg:flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 px-3 py-5 sm:px-5 sm:py-6 lg:px-7 xl:px-7">
        <div className="mb-4 sm:mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-[10px] sm:text-sm font-semibold uppercase tracking-widest text-blue-400">
              Management
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Medical <span className="text-blue-600">Specializations</span>
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-400">Manage all medical departments</p>
          </div>
          <button onClick={openAddForm} className="flex cursor-pointer items-center gap-2 self-start rounded-xl bg-blue-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 sm:self-auto whitespace-nowrap">
            <FaPlus className="text-xs sm:text-sm" />
            Add Specialization
          </button>
        </div>
        {isFormOpen && (
          <div className="mb-4 sm:mb-5 rounded-2xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  {editingId ? "Edit Specialization" : "Add Specialization"}
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
                  {editingId ? "Update the details below" : "Fill in the details below"}
                </p>
              </div>
              <button onClick={closeForm} className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors">
                <FaTimes className="text-xs sm:text-sm cursor-pointer" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Specialization name"
                className="h-10 rounded-xl border border-blue-100 bg-blue-50/40 px-4 text-xs sm:text-sm text-slate-700 outline-none placeholder:text-slate-300 focus:border-blue-400 transition-colors" />
              <input type="text" name="description" value={form.description} onChange={handleChange}
                placeholder="Description"
                className="h-10 rounded-xl border border-blue-100 bg-blue-50/40 px-4 text-xs sm:text-sm text-slate-700 outline-none placeholder:text-slate-300 focus:border-blue-400 transition-colors" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={closeForm} className="cursor-pointer rounded-xl border border-blue-100 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} className="flex cursor-pointer items-center gap-1.5 sm:gap-2 rounded-xl bg-blue-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                <FaSave className="text-xs sm:text-sm" />
                {editingId ? "Save Changes" : "Add"}
              </button>
            </div>
          </div>
        )}
        <div className="mb-4 sm:mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm self-start">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-600 text-sm sm:text-base text-white">
              <MdGridView />
            </div>
            <div>
              <p className="text-[11px] sm:text-sm text-slate-400">Total Specializations</p>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-none mt-0.5">{totalDepartments}</h2>
            </div>
          </div>
          <div className="relative w-full sm:w-64 lg:w-72">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 text-xs sm:text-sm" />
            <input type="text" value={search} onChange={(e) => dispatch(setSearch(e.target.value))}
              placeholder="Search specialization..." className="h-10 w-full rounded-xl border border-blue-100 bg-white pl-8 sm:pl-9 pr-4 text-xs sm:text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-300 focus:border-blue-400 transition-colors" />
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <AnimatePresence mode="wait">
              <motion.table
                key={currentPage}
                initial={{ x: direction === 1 ? 60 : -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction === 1 ? -60 : 60, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full" style={{ minWidth: 560 }}>
                <thead>
                  <tr className="border-b border-blue-50 bg-blue-50/60">
                    {["#", "Specialization", "Description", "Doctors", "Actions"].map((h) => (
                      <th key={h} className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[10px] sm:text-sm font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && specializations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-xs sm:text-sm text-slate-400">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                          Loading specializations...
                        </span>
                      </td>
                    </tr>
                  ) : specializations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-14 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-xl text-blue-400">
                            <FaUserMd />
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-slate-400">No specializations found</p>
                          <p className="text-xs sm:text-sm text-slate-300">Try a different search term</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    specializations.map((item, index) => {
                      const c = SPEC_COLORS[index % SPEC_COLORS.length];
                      return (
                        <tr key={item.id} className="border-b border-slate-50 hover:bg-blue-50/40 transition-colors">
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-400">
                            {(currentPage - 1) * limit + index + 1}
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl ${c.icon} ${c.text} text-xs sm:text-sm`}>
                                <FaUserMd />
                              </div>
                              <span className="text-xs sm:text-sm font-bold text-slate-800 whitespace-nowrap">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-500 max-w-[160px] truncate">{item.description}</td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                            <span className="rounded-lg bg-blue-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold text-blue-600">
                              {item.doctors}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                            <div className="flex gap-1.5 sm:gap-2">
                              <button onClick={() => openEditForm(item)} className="flex cursor-pointer items-center gap-1 sm:gap-1.5 rounded-xl bg-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-sm font-semibold text-blue-600 transition hover:bg-blue-600 hover:text-white whitespace-nowrap">
                                <FaEdit className="text-[9px] sm:text-xs" />
                                <span className="hidden xs:inline sm:inline">Edit</span>
                              </button>
                              <button onClick={() => openDeleteModal(item.id, item.name)} className="flex cursor-pointer items-center gap-1 sm:gap-1.5 rounded-xl bg-red-50 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-sm font-semibold text-red-500 transition hover:bg-red-500 hover:text-white whitespace-nowrap">
                                <FaTrash className="text-[9px] sm:text-xs" />
                                <span className="hidden xs:inline sm:inline">Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </motion.table>
            </AnimatePresence>
          </div>
        </div>
        {totalPages > 1 && (
          <div className="mt-4 sm:mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalDepartments)}</span> of <span className="font-semibold text-slate-700">{totalDepartments}</span> specializations
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}
                className="h-8 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition">
                ← Prev
              </button>
              {(() => {
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
                return pages.map((p, i) =>
                  p === "..." ? (
                    <button key={`dot-${i}`} onClick={() => handlePageChange(i === 1 ? Math.max(1, currentPage - 5) : Math.min(totalPages, currentPage + 5))}
                      className="h-8 w-8 cursor-pointer flex items-center justify-center rounded-lg border border-slate-200 bg-white text-xs text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition">
                      …
                    </button>
                  ) : (
                    <button key={p} onClick={() => handlePageChange(Number(p))} className={`h-8 w-8 cursor-pointer rounded-lg border text-xs font-bold transition
                     ${currentPage === p ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                      {p}
                    </button>
                  )
                );
              })()}
              <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}
                className="h-8 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition">
                Next →
              </button>
              <div className="ml-1 flex items-center gap-1.5">
                <select value={pageSize} onChange={(e) => dispatch(setPageSize(Number(e.target.value)))}
                  className="h-8 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 outline-none">
                  {[6, 12, 18, 24].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <span className="text-xs text-slate-400">/ page</span>
              </div>
            </div>
          </div>
        )}
        <AnimatePresence>
          {deleteModal.open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                transition={{ duration: 0.22 }}
                className="w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-xl">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-red-100 text-xl sm:text-2xl text-red-500">
                    <FaTrash />
                  </div>
                </div>
                <h2 className="text-center text-sm sm:text-base font-bold text-slate-900">
                  Delete Specialization
                </h2>
                <p className="mt-2 text-center text-xs sm:text-sm text-slate-500">
                  Are you sure you want to delete{" "}
                  <span className="font-bold text-slate-800">{deleteModal.name}</span>?
                </p>
                <div className="mt-4 sm:mt-5 flex gap-2">
                  <button onClick={closeDeleteModal} className="flex-1 cursor-pointer rounded-xl border border-blue-100 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={confirmDelete} className="flex-1 cursor-pointer rounded-xl bg-red-500 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-red-600 transition-colors">
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};