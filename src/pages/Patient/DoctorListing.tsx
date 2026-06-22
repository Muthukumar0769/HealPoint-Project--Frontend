import { useEffect } from "react";
import { FaStar, FaUserMd, FaChevronDown, FaFilter, FaTimes, FaStarHalf, FaRegStar, } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { ApiDoctor, DoctorCardProps, FilterDropdownProps, FilterContentProps, } from "../../types/patient";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchDoctors, fetchDepartments, setFilter, clearFilters, setOpenFilter, setOpenMobileFilter,
  setPage, resetPage, checkAllDoctorsAvailability,
} from "../../store/slices/DoctorListingSlice";
import { AvailabilityBadge } from "../../utils/AvailabilityBadge";
import API from "../../api/axios";
import usePageTitle from "../../hooks/usePageTitle";

const experienceFilters = ["0-5", "5-10", "10+"];
const genderFilters = ["Male", "Female", "Others"];
const feesFilters = ["0-500", "500-1000", "1000-1500", "1500-2000"];
const statusFilters = ["Available", "Unavailable"];

const DoctorImage = ({ doctor }: { doctor: ApiDoctor }) => {
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
export const DoctorListing = () => {
  usePageTitle("Find Doctors");
  const navigate = useNavigate();
  const { speciality } = useParams();
  const [, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { doctors, departments, loading, firstLoad, currentPage, totalPages,
    direction, openFilter, openMobileFilter, filters, doctorAvailability, availabilityLoading, } = useAppSelector((state) => state.doctorListing);
  const { search, selectedSpecialization, selectedExperience, selectedGender, selectedFees, selectedStatus } = filters;

  const visibleDoctors = selectedStatus
    ? doctors.filter((d) => {
      const avail = doctorAvailability[String(d.id)];
      return selectedStatus === "Available" ? avail === true : avail === false;
    }) : doctors;


  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    if (speciality) {
      dispatch(setFilter({ key: "selectedSpecialization", value: speciality }));
    }
  }, [speciality, dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchDoctors());
    }, 400);
    return () => clearTimeout(timer);
  }, [dispatch, currentPage, filters]);

  useEffect(() => {
    if (doctors.length > 0) {
      const ids = doctors.map((d) => String(d.id));
      dispatch(checkAllDoctorsAvailability(ids));
    }
  }, [doctors, dispatch]);

  useEffect(() => {
    setSearchParams({ page: String(currentPage) });
  }, [currentPage]);

  const handleChangePage = (page: number) => {
    const dir = page > currentPage ? 1 : -1;
    dispatch(setPage({ page, dir }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchParams({ page: "1" });
  };

  const filterContent = (
    <FilterContent departments={departments} selectedSpecialization={selectedSpecialization} selectedExperience={selectedExperience}
      selectedGender={selectedGender} selectedFees={selectedFees} openFilter={openFilter}
      onSetOpenFilter={(v) => dispatch(setOpenFilter(v))}
      onSetSpecialization={(v) =>
        dispatch(setFilter({ key: "selectedSpecialization", value: v }))
      }
      onSetExperience={(v) =>
        dispatch(setFilter({ key: "selectedExperience", value: v }))
      }
      onSetGender={(v) =>
        dispatch(setFilter({ key: "selectedGender", value: v }))
      }
      onSetFees={(v) =>
        dispatch(setFilter({ key: "selectedFees", value: v }))
      }
      selectedStatus={selectedStatus}
      onSetStatus={(v) => dispatch(setFilter({ key: "selectedStatus", value: v }))}
      onResetPage={() => dispatch(resetPage())}
      onClearFilters={handleClearFilters} />
  );

  return (
    <div className="min-h-screen bg-[#f0f4fb] pt-24 lg:pt-28">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 sm:px-6 lg:px-8">
        <aside className="sticky top-28 hidden h-fit w-64 shrink-0 rounded-2xl bg-white p-5 shadow-lg shadow-sky-100 lg:block">
          {filterContent}
        </aside>
        <main className="min-w-0 flex-1 pb-10">
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-400 p-4 shadow-lg sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Find a Doctor</h1>
                <p className="mt-1 text-sm text-white/85">{visibleDoctors.length} Doctors</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-11 flex-1 items-center gap-3 rounded-xl bg-white px-4 shadow md:w-96 md:flex-none">
                  <FiSearch className="text-lg text-slate-400" />
                  <input type="text" value={search} onChange={(e) => {
                    dispatch(setFilter({ key: "search", value: e.target.value }));
                    dispatch(resetPage());
                  }}
                    placeholder="Search specialization..."
                    className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
                </div>
                <button onClick={() => dispatch(setOpenMobileFilter(true))} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow lg:hidden">
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
          {!loading && visibleDoctors.length === 0 && (
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
              className={`grid grid-cols-1 gap-4 xl:grid-cols-2 ${loading && !firstLoad ? "opacity-60" : ""}`}>
              {!loading &&
                visibleDoctors.map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor}
                    isAvailable={doctorAvailability[String(doctor.id)] ?? null}
                    availabilityChecking={availabilityLoading[String(doctor.id)] ?? false}
                    onView={() => {
                      window.scrollTo({ top: 0, behavior: "instant" });
                      navigate(`/doctor-details/${doctor.id}`);
                    }} />
                ))}
            </motion.div>
          </AnimatePresence>
          {!loading && totalPages > 1 && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              <button disabled={currentPage === 1} onClick={() => handleChangePage(currentPage - 1)}
                className="h-9 w-9 cursor-pointer rounded-xl bg-white text-sm font-bold text-slate-600 shadow hover:bg-slate-50 disabled:opacity-40">
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => handleChangePage(i + 1)}
                  className={`h-9 w-9 cursor-pointer rounded-xl text-sm font-bold shadow transition ${currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}>
                  {i + 1}
                </button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => handleChangePage(currentPage + 1)}
                className="h-9 w-9 cursor-pointer rounded-xl bg-white text-sm font-bold text-slate-600 shadow hover:bg-slate-50 disabled:opacity-40">
                &gt;
              </button>
            </div>
          )}
        </main>
      </div>
      {openMobileFilter && (
        <div onClick={() => dispatch(setOpenMobileFilter(false))} className="fixed inset-0 z-[60] bg-black/50 lg:hidden" />
      )}
      <aside className={`fixed left-0 top-0 z-[70] h-full w-[84%] max-w-sm bg-white shadow-2xl transition-transform duration-300 lg:hidden ${openMobileFilter ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between border-b border-gray-100 px-5">
          <h2 className="text-xl font-extrabold text-slate-900">Filters</h2>
          <button onClick={() => dispatch(setOpenMobileFilter(false))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
            <FaTimes />
          </button>
        </div>
        <div className="h-[calc(100vh-80px)] overflow-y-auto p-5">
          {filterContent}
        </div>
      </aside>
    </div>
  );
};

type DoctorCardExtendedProps = DoctorCardProps & {
  isAvailable: boolean | null;
  availabilityChecking: boolean;
};

export const DoctorCard = ({ doctor, onView, isAvailable, availabilityChecking }: DoctorCardExtendedProps) => {
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await API.get(`/reviews/${doctor.id}`);
        if (res.data.success) {
          const rows = res.data.data.rows as { rating: number }[];
          setReviewCount(rows.length);
          setAvgRating(rows.length > 0 ? rows.reduce((sum, r) => sum + r.rating, 0) / rows.length : 0);
        }
      } catch {
        setReviewCount(0);
        setAvgRating(0);
      }
    };
    fetchReviews();
  }, [doctor.id]);

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
          {avgRating === null ? (
            <span className="text-[10px] text-slate-400">Loading...</span>
          ) : reviewCount === 0 ? (
            <span className="text-[10px] text-slate-400">No reviews yet</span>
          ) : (
            <>
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < Math.floor(avgRating);
                const half = !filled && i < avgRating;
                return filled ? (
                  <FaStar key={i} className="text-[10px] text-yellow-400" />
                ) : half ? (
                  <FaStarHalf key={i} className="text-[10px] text-yellow-400" />
                ) : (
                  <FaRegStar key={i} className="text-[10px] text-slate-300" />
                );
              })}
              <span className="ml-1 text-xs font-bold text-slate-700">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400">
                ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-600">
            {doctor.experience_years || 0}+ yrs
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
            {doctor.user?.gender || "N/A"}
          </span>
          <AvailabilityBadge isAvailable={isAvailable} isChecking={availabilityChecking} />
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
const FilterContent = ({ departments, selectedSpecialization, selectedExperience, selectedGender, selectedFees,
  openFilter,
  onSetOpenFilter,
  onSetSpecialization,
  onSetExperience,
  onSetGender,
  onSetFees,
  onResetPage,
  onClearFilters,
  selectedStatus,
  onSetStatus
}: FilterContentProps) => {
  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="hidden text-lg font-extrabold text-slate-900 lg:block">
          Filters
        </h2>
        <button onClick={onClearFilters} className="text-sm cursor-pointer font-bold text-blue-600 hover:text-blue-800">
          Clear all
        </button>
      </div>
      <div className="space-y-3">
        <FilterDropdown title="Specialization" value={selectedSpecialization || "All"}
          isOpen={openFilter === "specialization"}
          onToggle={() => onSetOpenFilter(openFilter === "specialization" ? null : "specialization")}
          options={["All", ...departments.map((d) => d.name)]}
          scrollable
          onSelect={(v) => {
            onSetSpecialization(v === "All" ? "" : v);
            onSetOpenFilter(null);
            onResetPage();
          }} />
        <FilterDropdown title="Experience" value={selectedExperience || "All"} isOpen={openFilter === "experience"}
          onToggle={() =>
            onSetOpenFilter(openFilter === "experience" ? null : "experience")}
          options={["All", ...experienceFilters]}
          onSelect={(v) => {
            onSetExperience(v === "All" ? "" : v);
            onSetOpenFilter(null);
            onResetPage();
          }} />
        <FilterDropdown title="Gender" value={selectedGender || "All"} isOpen={openFilter === "gender"}
          onToggle={() =>
            onSetOpenFilter(openFilter === "gender" ? null : "gender")}
          options={["All", ...genderFilters]}
          onSelect={(v) => {
            onSetGender(v === "All" ? "" : v);
            onSetOpenFilter(null);
            onResetPage();
          }} />
        <FilterDropdown title="Fees" value={selectedFees || "All"} isOpen={openFilter === "fees"}
          onToggle={() => onSetOpenFilter(openFilter === "fees" ? null : "fees")}
          options={["All", ...feesFilters]}
          onSelect={(v) => {
            onSetFees(v === "All" ? "" : v);
            onSetOpenFilter(null);
            onResetPage();
          }} />
        <FilterDropdown
          title="Status"
          value={selectedStatus || "All"}
          isOpen={openFilter === "status"}
          onToggle={() => onSetOpenFilter(openFilter === "status" ? null : "status")}
          options={["All", ...statusFilters]}
          onSelect={(v) => {
            onSetStatus(v === "All" ? "" : v);
            onSetOpenFilter(null);
            onResetPage();
          }}
        />
      </div>
    </>
  );
};

const FilterDropdown = ({ title, value, options, isOpen, onToggle, onSelect, scrollable = false, }: FilterDropdownProps) => {
  return (
    <div className="relative">
      <button type="button" onClick={onToggle} className="flex h-11 w-full items-center justify-between rounded-xl bg-slate-50 px-4 text-left text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-blue-50 hover:ring-blue-300">
        <span className="min-w-0">
          {title}:{" "}
          <span className="inline-block max-w-[120px] truncate align-bottom font-bold text-blue-600">
            {value}
          </span>
        </span>
        <FaChevronDown className={`ml-2 shrink-0 text-xs cursor-pointer text-blue-500 transition duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className={`absolute left-0 top-12 z-40 w-full overflow-hidden rounded-xl bg-white shadow-xl shadow-sky-100 ring-1 ring-slate-100 ${scrollable ? "max-h-48 overflow-y-auto" : ""}`}>
          {options.map((option) => (
            <button key={option} type="button" onClick={() => onSelect(option)}
              className={`block w-full px-4 py-2.5 text-left cursor-pointer text-xs font-semibold transition ${value === option ? "bg-blue-500 text-white" : "text-slate-700 hover:bg-blue-50 hover:text-blue-600"}`}>
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};