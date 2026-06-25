import { useEffect, useState } from "react";
import { AdminSidebar } from "../../pages/Admin/AdminSidebar";
import { FaUserMd, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { AdminDoctor } from "../../types/doctor";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchAdminDoctors, deleteAdminDoctor, setSearchSpecialization, clearSearch, setPage, setPageSize, } from "../../store/slices/AdminDoctorSlice";
import usePageTitle from "../../hooks/usePageTitle";

//--------Helper Functions

const pageSizeOptions = [
  { label: "6", value: 6 },
  { label: "12", value: 12 },
  { label: "18", value: 18 },
  { label: "24", value: 24 },
];

//----Get a image-----------

// const DoctorImage = ({ doctor }: { doctor: AdminDoctor }) => {
//   const [error, setError] = useState(false);
//   const raw = doctor.user?.profile_picture || doctor.image || "";
//   const src = raw.startsWith("http") ? raw : raw ? `${import.meta.env.VITE_IMAGE_BASE_URL || ""}${raw}` : "";
//   if (!src || error) {
//     return (
//       <div className="flex h-full w-full items-center justify-center bg-blue-50">
//         <FaUserMd className="text-2xl text-blue-300" />
//       </div>
//     );
//   }

//   return (
//     <img src={src} alt={doctor.user?.name || "Doctor"} className="h-full w-full object-cover object-top"
//       onError={() => setError(true)} />
//   );
// };

const DoctorImage = ({ doctor }: { doctor: AdminDoctor }) => {
  const [error, setError] = useState(false);

  const raw = doctor.user?.profile_picture || doctor.image || "";

  const src = raw.startsWith("http")
    ? raw.replace(/^http:\/\//, "https://")
    : raw
      ? `${import.meta.env.VITE_IMAGE_BASE_URL}/uploads/${raw}`
      : "";

  if (!src || error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-blue-50">
        <FaUserMd className="text-3xl text-blue-300" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={doctor.user?.name || "Doctor"}
      className="h-full w-full object-cover object-top"
      onError={() => setError(true)}
    />
  );
};

//--------Main Component---------

export const Doctors = () => {
  usePageTitle("Manage Doctors");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [deleteDoctorId, setDeleteDoctorId] = useState<number | null>(null);

  const { doctors, loading, firstLoad, totalDoctors, totalPages, currentPage, direction,
    searchSpecialization, pageSize } = useAppSelector((state) => state.adminDoctors);

//---------Fetch the doctor in 0.4 s ---------

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchAdminDoctors());
    }, 400);
    return () => clearTimeout(timer);
  }, [dispatch, currentPage, searchSpecialization, pageSize]);

