import { useEffect, useState } from "react";
import {
  FaCheckCircle, FaUserMd, FaClock, FaShieldAlt, FaHospitalUser, FaNotesMedical, FaLanguage,
  FaPhoneAlt, FaArrowLeft
} from "react-icons/fa";
import { FaStar, FaStarHalf, FaRegStar, FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchDoctorById } from "../../store/slices/DoctorListingSlice";
import type { InfoBoxProps } from "../../types/common";
import type { AdminDoctor } from "../../types/doctor";
import API from "../../api/axios";
import type { Review } from "../../types/patient";
import toast from "react-hot-toast";
import usePageTitle from "../../hooks/usePageTitle";

const avatarColors = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500",
  "bg-pink-500", "bg-amber-500", "bg-cyan-500",
];

const getAvatarColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length];

//--------Get a Image-----------

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

//--------Display the star rating in details card-----------

const StarDisplay = ({ rating, max = 5 }: { rating: number; max?: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: max }).map((_, i) => {
      const filled = i < Math.floor(rating);
      const half = !filled && i < rating;
      return filled ? <FaStar key={i} className="text-yellow-400 text-xs" /> : half
        ? <FaStarHalf key={i} className="text-yellow-400 text-xs" />
        : <FaRegStar key={i} className="text-slate-300 text-xs" />;
    })}
  </div>
);

const StarDisplayLg = ({ rating, max = 5 }: { rating: number; max?: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: max }).map((_, i) => {
      const filled = i < Math.floor(rating);
      const half = !filled && i < rating;
      return filled ? <FaStar key={i} className="text-yellow-400 text-sm" /> : half
        ? <FaStarHalf key={i} className="text-yellow-400 text-sm" />
        : <FaRegStar key={i} className="text-slate-300 text-sm" />;
    })}
  </div>
);

//-----Separate Component for Reviews section if patient gives any reviews means the reviews show in this page---------

