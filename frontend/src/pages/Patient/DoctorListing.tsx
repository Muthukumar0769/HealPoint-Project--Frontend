import { useEffect, useState } from "react";
import {FaStar,FaUserMd,FaChevronDown,FaFilter,FaTimes,} from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import API, { IMAGE_BASE_URL } from "../../api/axios";
import { motion, AnimatePresence } from "framer-motion";

type ApiDoctor = {
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

type Department = {
  id: number;
  name: string;
};

const experienceFilters = ["0-5", "5-10", "10+"];
const genderFilters = ["Male", "Female", "Others"];
const feesFilters = ["0-500", "500-1000", "1000-1500", "1500-2000"];

const getImageUrl = (doctor: ApiDoctor): string => {
  const raw = doctor.user?.profile_picture || doctor.image || "";
  if (!raw) return "";

  const filename = raw.split("/uploads/").pop();
  if (!filename) return "";

  return `${IMAGE_BASE_URL}/uploads/${filename}?ngrok-skip-browser-warning=true`;
};

const DoctorImage = ({ doctor }: { doctor: ApiDoctor }) => {
  const [error, setError] = useState(false);
  const imageUrl = getImageUrl(doctor);

  if (!imageUrl || error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-blue-50">
        <FaUserMd className="text-3xl text-blue-300" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={doctor.user?.name || "Doctor"}
      className="h-full w-full object-cover object-top"
      onError={() => setError(true)}
    />
  );
};

export const DoctorListing = () => {
  const navigate = useNavigate();
  const { speciality } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const pageFromUrl = Number(searchParams.get("page")) || 1;

  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState(
    speciality || ""
  );
  const [selectedExperience, setSelectedExperience] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedFees, setSelectedFees] = useState("");

  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [openMobileFilter, setOpenMobileFilter] = useState(false);

  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [direction, setDirection] = useState(1);
  const [firstLoad, setFirstLoad] = useState(true);

  const doctorsPerPage = 6;

  const normalizeDepartment = (item: any): Department => ({
    id: Number(item.id || item.department_id || item._id),
    name: item.name || item.specialization || item.department_name || "",
  });

  const fetchDepartments = async () => {
    try {
      const res = await API.get("/departments", {
        params: { page: 1, limit: 100 },
      });

      const rawDepartments =
        res.data?.data?.departments ||
        res.data?.data?.specializations ||
        res.data?.departments ||
        res.data?.specializations ||
        res.data?.data ||
        [];

      const list = Array.isArray(rawDepartments)
        ? rawDepartments.map(normalizeDepartment).filter((item) => item.name)
        : [];

      setDepartments(list);
    } catch {
      setDepartments([]);
    }
  };

  const getFeesMax = () => {
    if (!selectedFees) return undefined;
    return selectedFees.split("-")[1];
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);

      const response = await API.get("/doctors", {
        params: {
          page: currentPage,
          limit: doctorsPerPage,
          specialization: selectedSpecialization || search.trim() || undefined,
          gender: selectedGender || undefined,
          experience_years: selectedExperience || undefined,
          consultation_fee: getFeesMax() || undefined,
        },
      });

      const doctorsData =
        response.data?.data?.doctors ||
        response.data?.doctors ||
        response.data?.data ||
        [];

      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);

      setTotalPages(
        response.data?.data?.totalPages || response.data?.totalPages || 1
      );

      setTotalDoctors(
        response.data?.data?.total ||
          response.data?.total ||
          doctorsData.length ||
          0
      );
    } catch (error) {
      console.log("Fetch doctors error:", error);
      setDoctors([]);
      setTotalPages(1);
      setTotalDoctors(0);
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDoctors();
    }, 400);

    return () => clearTimeout(timer);
  }, [
    currentPage,
    search,
    selectedSpecialization,
    selectedExperience,
    selectedGender,
    selectedFees,
  ]);

  const resetPage = () => {
    setCurrentPage(1);
    setSearchParams({ page: "1" });
  };

  const changePage = (page: number) => {
    setCurrentPage(page);
    setSearchParams({ page: String(page) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedSpecialization("");
    setSelectedExperience("");
    setSelectedGender("");
    setSelectedFees("");
    setOpenFilter(null);
    setOpenMobileFilter(false);
    changePage(1);
  };

  const filterContent = (
    <FilterContent
      departments={departments}
      selectedSpecialization={selectedSpecialization}
      selectedExperience={selectedExperience}
      selectedGender={selectedGender}
      selectedFees={selectedFees}
      openFilter={openFilter}
      setOpenFilter={setOpenFilter}
      setSelectedSpecialization={setSelectedSpecialization}
      setSelectedExperience={setSelectedExperience}
      setSelectedGender={setSelectedGender}
      setSelectedFees={setSelectedFees}
      resetPage={resetPage}
      clearFilters={clearFilters}
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 pt-24 lg:pt-28">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 sm:px-6 lg:px-8">
        <aside className="sticky top-28 hidden h-fit w-64 shrink-0 rounded-2xl bg-white p-5 shadow-lg shadow-sky-100 lg:block">
          {filterContent}
        </aside>

        <main className="min-w-0 flex-1 pb-10">
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-400 p-4 shadow-lg sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
                  Find a Doctor
                </h1>
                <p className="mt-1 text-sm text-white/85">
                  {totalDoctors} Doctors available
                </p>
              </div>

              <div className="flex gap-3">
                <div className="flex h-11 flex-1 items-center gap-3 rounded-xl bg-white px-4 shadow md:w-96 md:flex-none">
                  <FiSearch className="text-lg text-slate-400" />
                  <input type="text" value={search} onChange={(e) => {
                      setSearch(e.target.value);
                      resetPage();
                    }}
                    placeholder="Search specialization..."
                    className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"/>
                </div>
                <button onClick={() => setOpenMobileFilter(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow lg:hidden">
                  <FaFilter />
                </button>
              </div>
            </div>
          </div>

          {loading && firstLoad && (
            <div className="rounded-2xl bg-white p-10 text-center text-base font-semibold text-blue-600 shadow">
              Loading doctors...
            </div>
          )}

          {!loading && doctors.length === 0 && (
            <div className="rounded-2xl bg-white p-12 text-center text-base font-semibold text-slate-500 shadow">
              No doctors found
            </div>
          )}

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              initial={{ x: direction === 1 ? 100 : -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction === 1 ? -100 : 100, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className={`grid grid-cols-1 gap-4 xl:grid-cols-2 ${
                loading && !firstLoad ? "opacity-60" : ""
              }`}>
              {!loading &&
                doctors.map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} onView={() => {
                      window.scrollTo({ top: 0, behavior: "instant" });
                      navigate(`/doctor-details/${doctor.id}`);
                    }}/>
                ))}
            </motion.div>
          </AnimatePresence>

          {!loading && totalPages > 1 && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              <button disabled={currentPage === 1} onClick={() => {
                  setDirection(-1);
                  changePage(currentPage - 1);
                }}
                className="h-9 w-9 cursor-pointer rounded-xl bg-white text-sm font-bold text-slate-600 shadow hover:bg-slate-50 disabled:opacity-40">
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => {
                    setDirection(i + 1 > currentPage ? 1 : -1);
                    changePage(i + 1);
                  }}
                  className={`h-9 w-9 cursor-pointer rounded-xl text-sm font-bold shadow transition ${
                    currentPage === i + 1? "bg-blue-600 text-white": "bg-white text-slate-700 hover:bg-slate-50"}`}>
                  {i + 1}
                </button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => {
                  setDirection(1);
                  changePage(currentPage + 1);
                }}
                className="h-9 w-9 cursor-pointer rounded-xl bg-white text-sm font-bold text-slate-600 shadow hover:bg-slate-50 disabled:opacity-40">
                &gt;
              </button>
            </div>
          )}
        </main>
      </div>

      {openMobileFilter && (
        <div onClick={() => setOpenMobileFilter(false)} className="fixed inset-0 z-[60] bg-black/50 lg:hidden"/>
      )}

      <aside className={`fixed left-0 top-0 z-[70] h-full w-[84%] max-w-sm bg-white shadow-2xl transition-transform duration-300 lg:hidden ${
          openMobileFilter ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between border-b border-gray-100 px-5">
          <h2 className="text-xl font-extrabold text-slate-900">Filters</h2>
          <button onClick={() => setOpenMobileFilter(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
            <FaTimes />
          </button>
        </div>
        <div className="h-[calc(100vh-80px)] overflow-y-auto p-5">{filterContent}</div>
      </aside>
    </div>
  );
};

type DoctorCardProps = {
  doctor: ApiDoctor;
  onView: () => void;
};

const DoctorCard = ({ doctor, onView }: DoctorCardProps) => {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-md shadow-sky-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:flex-row sm:items-center sm:gap-4">
      <div className="relative h-56 w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 sm:h-32 sm:w-32">
        <DoctorImage doctor={doctor} />
      </div>

      <div className="mt-4 flex min-w-0 flex-1 flex-col gap-2 sm:mt-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="truncate text-base font-extrabold text-slate-900 sm:text-sm">
              Dr. {doctor.user?.name || "Unknown"}
            </h2>

            <p className="text-xs text-slate-400">
              {doctor.education || "Medical Specialist"}
            </p>
          </div>

          <span className="w-fit shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
            {doctor.specialization || "Doctor"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((s) => (
            <FaStar key={s} className="text-[10px] text-yellow-400" />
          ))}
          <span className="ml-1 text-xs font-bold text-slate-700">4.8</span>
          <span className="text-xs text-slate-400">(120) reviews</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-600">
            {doctor.experience_years || 0}+ yrs
          </span>

          <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
            {doctor.user?.gender || "N/A"}
          </span>

          <span className="rounded-full bg-green-50 px-2 py-1 font-semibold text-green-600">
            ₹{doctor.consultation_fee || "0"}
          </span>
        </div>

        <p className="line-clamp-2 text-xs leading-5 text-slate-500 sm:line-clamp-1">
          {doctor.bio || "Experienced healthcare professional."}
        </p>

        <button onClick={onView} className="mt-1 h-10 w-full rounded-xl bg-blue-500 text-xs cursor-pointer font-bold text-white transition hover:scale-[1.01] hover:bg-blue-600 sm:h-8">
          View Details
        </button>
      </div>
    </div>
  );
};

type FilterContentProps = {
  departments: Department[];
  selectedSpecialization: string;
  selectedExperience: string;
  selectedGender: string;
  selectedFees: string;
  openFilter: string | null;
  setOpenFilter: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedSpecialization: React.Dispatch<React.SetStateAction<string>>;
  setSelectedExperience: React.Dispatch<React.SetStateAction<string>>;
  setSelectedGender: React.Dispatch<React.SetStateAction<string>>;
  setSelectedFees: React.Dispatch<React.SetStateAction<string>>;
  resetPage: () => void;
  clearFilters: () => void;
};

const FilterContent = ({
  departments,
  selectedSpecialization,
  selectedExperience,
  selectedGender,
  selectedFees,
  openFilter,
  setOpenFilter,
  setSelectedSpecialization,
  setSelectedExperience,
  setSelectedGender,
  setSelectedFees,
  resetPage,
  clearFilters,
}: FilterContentProps) => {
  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="hidden text-lg font-extrabold text-slate-900 lg:block">
          Filters
        </h2>
        <button onClick={clearFilters} className="text-sm cursor-pointer font-bold text-blue-600 hover:text-blue-800">
          Clear all
        </button>
      </div>

      <div className="space-y-3">
        <FilterDropdown title="Specialization" value={selectedSpecialization || "All"} isOpen={openFilter === "specialization"}
          onToggle={() =>
            setOpenFilter(
              openFilter === "specialization" ? null : "specialization"
            )
          }
          options={["All", ...departments.map((d) => d.name)]}
          scrollable
          onSelect={(v) => {
            setSelectedSpecialization(v === "All" ? "" : v);
            setOpenFilter(null);
            resetPage();
          }}/>
        <FilterDropdown title="Experience" value={selectedExperience || "All"} isOpen={openFilter === "experience"}
          onToggle={() =>
            setOpenFilter(openFilter === "experience" ? null : "experience")
          }
          options={["All", ...experienceFilters]}
          onSelect={(v) => {
            setSelectedExperience(v === "All" ? "" : v);
            setOpenFilter(null);
            resetPage();
          }}/>
        <FilterDropdown title="Gender" value={selectedGender || "All"} isOpen={openFilter === "gender"}
          onToggle={() =>
            setOpenFilter(openFilter === "gender" ? null : "gender")
          }
          options={["All", ...genderFilters]}
          onSelect={(v) => {
            setSelectedGender(v === "All" ? "" : v);
            setOpenFilter(null);
            resetPage();
          }}/>
        <FilterDropdown title="Fees" value={selectedFees || "All"} isOpen={openFilter === "fees"}
          onToggle={() =>
            setOpenFilter(openFilter === "fees" ? null : "fees")
          }
          options={["All", ...feesFilters]}
          onSelect={(v) => {
            setSelectedFees(v === "All" ? "" : v);
            setOpenFilter(null);
            resetPage();
          }}/>
      </div>
    </>
  );
};

type FilterDropdownProps = {
  title: string;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  scrollable?: boolean;
};

const FilterDropdown = ({
  title,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
  scrollable = false,
}: FilterDropdownProps) => {
  return (
    <div className="relative">
      <button type="button" onClick={onToggle} className="flex h-11 w-full items-center justify-between rounded-xl bg-slate-50 px-4 text-left text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-blue-50 hover:ring-blue-300">
        <span className="min-w-0">
          {title}:{" "}
          <span className="inline-block max-w-[120px] truncate align-bottom font-bold text-blue-600">
            {value}
          </span>
        </span>
        <FaChevronDown className={`ml-2 shrink-0 text-xs cursor-pointer text-blue-500 transition duration-300 ${
            isOpen ? "rotate-180" : ""}`}/>
      </button>

      {isOpen && (
        <div className={`absolute left-0 top-12 z-40 w-full overflow-hidden rounded-xl bg-white shadow-xl shadow-sky-100 ring-1 ring-slate-100 ${
            scrollable ? "max-h-48 overflow-y-auto" : ""}`}>
          {options.map((option) => (
            <button key={option} type="button" onClick={() => onSelect(option)}
              className={`block w-full px-4 py-2.5 text-left cursor-pointer text-xs font-semibold transition ${
                value === option ? "bg-blue-500 cursor-pointer text-white": "text-slate-700 hover:bg-blue-50 hover:text-blue-600" }`}>
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};