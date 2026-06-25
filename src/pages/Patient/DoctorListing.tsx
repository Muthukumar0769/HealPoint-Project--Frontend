import { useEffect, useCallback } from "react";
import { FaStar, FaUserMd, FaChevronDown, FaFilter, FaTimes, FaStarHalf, FaRegStar, FaClock, FaHistory, FaChevronLeft, FaChevronRight, } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { ApiDoctor, DoctorCardProps, FilterDropdownProps, FilterContentProps, Slot } from "../../types/patient";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchDoctors, fetchDepartments, setFilter, clearFilters, setOpenFilter, setOpenMobileFilter,
  setPage, resetPage, checkAllDoctorsAvailability, setLimit,
} from "../../store/slices/DoctorListingSlice";
import { AvailabilityBadge } from "../../utils/AvailabilityBadge";
import API from "../../api/axios";
import usePageTitle from "../../hooks/usePageTitle";

//------Helper functions----------

const experienceFilters = ["0-5", "5-10", "10+"];
const genderFilters = ["Male", "Female", "Others"];
const feesFilters = ["0-500", "500-1000", "1000-1500", "1500-2000"];
const statusFilters = ["Available", "Unavailable"];
const LIMIT_OPTIONS = [6, 10, 20, 50];

const RECENTLY_VIEWED_KEY = "recentlyViewedDoctors";
const MAX_RECENTLY_VIEWED = 4;

//-------Get a Recently viewed Doctors-------------

const getRecentlyViewed = (): ApiDoctor[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
  } catch {
    return [];
  }
};

//-------------Save the Recently viewed Doctors----------