const ReviewsSection = ({ reviews, loading, }: {
  reviews: Review[];
  loading: boolean;
}) => {
  const [open, setOpen] = useState(true);
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });

  return (
    <section className="mt-4 rounded-2xl bg-white shadow-lg shadow-sky-100 overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-4 py-3 sm:px-5 cursor-pointer hover:bg-slate-50 transition">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-extrabold text-slate-900">Patient Reviews</h3>
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-600">
            {reviews.length}
          </span>
          {!loading && reviews.length > 0 && (
            <div className="flex items-center gap-1.5 ml-1">
              <FaStar className="text-yellow-400 text-sm" />
              <span className="text-sm font-bold text-slate-700">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-slate-400">/ 5</span>
            </div>
          )}
        </div>
        {open ? <FaChevronUp className="text-slate-400 text-sm" /> : <FaChevronDown className="text-slate-400 text-sm" />}
      </button>
      {open && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">Loading reviews…</div>
          ) : reviews.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">No reviews yet.</div>
          ) : (
            <div className={`space-y-3 pr-2 ${reviews.length > 5 ? "overflow-y-auto" : ""}`} style={reviews.length > 5 ? { maxHeight: "380px" } : {}}>
              {reviews.map((r) => {
                const name = r.patientName || `Patient #${r.patient_id}`;
                const initial = name.charAt(0).toUpperCase();
                const avatarBg = getAvatarColor(name);
                return (
                  <div key={r.id} className="flex gap-2.5 rounded-xl bg-slate-50 p-3">
                    <div className={`shrink-0 h-8 w-8 rounded-full ${avatarBg} flex items-center justify-center text-white text-xs font-bold`}>
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">{name}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 border border-yellow-200 px-2 py-0.5 text-xs font-bold text-yellow-600">
                            <FaStar className="text-yellow-400 text-[10px]" />
                            {r.rating}/5
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{formatDate(r.createdAt)}</span>
                      </div>
                      <div className="mt-1">
                        <StarDisplay rating={r.rating} />
                      </div>
                      {r.review && (
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">{r.review}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

//----Main Component---------

export const DoctorDetails = () => {
  usePageTitle("Doctor Details");
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const { selectedDoctor: doctor, detailsLoading: loading } = useAppSelector((state) => state.doctorListing);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (id) dispatch(fetchDoctorById(id));
  }, [id, dispatch]);

  //--------Fetch the Reviews----------

  useEffect(() => {
    if (!doctor?.id) return;
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const res = await API.get(`/reviews/${doctor.id}`);
        if (res.data.success) setReviews(res.data.data.rows);
      } catch {
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [doctor?.id]);

  //-------Calculate the ratings average----------

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-4 pt-24">
        <div className="rounded-2xl bg-white p-8 text-center text-blue-600 shadow-lg sm:p-10">
          Loading doctor details...
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-4 pt-24">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg sm:p-10">
          <h2 className="text-xl font-bold text-gray-800">Doctor not found</h2>
          <button onClick={() => navigate("/doctors")} className="mt-5 rounded-xl cursor-pointer bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">
            Back to Doctors
          </button>
        </div>
      </div>
    );
  }

  const services = [
    `${doctor.specialization} consultation`,
    "General health checkup",
    "Treatment planning",
    "Follow-up consultation",
  ];

  return (
    <div className="min-h-screen xl:max-w-screen-2xl bg-[#f0f4fb] px-4 pb-8 pt-20 sm:px-6 lg:px-8 lg:pt-20 xl:px-7">
      <div className="mx-auto max-w-6xl">
        <button onClick={() => navigate("/doctors")} className="mb-3 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 sm:px-4">
          <FaArrowLeft />
          Back to Doctors
        </button>

        <section className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-sky-100">
          <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[190px_1fr] lg:grid-cols-[190px_1fr_230px] lg:items-center lg:p-6">
            <div className="mx-auto h-48 w-full max-w-[190px] overflow-hidden rounded-2xl border border-slate-100 bg-blue-50 shadow-md md:h-52 md:w-full lg:mx-0">
              <DoctorImage doctor={doctor} />
            </div>
            <div className="min-w-0 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                  Dr. {doctor.user?.name || "Unknown"}
                </h1>
                <FaCheckCircle className="text-blue-500" />
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                  {doctor.specialization}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {doctor.education || "Medical Specialist"}
              </p>
              <div className="mt-2 flex items-center justify-center gap-1.5 md:justify-start">
                {reviewsLoading ? (
                  <span className="text-xs text-slate-400">Loading rating…</span>
                ) : reviews.length > 0 ? (
                  <>
                    <StarDisplayLg rating={avgRating} />
                    <span className="ml-1 text-sm font-bold text-slate-700">
                      {avgRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400">No reviews yet</span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap justify-center gap-1.5 md:justify-start">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                  {doctor.experience_years}+ yrs experience
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {doctor.user?.gender || "N/A"}
                </span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                  500+ patients
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-1">
              <div className="rounded-2xl bg-blue-50 px-4 py-3 text-center">
                <p className="text-xs font-semibold text-slate-500">Consultation Fee</p>
                <p className="text-2xl font-extrabold text-blue-600">₹{doctor.consultation_fee}</p>
              </div>
              <button onClick={() => {
                const token = localStorage.getItem("accessToken");
                if (!token) {
                  toast.error("Please login to book an appointment");
                  navigate("/login");
                  return;
                }
                navigate(`/doctors/doctor-details/book-appointment/${doctor.id}`, { state: { doctor } });
              }}
                className="h-9 rounded-xl bg-blue-600 cursor-pointer px-5 text-xs font-bold text-white shadow-md shadow-blue-100 transition hover:scale-[1.02] hover:bg-blue-700">
                Book Appointment
              </button>
            </div>
          </div>
        </section>
        <section className="mt-4 rounded-2xl bg-white p-4 shadow-lg shadow-sky-100 sm:p-5">
          <h2 className="text-base font-extrabold text-slate-900">About Doctor</h2>
          <p className="mt-2 text-xs leading-6 text-slate-600">
            {doctor.bio || `Dr. ${doctor.user?.name || "Doctor"} is an experienced ${doctor.specialization} specialist focused on patient-friendly care, clear diagnosis, and proper treatment guidance.`}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoBox icon={<FaClock />} title="Availability" text="Morning & evening slots" color="blue" />
            <InfoBox icon={<FaShieldAlt />} title="Trusted Care" text="Safe and patient-first" color="emerald" />
            <InfoBox icon={<FaHospitalUser />} title="Patients" text="500+ happy patients" color="cyan" />
            <InfoBox icon={<FaLanguage />} title="Languages" text="English / Tamil" color="violet" />
          </div>
        </section>
        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-lg shadow-sky-100 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <FaNotesMedical />
              </span>
              Services Offered
            </h3>
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                  <FaCheckCircle className="shrink-0 text-emerald-500" />
                  {service}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-lg shadow-sky-100 sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-extrabold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
                <FaPhoneAlt />
              </span>
              Consultation Details
            </h3>
            <div className="space-y-3">
              {[
                { label: "Email", value: doctor.user?.email || "Not available" },
                { label: "Phone", value: doctor.user?.phone_number?.toString() || "Not available" },
                { label: "Mode", value: "In-clinic & video consultation" },
                { label: "Follow-up", value: "Available after confirmation" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-0.5 rounded-xl bg-slate-50 px-3 py-2 text-xs sm:flex-row sm:items-start sm:justify-between">
                  <span className="font-semibold text-slate-500">{item.label}</span>
                  <span className="break-words font-medium text-slate-700 sm:ml-4 sm:text-right">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <ReviewsSection reviews={reviews} loading={reviewsLoading} />
      </div>
    </div>
  );
};

const colorMap = {
  blue: "bg-blue-100 text-blue-600",
  emerald: "bg-emerald-100 text-emerald-600",
  cyan: "bg-cyan-100 text-cyan-600",
  violet: "bg-violet-100 text-violet-600",
};

const InfoBox = ({ icon, title, text, color }: InfoBoxProps) => (
  <div className="rounded-xl bg-slate-50 p-3 text-center sm:text-left">
    <div className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl text-base sm:mx-0 ${colorMap[color]}`}>
      {icon}
    </div>
    <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    <p className="mt-1 text-xs text-slate-500">{text}</p>
  </div>
);