import { useEffect, useState } from "react";
import API from "../../api/axios";
import { FaArrowRight, FaUserCircle, FaUserMd } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { Doctor } from "../../types/doctor.ts";
import { AvailabilityBadge } from "../../utils/AvailabilityBadge.tsx";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { checkAllDoctorsAvailability } from "../../store/slices/DoctorListingSlice";

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
        <FaUserMd className="text-5xl text-blue-300 sm:text-6xl" />
      </div>
    );
  }
  return (
    <img src={src} alt={doctor.user?.name || "Doctor"} className="h-full w-full object-cover object-top"
      onError={() => setError(true)} />
  );
};

export const SeniorDoctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);


  const doctorsPerSlide = 2;
  const fetchDoctors = async () => {
    try {
      const res = await API.get("/doctors", {
        params: {page: 1,limit: 100},
      });

      const doctorsData = res.data?.data?.doctors || res.data?.doctors ||
                          res.data?.data || [];

      const seniorDoctors = doctorsData.filter(
        (doc: Doctor) => Number(doc.experience_years || 0) >= 10
      );

      setDoctors(seniorDoctors);
    } catch (error) {
      console.log("Senior doctors error:", error);
    }
  };
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
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-4 py-12 sm:px-6 lg:py-16">
      <div className="absolute -left-20 top-10 h-52 w-52 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-52 w-52 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[4px] text-blue-700">
              Our Specialists
            </p>
            <h1 className="mt-3 text-3xl font-black text-gray-900 sm:text-4xl">
              Meet Our{" "}
              <span className="bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">
                Senior Doctors
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">
              10+ years experienced specialists for trusted healthcare.
            </p>
          </div>

          <button onClick={() => {window.scrollTo({ top: 0, behavior: "instant" });
            navigate("/doctors");
          }} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-900 px-7 text-sm cursor-pointer font-bold text-white shadow-lg transition hover:scale-105 sm:w-fit">
            View All Doctors
            <FaArrowRight />
          </button>
        </div>

        <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ x: 160, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -160, opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeInOut" }}
              className={`grid gap-6 ${visibleDoctors.length === 1 ? "mx-auto max-w-xl grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
              {visibleDoctors.map((doctor) => (
                <div key={doctor.id} className="group flex flex-col items-center gap-5 rounded-3xl border border-blue-100 bg-white/90 p-5 text-center shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl sm:flex-row sm:text-left">
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-[5px] border-white bg-gradient-to-br from-blue-100 to-cyan-100 shadow-2xl ring-4 ring-blue-100 sm:h-32 sm:w-32">
                    <SeniorDoctorImage doctor={doctor} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-black text-gray-900 sm:text-xl">
                      DR. {doctor.user?.name?.toUpperCase() || "UNKNOWN"}
                    </h2>
                    <p className="mt-1 truncate text-sm font-semibold text-gray-600">
                      {doctor.education || "Senior Specialist"}
                    </p>
                    <p className="mt-1 text-sm font-bold uppercase text-blue-600">
                      {doctor.specialization || "Specialist"}
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                      <span className="rounded-full bg-blue-100 px-4 py-2 text-xs font-bold text-blue-700">
                        {doctor.experience_years}+ Years
                      </span>
                      <AvailabilityBadge isAvailable={doctorAvailability[String(doctor.id)] ?? null}
                        isChecking={availabilityLoading[String(doctor.id)] ?? false} />
                    </div>

                    <div className="mt-4 flex justify-center sm:justify-start">
                      <button onClick={() => {
                        window.scrollTo({ top: 0, behavior: "instant" });
                        navigate(`/doctor-details/${doctor.id}`);
                      }}
                        className="flex h-11 items-center justify-center cursor-pointer gap-2 rounded-full bg-blue-700 px-5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:bg-blue-900" >
                        <FaUserCircle className="text-xl cursor-pointer" />
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
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: totalSlides }, (_, index) => (
              <button key={index} onClick={() => setCurrentSlide(index)}
                className={`h-2.5 rounded-full transition-all ${currentSlide === index ? "w-8 bg-blue-700" : "w-2.5 bg-gray-300"}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};