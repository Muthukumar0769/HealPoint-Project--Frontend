import { useEffect, useState } from "react";
import API, { IMAGE_BASE_URL } from "../../api/axios";
import { AdminSidebar } from "../../pages/Admin/AdminSidebar";
import { FaUserMd, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

type Doctor = {
  id: number;
  user_id: number;
  education?: string | null;
  specialization?: string;
  experience_years?: number;
  consultation_fee?: string;
  bio?: string;
  image?: string | null;
  user?: {
    id?: number;
    name?: string;
    email?: string;
    gender?: string;
    role?: string;
    phone_number?: number | null;
    profile_picture?: string | null;
  };
};

const getImageUrl = (doctor: Doctor): string => {
  const raw = doctor.user?.profile_picture || doctor.image || "";
  if (!raw) return "";

  const filename = raw.split("/uploads/").pop();
  if (!filename) return "";
  return `${IMAGE_BASE_URL}/uploads/${filename}?ngrok-skip-browser-warning=true`;
};

const DoctorImage = ({ doctor }: { doctor: Doctor }) => {
  const [error, setError] = useState(false);
  const imageUrl = getImageUrl(doctor);

  if (!imageUrl || error) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-50">
        <FaUserMd className="text-2xl text-blue-400" />
      </div>
    );
  }

  return (
    <img src={imageUrl} alt={doctor.user?.name || "Doctor"} className="h-full w-full rounded-full object-cover object-top"
      onError={() => {
        console.warn("Image load failed:", imageUrl);
        setError(true);
      }}/>
  );
};

export const Doctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchSpecialization, setSearchSpecialization] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [direction, setDirection] = useState(1);
  const [firstLoad, setFirstLoad] = useState(true);

  const limit = 6;

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await API.get("/doctors", {
        params: {
          page: currentPage,
          limit,
          specialization: searchSpecialization.trim() || undefined,
        },
      });

      const doctorsData =
        response.data?.data?.doctors ||
        response.data?.doctors ||
        response.data?.data ||
        [];

      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      setTotalPages(response.data?.data?.totalPages || response.data?.totalPages || 1);
      setTotalDoctors(response.data?.data?.total ||response.data?.total ||doctorsData.length ||0);
    } catch (error) {
      console.log("Fetch doctors error:", error);
      toast.error("Failed to fetch doctors");
      setDoctors([]);
      setTotalPages(1);
      setTotalDoctors(0);
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDoctors();
    }, 400);
    return () => clearTimeout(timer);
  }, [currentPage, searchSpecialization]);

  const handleDeleteDoctor = async (doctorId: number) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    try {
      await API.delete(`/doctors/${doctorId}`);
      toast.success("Doctor deleted successfully");
      fetchDoctors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete doctor");
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 pt-20">
      <AdminSidebar />

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
              <input type="text" value={searchSpecialization} onChange={(e) => {
                  setSearchSpecialization(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search specialization..."
                className="h-full w-full bg-transparent text-sm text-slate-700 outline-none"/>
            </div>

            {searchSpecialization && (
              <button onClick={() => {
                  setSearchSpecialization("");
                  setCurrentPage(1);
                }}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
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
            <p className="text-lg font-semibold text-gray-700">
              No doctors found
            </p>
          </div>
        )}
        {!loading && doctors.length > 0 && (
          <>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentPage}
                custom={direction}
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
                        <p>
                          <span className="font-semibold text-slate-700">
                            Email:{" "}
                          </span>
                          <span className="break-all text-slate-500">
                            {doctor.user?.email || "N/A"}
                          </span>
                        </p>
                        <p>
                          <span className="font-semibold text-slate-700">
                            Gender:{" "}
                          </span>
                          <span className="text-slate-500">
                            {doctor.user?.gender || "N/A"}
                          </span>
                        </p>
                        <p>
                          <span className="font-semibold text-slate-700">
                            Experience:{" "}
                          </span>
                          <span className="text-slate-500">
                            {doctor.experience_years || 0} yrs
                          </span>
                        </p>
                        <p>
                          <span className="font-semibold text-slate-700">
                            Fee:{" "}
                          </span>
                          <span className="font-bold text-blue-600">
                            ₹{doctor.consultation_fee || 0}
                          </span>
                        </p>
                      </div>
                      <p className="line-clamp-1 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">Bio:{" "}</span>
                        {doctor.bio || "No bio available"}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button type="button" onClick={() =>
                            navigate(`/admin/update-doctor/${doctor.id}`, {
                              state: { doctor },
                            })
                          }
                          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-blue-500 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600">
                          <FaEdit /> Update</button>
                        <button onClick={() => handleDeleteDoctor(doctor.id)} className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-red-500 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600">
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
                <button disabled={currentPage === 1} onClick={() => {
                    window.scrollTo({ top: 0, behavior: "instant" });
                    setDirection(-1);
                    setCurrentPage((prev) => prev - 1);
                  }}
                  className="h-9 cursor-pointer rounded-xl border bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, index) => (
                  <button key={index} onClick={() => {
                      window.scrollTo({ top: 0, behavior: "instant" });
                      setDirection(index + 1 > currentPage ? 1 : -1);
                      setCurrentPage(index + 1);
                    }}
                    className={`h-9 w-9 cursor-pointer rounded-xl border text-sm font-bold transition ${
                      currentPage === index + 1? "border-blue-600 bg-blue-600 text-white": "bg-white text-gray-700 hover:bg-slate-50"}`}>
                    {index + 1}
                  </button>
                ))}
                <button disabled={currentPage === totalPages} onClick={() => {
                    window.scrollTo({ top: 0, behavior: "instant" });
                    setDirection(1);
                    setCurrentPage((prev) => prev + 1);
                  }}
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