const saveRecentlyViewed = (doctor: ApiDoctor) => {
  try {
    const existing = getRecentlyViewed();
    const filtered = existing.filter((d) => d.id !== doctor.id);
    const updated = [doctor, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
};

const DoctorImage = ({ doctor }: { doctor: ApiDoctor }) => {
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
//--------Separate Component for Recently Viewed Sections----------

const RecentlyViewedSection = ({ doctors, onView }: { doctors: ApiDoctor[]; onView: (doctor: ApiDoctor) => void }) => {
  if (doctors.length === 0) return null;
  return (
    <div className="mb-4 rounded-2xl bg-white p-3 shadow-md shadow-sky-100">
      <div className="mb-2 flex items-center gap-1.5">
        <FaHistory className="text-blue-500 text-sm" />
        <h2 className="text-sm font-extrabold text-slate-700">Recently Viewed</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {doctors.map((doctor) => {
          const raw = doctor.user?.profile_picture || doctor.image || "";
          const src = raw.startsWith("http")
            ? raw.replace(/^http:\/\//, "https://")
            : raw
              ? `${import.meta.env.VITE_IMAGE_BASE_URL}/uploads/${raw}`
              : "";
          return (
            <button key={doctor.id} onClick={() => onView(doctor)}
              className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 transition hover:border-blue-200 hover:bg-blue-50">
              <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-blue-100">
                {src ? (
                  <img src={src} alt={doctor.user?.name || "Doctor"} className="h-full w-full object-cover object-top" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FaUserMd className="text-sm text-blue-300" />
                  </div>
                )}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 max-w-[100px] truncate">
                  Dr. {doctor.user?.name || "Unknown"}
                </p>
                <p className="text-[10px] text-blue-500 font-semibold truncate max-w-[100px]">
                  {doctor.specialization || "Specialist"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const EntriesSelector = ({ limit, onLimitChange }: { limit: number; onLimitChange: (val: number) => void; }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((p) => !p)} className="flex h-7 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50">
        <span>{limit}</span>
        <FaChevronDown className={`text-[9px] text-blue-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1.5 w-16 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl shadow-sky-100">
          {LIMIT_OPTIONS.map((opt) => (
            <button key={opt} onClick={() => { onLimitChange(opt); setOpen(false); }} className={`block w-full px-3 py-2 text-left text-xs font-bold transition ${opt === limit ? "bg-blue-500 text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"}`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const PaginationBar = ({ currentPage, totalPages, totalDoctors, limit, onPageChange, onLimitChange, }: {
  currentPage: number;
  totalPages: number;
  totalDoctors: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (val: number) => void;
}) => {
  const from = Math.min((currentPage - 1) * limit + 1, totalDoctors);
  const to = Math.min(currentPage * limit, totalDoctors);
  const pages: (number | "...")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2.5 shadow-md shadow-sky-100">
      <div className="flex items-center gap-1.5">
        <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40">
          <FaChevronLeft className="text-[10px]" />
        </button>

        {pages.map((p, idx) =>
          p === "..." ? (
            <button key={`ellipsis-${idx}`} onClick={() => onPageChange(idx === 1 ? Math.max(1, currentPage - 5) : Math.min(totalPages, currentPage + 5))}
              className="flex h-9 w-7 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-xs text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition">
              …
            </button>
          ) : (
            <button key={p} onClick={() => onPageChange(p as number)} className={`h-9 w-9 cursor-pointer rounded-xl text-xs font-bold shadow-sm transition ${p === currentPage ? "bg-blue-600 text-white shadow-blue-200"
              : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"}`}>
              {p}
            </button>
          )
        )}

        <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40">
          <FaChevronRight className="text-[10px]" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <EntriesSelector limit={limit} onLimitChange={onLimitChange} />
        <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
          Entries&nbsp;
          <span className="font-bold text-blue-600">{from}–{to}</span>
          &nbsp;of&nbsp;
          <span className="font-bold text-slate-700">{totalDoctors}</span>
        </span>
      </div>
    </div>
  );
};

//----------Main Component----------

export const DoctorListing = () => {
  usePageTitle("Find Doctors");
  const navigate = useNavigate();
  const { speciality } = useParams();
  const [, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const [recentlyViewed, setRecentlyViewed] = useState<ApiDoctor[]>(() => getRecentlyViewed());

  const { doctors, departments, loading, firstLoad, currentPage, totalPages, totalDoctors,
    limit, direction, openFilter, openMobileFilter, filters, doctorAvailability, availabilityLoading,
  } = useAppSelector((state) => state.doctorListing);

  const { search, selectedSpecialization, selectedExperience, selectedGender, selectedFees, selectedStatus } = filters;

  const isStatusFilterActive = Boolean(selectedStatus);
  const statusFilteredDoctors = isStatusFilterActive
    ? doctors.filter((d) => {
      const avail = doctorAvailability[String(d.id)];
      return selectedStatus === "Available" ? avail === true : avail === false;
    })
    : doctors;
  const visibleDoctors = isStatusFilterActive
    ? statusFilteredDoctors.slice((currentPage - 1) * limit, currentPage * limit)
    : statusFilteredDoctors;
  const effectiveTotalDoctors = isStatusFilterActive ? statusFilteredDoctors.length : totalDoctors;
  const effectiveTotalPages = isStatusFilterActive
    ? Math.max(1, Math.ceil(statusFilteredDoctors.length / limit))
    : totalPages;
  useEffect(() => { dispatch(fetchDepartments()); }, [dispatch]);

  useEffect(() => {
    if (speciality) dispatch(setFilter({ key: "selectedSpecialization", value: speciality }));
  }, [speciality, dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => { dispatch(fetchDoctors()); }, 400);
    return () => clearTimeout(timer);
  }, [dispatch, currentPage, limit, filters]);

  useEffect(() => {
    if (doctors.length > 0) {
      const ids = doctors.map((d) => String(d.id));
      dispatch(checkAllDoctorsAvailability(ids));
    }
  }, [doctors, dispatch]);

  useEffect(() => { setSearchParams({ page: String(currentPage) }); }, [currentPage, setSearchParams]);

  const handleChangePage = (page: number) => {
    const dir = page > currentPage ? 1 : -1;
    dispatch(setPage({ page, dir }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChangeLimit = (val: number) => {
    dispatch(setLimit(val));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchParams({ page: "1" });
  };

  const handleViewDoctor = useCallback((doctor: ApiDoctor) => {
    saveRecentlyViewed(doctor);
    setRecentlyViewed(getRecentlyViewed());
    window.scrollTo({ top: 0, behavior: "instant" });
    navigate(`/doctor-details/${doctor.id}`);
  }, [navigate]);

  //---------Filter logic---------------

  const filterContent = (
    <FilterContent departments={departments} selectedSpecialization={selectedSpecialization}
      selectedExperience={selectedExperience} selectedGender={selectedGender}
      selectedFees={selectedFees} openFilter={openFilter}
      onSetOpenFilter={(v) => dispatch(setOpenFilter(v))}
      onSetSpecialization={(v) => dispatch(setFilter({ key: "selectedSpecialization", value: v }))}
      onSetExperience={(v) => dispatch(setFilter({ key: "selectedExperience", value: v }))}
      onSetGender={(v) => dispatch(setFilter({ key: "selectedGender", value: v }))}
      onSetFees={(v) => dispatch(setFilter({ key: "selectedFees", value: v }))}
      selectedStatus={selectedStatus}
      onSetStatus={(v) => dispatch(setFilter({ key: "selectedStatus", value: v }))}
      onResetPage={() => dispatch(resetPage())}
      onClearFilters={handleClearFilters} />
  );

  return (
    <div className="min-h-screen bg-[#f0f4fb] pt-20 lg:pt-20">
      <div className="mx-auto flex max-w-7xl xl:max-w-screen-2xl gap-6 px-4 sm:px-6 lg:px-8 xl:px-10">
        <aside className="sticky mb-3 top-24 hidden h-fit w-56 shrink-0 rounded-2xl bg-white p-4 shadow-lg shadow-sky-100 lg:block">
          {filterContent}
          {departments.length > 0 && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="mb-2.5 text-xs font-extrabold text-slate-700">Popular Specializations</h3>
              <div className="flex flex-wrap gap-1.5">
                {departments.slice(0, 6).map((dept) => (
                  <button key={dept.id} onClick={() => {
                    dispatch(setFilter({ key: "selectedSpecialization", value: dept.name }));
                    dispatch(resetPage());
                  }}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${selectedSpecialization === dept.name
                      ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}>
                    {dept.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-5 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 p-3.5 text-white">
            <div className="mb-1.5 flex items-center gap-1.5">
              <FaUserMd className="text-sm" />
              <h3 className="text-xs font-extrabold">Need help choosing?</h3>
            </div>
            <p className="text-[11px] leading-4 text-blue-50/90">
              Not sure which doctor fits your symptoms? Talk to our care team for a quick recommendation.
            </p>
            <button onClick={() => navigate("/contact")} className="mt-2.5 h-7 w-full cursor-pointer rounded-lg bg-white text-[11px] font-bold text-blue-600 transition hover:bg-blue-50">
              Contact Support
            </button>
          </div>
        </aside>
        <main className="min-w-0 flex-1 pb-7">
          <div className="mb-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-400 p-3 shadow-lg sm:p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl font-extrabold text-white sm:text-2xl">Find a Doctor</h1>
                <p className="mt-0.5 text-xs text-white/85">{effectiveTotalDoctors} Doctors</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-9 flex-1 items-center gap-2 rounded-xl bg-white px-3 shadow md:w-80 md:flex-none">
                  <FiSearch className="text-lg text-slate-400" />
                  <input type="text" value={search} onChange={(e) => {
                    dispatch(setFilter({ key: "search", value: e.target.value }));
                    dispatch(resetPage());
                  }}
                    placeholder="Search specialization..."
                    className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
                </div>
                <button onClick={() => dispatch(setOpenMobileFilter(true))}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow lg:hidden">
                  <FaFilter />
                </button>
              </div>
            </div>
          </div>

          <RecentlyViewedSection
            doctors={recentlyViewed}
            onView={(doctor) => handleViewDoctor(doctor)} />

          {loading && firstLoad && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {Array.from({ length: limit }).map((_, i) => (
                <div key={i} className="flex animate-pulse flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-md shadow-sky-100 sm:flex-row sm:items-center sm:gap-4">
                  <div className="h-56 w-full shrink-0 rounded-xl bg-slate-200 sm:h-32 sm:w-32" />
                  <div className="mt-4 flex flex-1 flex-col gap-3 sm:mt-0">
                    <div className="h-4 w-3/4 rounded-lg bg-slate-200" />
                    <div className="h-3 w-1/2 rounded-lg bg-slate-200" />
                    <div className="flex gap-2">
                      <div className="h-6 w-16 rounded-full bg-slate-200" />
                      <div className="h-6 w-16 rounded-full bg-slate-200" />
                      <div className="h-6 w-20 rounded-full bg-slate-200" />
                    </div>
                    <div className="h-3 w-full rounded-lg bg-slate-200" />
                    <div className="h-8 w-full rounded-xl bg-slate-200" />
                  </div>
                </div>
              ))}
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
              {!loading && visibleDoctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor}
                  isAvailable={doctorAvailability[String(doctor.id)] ?? null}
                  availabilityChecking={availabilityLoading[String(doctor.id)] ?? false}
                  onView={() => handleViewDoctor(doctor)} />
              ))}
            </motion.div>
          </AnimatePresence>

          {!loading && effectiveTotalPages >= 1 && effectiveTotalDoctors > 0 && (
            <PaginationBar
              currentPage={currentPage}
              totalPages={effectiveTotalPages}
              totalDoctors={effectiveTotalDoctors}
              limit={limit}
              onPageChange={handleChangePage}
              onLimitChange={handleChangeLimit}
            />
          )}
        </main>
      </div>

      {openMobileFilter && (
        <div onClick={() => dispatch(setOpenMobileFilter(false))}
          className="fixed inset-0 z-[60] bg-black/50 lg:hidden" />
      )}
      <aside className={`fixed left-0 top-0 z-[70] h-full w-[84%] max-w-sm bg-white shadow-2xl transition-transform duration-300 lg:hidden ${openMobileFilter ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-14 items-center justify-between border-b border-gray-100 px-4">
          <h2 className="text-base font-extrabold text-slate-900">Filters</h2>
          <button onClick={() => dispatch(setOpenMobileFilter(false))}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500">
            <FaTimes />
          </button>
        </div>
        <div className="h-[calc(100vh-56px)] overflow-y-auto p-4">{filterContent}</div>
      </aside>
    </div>
  );
};

type DoctorCardExtendedProps = DoctorCardProps & {
  isAvailable: boolean | null;
  availabilityChecking: boolean;
};

//---------Separate component for Doctor card--------------

export const DoctorCard = ({ doctor, onView, isAvailable, availabilityChecking }: DoctorCardExtendedProps) => {
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [nextSlot, setNextSlot] = useState<string | null>(null);
  const [slotLoading, setSlotLoading] = useState(true);

  //-------Fetch the Reviews-----------

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

  useEffect(() => {
    type SlotLike = Partial<Slot> & { appointment_id?: number; status?: string; is_available?: boolean; start_time?: string };

    const findAvailableSlot = (slots: SlotLike[]) =>
      slots.find((slot) => {
        const status = String(slot.status || "").toLowerCase();
        return (
          status !== "booked" && status !== "confirmed" && status !== "accepted" &&
          status !== "completed" && status !== "blocked" && status !== "pending" &&
          status !== "unavailable" && !slot.appointment_id && slot.is_available !== false
        );
      });

    //----------Fetch the Next Slot logic based on date----------

    const fetchNextSlot = async () => {
      try {
        setSlotLoading(true);
        const today = new Date().toISOString().split("T")[0];
        const res = await API.get(`/slots/${doctor.id}`, { params: { date: today } });
        const raw: SlotLike[] =
          res.data?.slots || res.data?.data?.slots || res.data?.data || res.data || [];

        if (Array.isArray(raw)) {
          const available = findAvailableSlot(raw);
          if (available?.start_time) {
            const formatted = new Date(`2000-01-01T${available.start_time}`)
              .toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
            setNextSlot(`Today ${formatted}`);
          } else {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split("T")[0];
            const res2 = await API.get(`/slots/${doctor.id}`, { params: { date: tomorrowStr } });
            const raw2: SlotLike[] =
              res2.data?.slots || res2.data?.data?.slots || res2.data?.data || res2.data || [];
            const available2 = Array.isArray(raw2) ? findAvailableSlot(raw2) : undefined;
            if (available2?.start_time) {
              const formatted = new Date(`2000-01-01T${available2.start_time}`)
                .toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
              setNextSlot(`Tomorrow ${formatted}`);
            } else {
              setNextSlot(null);
            }
          }
        }
      } catch {
        setNextSlot(null);
      } finally {
        setSlotLoading(false);
      }
    };

    fetchNextSlot();
  }, [doctor.id]);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white p-3 shadow-md shadow-sky-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:flex-row sm:items-center sm:gap-4">
      <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 sm:h-28 sm:w-28">
        <DoctorImage doctor={doctor} />
      </div>
      <div className="mt-3 flex min-w-0 flex-1 flex-col gap-1.5 sm:mt-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-extrabold text-slate-900 sm:text-xs">
              Dr. {doctor.user?.name || "Unknown"}
            </h2>
            <p className="text-xs text-slate-400">{doctor.education || "Medical Specialist"}</p>
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
              <span className="ml-1 text-xs font-bold text-slate-700">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-slate-400">({reviewCount} review{reviewCount !== 1 ? "s" : ""})</span>
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

        {slotLoading ? (
          <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-100" />
        ) : nextSlot ? (
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 w-fit">
            <FaClock className="text-[10px] text-emerald-500 shrink-0" />
            <span className="text-[11px] font-bold text-emerald-600">Next: {nextSlot}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 w-fit">
            <FaClock className="text-[10px] text-slate-400 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-400">No slots available</span>
          </div>
        )}

        <p className="line-clamp-1 text-xs leading-5 text-slate-500">
          {doctor.bio || "Experienced healthcare professional."}
        </p>
        <button onClick={onView} className="mt-0.5 h-8 w-full rounded-xl bg-blue-500 text-xs cursor-pointer font-bold text-white transition hover:scale-[1.01] hover:bg-blue-600 sm:h-7">
          View Details
        </button>
      </div>
    </div>
  );
};

//----------separate component for filter section------------

const FilterContent = ({ departments, selectedSpecialization, selectedExperience, selectedGender, selectedFees,
  openFilter, onSetOpenFilter, onSetSpecialization, onSetExperience, onSetGender, onSetFees,
  onResetPage, onClearFilters, selectedStatus, onSetStatus,
}: FilterContentProps) => {
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="hidden text-base font-extrabold text-slate-900 lg:block">Filters</h2>
        <button onClick={onClearFilters} className="text-sm cursor-pointer font-bold text-blue-600 hover:text-blue-800">
          Clear all
        </button>
      </div>
      <div className="space-y-3">
        <FilterDropdown title="Specialization" value={selectedSpecialization || "All"}
          isOpen={openFilter === "specialization"}
          onToggle={() => onSetOpenFilter(openFilter === "specialization" ? null : "specialization")}
          options={["All", ...departments.map((d) => d.name)]} scrollable
          onSelect={(v) => { onSetSpecialization(v === "All" ? "" : v); onSetOpenFilter(null); onResetPage(); }} />
        <FilterDropdown title="Experience" value={selectedExperience || "All"}
          isOpen={openFilter === "experience"}
          onToggle={() => onSetOpenFilter(openFilter === "experience" ? null : "experience")}
          options={["All", ...experienceFilters]}
          onSelect={(v) => { onSetExperience(v === "All" ? "" : v); onSetOpenFilter(null); onResetPage(); }} />
        <FilterDropdown title="Gender" value={selectedGender || "All"}
          isOpen={openFilter === "gender"}
          onToggle={() => onSetOpenFilter(openFilter === "gender" ? null : "gender")}
          options={["All", ...genderFilters]}
          onSelect={(v) => { onSetGender(v === "All" ? "" : v); onSetOpenFilter(null); onResetPage(); }} />
        <FilterDropdown title="Fees" value={selectedFees || "All"}
          isOpen={openFilter === "fees"}
          onToggle={() => onSetOpenFilter(openFilter === "fees" ? null : "fees")}
          options={["All", ...feesFilters]}
          onSelect={(v) => { onSetFees(v === "All" ? "" : v); onSetOpenFilter(null); onResetPage(); }} />
        <FilterDropdown title="Status" value={selectedStatus || "All"}
          isOpen={openFilter === "status"}
          onToggle={() => onSetOpenFilter(openFilter === "status" ? null : "status")}
          options={["All", ...statusFilters]}
          onSelect={(v) => { onSetStatus(v === "All" ? "" : v); onSetOpenFilter(null); onResetPage(); }} />
      </div>
    </>
  );
};

const FilterDropdown = ({ title, value, options, isOpen, onToggle, onSelect, scrollable = false }: FilterDropdownProps) => {
  return (
    <div className="relative">
      <button type="button" onClick={onToggle}
        className="flex h-9 w-full items-center justify-between rounded-xl bg-slate-50 px-3 text-left text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-blue-50 hover:ring-blue-300">
        <span className="min-w-0">
          {title}:{" "}
          <span className="inline-block max-w-[120px] truncate align-bottom font-bold text-blue-600">{value}</span>
        </span>
        <FaChevronDown className={`ml-2 shrink-0 text-xs cursor-pointer text-blue-500 transition duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className={`absolute left-0 top-12 z-40 w-full overflow-hidden rounded-xl bg-white shadow-xl shadow-sky-100 ring-1 ring-slate-100 ${scrollable ? "max-h-48 overflow-y-auto" : ""}`}>
          {options.map((option) => (
            <button key={option} type="button" onClick={() => onSelect(option)}
              className={`block w-full px-3 py-2.5 text-left cursor-pointer text-xs font-semibold transition ${value === option ? "bg-blue-500 text-white" : "text-slate-700 hover:bg-blue-50 hover:text-blue-600"}`}>
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};