//---------Doctor Delete Logic---------

  const handleDeleteDoctor = async () => {
    if (!deleteDoctorId) return;
    const result = await dispatch(deleteAdminDoctor(deleteDoctorId));
    if (deleteAdminDoctor.fulfilled.match(result)) {
      toast.success("Doctor deleted successfully");
    } else {
      toast.error((result.payload as string) || "Failed to delete doctor");
    }
    setDeleteDoctorId(null);
  };

  const handleChangePage = (page: number) => {
    const dir = page > currentPage ? 1 : -1;
    window.scrollTo({ top: 0, behavior: "instant" });
    dispatch(setPage({ page, dir }));
  };

  return (
    <div className="flex min-h-screen bg-[#f0f4fb] pt-16">
      <AdminSidebar />
      {/**Framer Motion for smooth slide */}
      <AnimatePresence>
        {deleteDoctorId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <FaTrash className="text-2xl text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Delete Doctor?</h2>
                <p className="mt-2 text-sm text-slate-500">
                  This action cannot be undone. The doctor data will be permanently removed.
                </p>
                <div className="mt-6 flex w-full gap-3">
                  <button onClick={() => setDeleteDoctorId(null)} className="flex-1 rounded-xl bg-slate-100 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-200 cursor-pointer">
                    Cancel
                  </button>
                  <button onClick={handleDeleteDoctor} className="flex-1 rounded-xl bg-red-500 py-2.5 font-semibold text-white transition hover:bg-red-600 cursor-pointer">
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-w-0 flex-1 px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5 xl:px-7">
        <div className="mx-auto w-full max-w-screen-lg">
          <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm shadow-sky-100 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Doctors</h1>
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                Showing {doctors.length} of {totalDoctors} doctors
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex h-9 w-full items-center gap-2 rounded-xl bg-slate-50 px-3 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-blue-400 sm:h-10 sm:w-64 lg:w-72">
                <FaSearch className="shrink-0 text-xs text-slate-400" />
                <input type="text" value={searchSpecialization} onChange={(e) => dispatch(setSearchSpecialization(e.target.value))}
                  placeholder="Search specialization..." className="h-full w-full bg-transparent text-sm text-slate-700 outline-none" />
              </div>
              {searchSpecialization && (
                <button onClick={() => dispatch(clearSearch())} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer">
                  Clear
                </button>
              )}
              <button onClick={() => navigate("/admin/add-doctor")} className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 whitespace-nowrap">
                + Add Doctor
              </button>
            </div>
          </div>
          {loading && firstLoad && (
            <p className="mt-4 text-sm font-medium text-blue-600">Loading doctors...</p>
          )}
          {!loading && doctors.length === 0 && (
            <div className="mt-4 rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-base font-semibold text-slate-500">No doctors found</p>
            </div>
          )}
          {!loading && doctors.length > 0 && (
            <>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentPage}
                  custom={direction}
                  initial={{ x: direction === 1 ? 80 : -80, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: direction === 1 ? -80 : 80, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                  {doctors.map((doctor) => (
                    <div key={doctor.id} className="flex items-start gap-3 rounded-2xl bg-white p-3 shadow-sm shadow-sky-100 transition duration-300 hover:-translate-y-0.5 hover:shadow-md sm:gap-4 sm:p-4">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-blue-100 bg-blue-50 sm:h-16 sm:w-16">
                        <DoctorImage doctor={doctor} />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h2 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                              Dr. {doctor.user?.name || "Unknown"}
                            </h2>
                            <p className="text-xs text-slate-400">{doctor.education || "Medical Specialist"}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                            {doctor.specialization || "Doctor"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                          <p>
                            <span className="font-semibold text-slate-700">Email: </span>
                            <span className="break-all text-slate-500">{doctor.user?.email || "N/A"}</span>
                          </p>
                          <p>
                            <span className="font-semibold text-slate-700">Gender: </span>
                            <span className="text-slate-500">{doctor.user?.gender || "N/A"}</span>
                          </p>
                          <p>
                            <span className="font-semibold text-slate-700">Experience: </span>
                            <span className="text-slate-500">{doctor.experience_years || 0} yrs</span>
                          </p>
                          <p>
                            <span className="font-semibold text-slate-700">Fee: </span>
                            <span className="font-bold text-blue-600">₹{doctor.consultation_fee || 0}</span>
                          </p>
                        </div>
                        <p className="line-clamp-1 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">Bio: </span>
                          {doctor.bio || "No bio available"}
                        </p>
                        <div className="flex gap-2 pt-0.5">
                          <button type="button" onClick={() =>
                            navigate(`/admin/update-doctor/${doctor.id}`, { state: { doctor } })
                          } className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-blue-500 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600">
                            <FaEdit /> Update
                          </button>
                          <button onClick={() => setDeleteDoctorId(doctor.id)} className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-red-500 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600">
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
              {totalPages > 1 && (
                <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalDoctors)}</span> of <span className="font-semibold text-slate-700">{totalDoctors}</span> doctors
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button disabled={currentPage === 1} onClick={() => handleChangePage(currentPage - 1)}
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
                          <button key={`dot-${i}`} onClick={() => handleChangePage(i === 1 ? Math.max(1, currentPage - 5) : Math.min(totalPages, currentPage + 5))}
                            className="h-8 w-8 cursor-pointer flex items-center justify-center rounded-lg border border-slate-200 bg-white text-xs text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition">
                            …
                          </button>
                        ) : (
                          <button key={p} onClick={() => handleChangePage(Number(p))} className={`h-8 w-8 cursor-pointer rounded-lg border text-xs font-bold transition
                          ${currentPage === p ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                            {p}
                          </button>
                        )
                      );
                    })()}
                    <button disabled={currentPage === totalPages} onClick={() => handleChangePage(currentPage + 1)}
                      className="h-8 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition">
                      Next →
                    </button>
                    <div className="ml-2 flex items-center gap-1.5">
                      <select value={pageSize} onChange={(e) => dispatch(setPageSize(Number(e.target.value)))}
                        className="h-8 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 outline-none">
                        {pageSizeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <span className="text-xs text-slate-400">/ page</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};