import { useEffect, useState } from "react";
import API from "../../api/axios";
import { FaArrowRight, FaUserCircle, FaUserMd } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { Doctor } from "../../types/doctor.ts";
import { AvailabilityBadge } from "../../utils/AvailabilityBadge.tsx";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { checkAllDoctorsAvailability } from "../../store/slices/DoctorListingSlice";

//------Get a Doctor Image----------

const SeniorDoctorImage = ({ doctor }: { doctor: Doctor }) => {
  const [src, setSrc] = useState<string>("");
  const [error, setError] = useState(false);
  useEffect(() => {
    const raw = doctor.user?.profile_picture || doctor.image || "";
    if (!raw) return;
    const normalized = raw.replace(/^http:\/\//, "https://");
    fetch(normalized, { headers: { "ngrok-skip-browser-warning": "true" } })
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.blob(); })
      .then((blob) => setSrc(URL.createObjectURL(blob)))
      .catch(() => setError(true));
  }, [doctor]);

  if (!src || error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-blue-50">
        <FaUserMd className="text-4xl text-blue-300 sm:text-5xl" />
      </div>
    );
  }
  return (
    <img src={src} alt={doctor.user?.name || "Doctor"} className="h-full w-full object-cover object-top"
      onError={() => setError(true)} />
  );
};

//-------Main Component----------

export const SeniorDoctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const doctorsPerSlide = 2;

//---------Fetch the Doctor Logic with more than 10 years experience-------

  const fetchDoctors = async () => {
    try {
      const res = await API.get("/doctors", { params: { page: 1, limit: 100 } });
      const doctorsData = res.data?.data?.doctors || res.data?.doctors || res.data?.data || [];
      const seniorDoctors = doctorsData.filter((doc: Doctor) => Number(doc.experience_years || 0) >= 10).slice(0, 4);
      setDoctors(seniorDoctors);
    } catch (error) {
      console.log("Senior doctors error:", error);
    }
  };

//-------To get the available/unavailable Badge

  const dispatch = useAppDispatch();
  const { doctorAvailability, availabilityLoading } = useAppSelector(
    (state) => state.doctorListing
  );

  useEffect(() => {
    if (doctors.length > 0) {
      const ids = doctors.map((d) => String(d.id));
      dispatch(checkAllDoctorsAvailability(ids));
    }
  }, [doctors, dispatch]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const totalSlides = Math.ceil(doctors.length / doctorsPerSlide);

  //-----This logic for how many doctors per slide-----------

  useEffect(() => {
    if (totalSlides <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 3500);
    return () => clearInterval(interval);
  }, [totalSlides]);

  if (doctors.length === 0) return null;

  const startIndex = currentSlide * doctorsPerSlide;
  const visibleDoctors = doctors.slice(startIndex, startIndex + doctorsPerSlide);

  return (
    <section className="relative overflow-hidden bg-blue-900 px-4 py-7 sm:px-6 sm:py-9 lg:py-12">
      <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-blue-700/40 sm:h-52 sm:w-52" />
      <div className="absolute -right-16 bottom-10 h-40 w-40 rounded-full bg-blue-800/50 sm:h-52 sm:w-52" />
      <div className="absolute right-10 top-16 h-24 w-24 rounded-full bg-cyan-700/30 sm:h-32 sm:w-32" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:mb-7 lg:flex-row lg:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[3px] text-blue-300">
              Our Specialists
            </p>
            <h1 className="mt-1.5 text-xl font-black text-white sm:mt-2 sm:text-2xl lg:text-3xl">
              Meet Our{" "}
              <span className="text-cyan-400">Senior Doctors</span>
            </h1>
            <p className="mt-1.5 max-w-xl text-xs leading-6 text-blue-200 sm:mt-2 sm:text-sm">
              10+ years experienced specialists for trusted healthcare.
            </p>
          </div>

          <button onClick={() => { window.scrollTo({ top: 0, behavior: "instant" }); navigate("/doctors"); }}
            className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-blue-900 shadow-lg transition hover:scale-105 sm:h-10 sm:w-fit sm:px-5 sm:text-xs">
            View All Doctors
            <FaArrowRight />
          </button>
        </div>

        <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={currentSlide} initial={{ x: 160, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              exit={{ x: -160, opacity: 0 }} transition={{ duration: 0.55, ease: "easeInOut" }}
              className={`grid gap-4 sm:gap-6 ${visibleDoctors.length === 1 ? "mx-auto max-w-xl grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
              {visibleDoctors.map((doctor) => (
                <div key={doctor.id} className="group flex flex-col items-center gap-3 rounded-2xl border border-blue-700 bg-blue-800/60 p-4 text-center shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl xs:gap-4 xs:p-4 sm:flex-row sm:rounded-3xl sm:text-left">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/20 bg-blue-700 shadow-xl ring-4 ring-blue-600/40 xs:h-24 xs:w-24 sm:h-28 sm:w-28">
                    <SeniorDoctorImage doctor={doctor} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-black text-white xs:text-base sm:text-lg">
                      DR. {doctor.user?.name?.toUpperCase() || "UNKNOWN"}
                    </h2>
                    <p className="mt-0.5 truncate text-[10px] font-semibold text-blue-300 xs:text-xs">
                      {doctor.education || "Senior Specialist"}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase text-cyan-400 xs:text-sm">
                      {doctor.specialization || "Specialist"}
                    </p>

                    <div className="mt-2 flex flex-wrap justify-center gap-2 xs:mt-3 sm:justify-start">
                      <span className="rounded-full bg-blue-700 px-3 py-1.5 text-xs font-bold text-blue-200 xs:px-4 xs:py-2">
                        {doctor.experience_years}+ Years
                      </span>
                      <AvailabilityBadge isAvailable={doctorAvailability[String(doctor.id)] ?? null}
                        isChecking={availabilityLoading[String(doctor.id)] ?? false}/>
                    </div>
                    <div className="mt-3 flex justify-center xs:mt-4 sm:justify-start">
                      <button onClick={() => { window.scrollTo({ top: 0, behavior: "instant" }); navigate(`/doctor-details/${doctor.id}`); }} className="flex h-8 cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-blue-900 shadow-lg transition-all duration-300 hover:bg-blue-50  xs:h-9 xs:px-4 xs:text-xs">
                        <FaUserCircle className="text-lg xs:text-xl" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {totalSlides > 1 && (
          <div className="mt-6 flex justify-center gap-2 sm:mt-8">
            {Array.from({ length: totalSlides }, (_, index) => (
              <button key={index} onClick={() => setCurrentSlide(index)} className={`h-2 rounded-full transition-all sm:h-2.5 ${
                  currentSlide === index ? "w-7 bg-white sm:w-8" : "w-2 bg-blue-500 sm:w-2.5"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};