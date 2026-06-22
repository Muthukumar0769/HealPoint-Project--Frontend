import { useEffect, useState } from "react";
import { AdminSidebar } from "../../pages/Admin/AdminSidebar";
import { FaUserMd, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { AdminDoctor } from "../../types/doctor";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {fetchAdminDoctors, deleteAdminDoctor, setSearchSpecialization, clearSearch,setPage} from "../../store/slices/AdminDoctorSlice";
import usePageTitle from "../../hooks/usePageTitle";

const DoctorImage = ({ doctor }: { doctor: AdminDoctor }) => {
  const [error, setError] = useState(false);

  const raw = doctor.user?.profile_picture || doctor.image || "";
  const src = raw.startsWith("http")
    ? raw
    : raw
      ? `${import.meta.env.VITE_IMAGE_BASE_URL || ""}${raw}`
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
export const Doctors = () => {
  usePageTitle("Manage Doctors");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [deleteDoctorId, setDeleteDoctorId] = useState<number | null>(null);
  const { doctors, loading, firstLoad,totalDoctors, totalPages,
          currentPage, direction,searchSpecialization,} = useAppSelector((state) => state.adminDoctors);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchAdminDoctors());
    }, 400);
    return () => clearTimeout(timer);
  }, [dispatch, currentPage, searchSpecialization]);

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
    <div className="flex min-h-screen bg-[#f0f4fb] pt-20">
      <AdminSidebar />
      <AnimatePresence>
        {deleteDoctorId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-[90%] max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                  <FaTrash className="text-3xl text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Delete Doctor?
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  This action cannot be undone. The doctor data will be permanently removed.
                </p>
                <div className="mt-6 flex w-full gap-3">
                  <button onClick={() => setDeleteDoctorId(null)} className="flex-1 rounded-xl bg-slate-100 py-3 cursor-pointer font-semibold text-slate-700 transition hover:bg-slate-200">
                    Cancel
                  </button>
                  <button onClick={handleDeleteDoctor} className="flex-1 cursor-pointer rounded-xl bg-red-500 py-3 font-semibold text-white transition hover:bg-red-600">
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="flex-1 overflow-hidden p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl bg-white p-5 shadow-lg shadow-sky-100 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Doctors</h1>
            <p className="mt-1 text-sm text-slate-500">
              Showing {doctors.length} of {totalDoctors} doctors
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex h-10 w-full items-center gap-3 rounded-xl bg-slate-50 px-4 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-blue-400 sm:w-72">
              <FaSearch className="text-sm text-slate-400" />
              <input type="text" value={searchSpecialization} onChange={(e) => dispatch(setSearchSpecialization(e.target.value))}
                placeholder="Search specialization..."
                className="h-full w-full bg-transparent text-sm text-slate-700 outline-none" />
            </div>
            {searchSpecialization && (
              <button onClick={() => dispatch(clearSearch())} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
                Clear
              </button>
            )}
            <button onClick={() => navigate("/admin/add-doctor")} className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-blue-100 transition hover:scale-[1.02] hover:bg-blue-700">
              + Add Doctor
            </button>
          </div>
        </div>
        {loading && firstLoad && (
          <p className="mt-6 text-base font-medium text-blue-600">
            Loading doctors...
          </p>
        )}
        {!loading && doctors.length === 0 && (
          <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow">
            <p className="text-lg font-semibold text-gray-700">No doctors found</p>
          </div>
        )}
        {!loading && doctors.length > 0 && (
          <>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div key={currentPage} custom={direction}
                initial={{ x: direction === 1 ? 100 : -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction === 1 ? -100 : 100, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {doctors.map((doctor) => (
                  <div key={doctor.id} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md shadow-sky-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-blue-100 bg-blue-50">
                      <DoctorImage doctor={doctor} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-bold text-slate-900">
                            Dr. {doctor.user?.name || "Unknown"}
                          </h2>
                          <p className="text-xs text-slate-400">
                            {doctor.education || "Medical Specialist"}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-600">
                          {doctor.specialization || "Doctor"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <p><span className="font-semibold text-slate-700">Email: </span>
                          <span className="break-all text-slate-500">{doctor.user?.email || "N/A"}</span></p>
                        <p><span className="font-semibold text-slate-700">Gender: </span>
                          <span className="text-slate-500">{doctor.user?.gender || "N/A"}</span></p>
                        <p><span className="font-semibold text-slate-700">Experience: </span>
                          <span className="text-slate-500">{doctor.experience_years || 0} yrs</span></p>
                        <p><span className="font-semibold text-slate-700">Fee: </span>
                          <span className="font-bold text-blue-600">₹{doctor.consultation_fee || 0}</span></p>
                      </div>
                      <p className="line-clamp-1 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">Bio: </span>
                        {doctor.bio || "No bio available"}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button type="button" onClick={() => navigate(`/admin/update-doctor/${doctor.id}`, { state: { doctor } })}
                          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-blue-500 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600">
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
              <div className="mt-8 flex items-center justify-center gap-2">
                <button disabled={currentPage === 1} onClick={() => handleChangePage(currentPage - 1)}
                  className="h-9 cursor-pointer rounded-xl border bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, index) => (
                  <button key={index} onClick={() => handleChangePage(index + 1)}
                    className={`h-9 w-9 cursor-pointer rounded-xl border text-sm font-bold transition ${currentPage === index + 1
                      ? "border-blue-600 bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-slate-50"}`}>
                    {index + 1}
                  </button>
                ))}
                <button disabled={currentPage === totalPages} onClick={() => handleChangePage(currentPage + 1)}
                  className="h-9 cursor-pointer rounded-xl border bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};