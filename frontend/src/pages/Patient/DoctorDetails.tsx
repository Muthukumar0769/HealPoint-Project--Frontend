import { useEffect, useState } from "react";
import {FaCheckCircle,FaUserMd,FaClock,FaShieldAlt,FaHospitalUser,FaNotesMedical,FaLanguage,FaPhoneAlt,FaArrowLeft,} from "react-icons/fa";
import { FaStar, FaVideo } from "react-icons/fa6";
import { useNavigate, useParams } from "react-router-dom";
import API, { IMAGE_BASE_URL } from "../../api/axios";

type Doctor = {
  id: number;
  education?: string | null;
  specialization: string;
  experience_years: number;
  consultation_fee: string;
  bio: string;
  image?: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
    gender: string;
    role: string;
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
      <div className="flex h-full w-full items-center justify-center bg-blue-50">
        <FaUserMd className="text-5xl text-blue-300 sm:text-6xl" />
      </div>
    );
  }

  return (
    <img src={imageUrl} alt={doctor.user?.name || "Doctor"} className="h-full w-full object-cover object-top"
      onError={() => setError(true)}/>
  );
};

export const DoctorDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDoctorDetails = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/doctors/${id}`);
      const doctorData =
        response.data?.data?.doctor ||
        response.data?.doctor ||
        response.data?.data ||
        response.data;

      setDoctor(doctorData || null);
    } catch {
      setDoctor(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (id) fetchDoctorDetails();
  }, [id]);

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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-4 pb-12 pt-24 sm:px-6 lg:px-8 lg:pt-28">
      <div className="mx-auto max-w-6xl">
        <button onClick={() => navigate("/doctors")} className="mb-5 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 sm:px-4">
          <FaArrowLeft />
          Back to Doctors
        </button>
        <section className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-sky-100">
          <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[220px_1fr] lg:grid-cols-[220px_1fr_260px] lg:items-center lg:p-8">
            <div className="mx-auto h-64 w-full max-w-[240px] overflow-hidden rounded-2xl border border-slate-100 bg-blue-50 shadow-md md:h-64 md:w-full lg:mx-0">
              <DoctorImage doctor={doctor} />
            </div>

            <div className="min-w-0 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  Dr. {doctor.user?.name || "Unknown"}
                </h1>

                <FaCheckCircle className="text-blue-500" />
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                  {doctor.specialization}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-400">{doctor.education || "Medical Specialist"}</p>
              <div className="mt-3 flex items-center justify-center gap-1 md:justify-start">
                {[1, 2, 3, 4].map((s) => (
                  <FaStar key={s} className="text-sm text-yellow-400" />
                ))}
                <span className="ml-1 text-sm font-bold text-slate-700">4.8</span>
                <span className="text-xs text-slate-400">(120 reviews)</span>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
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
              <div className="rounded-2xl bg-blue-50 px-6 py-4 text-center">
                <p className="text-xs font-semibold text-slate-500">
                  Consultation Fee
                </p>
                <p className="text-3xl font-extrabold text-blue-600">₹{doctor.consultation_fee}</p>
              </div>

              <button onClick={() =>navigate(
                    `/doctors/doctor-details/book-appointment/${doctor.id}`,
                    {
                      state: { doctor },
                    }
                  )
                }
                className="h-11 rounded-xl bg-blue-600 cursor-pointer px-6 text-sm font-bold text-white shadow-md shadow-blue-100 transition hover:scale-[1.02] hover:bg-blue-700">
                Book Appointment
              </button>
              <button className="flex h-11 items-center cursor-pointer justify-center gap-2 rounded-xl bg-cyan-500 px-6 text-sm font-bold text-white shadow-md shadow-cyan-100 transition hover:scale-[1.02] hover:bg-cyan-600">
                <FaVideo />
                Video Consultation
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-lg shadow-sky-100 sm:p-6">
          <h2 className="text-base font-extrabold text-slate-900">
            About Doctor
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            {doctor.bio ||
              `Dr. ${
                doctor.user?.name || "Doctor"
              } is an experienced ${
                doctor.specialization
              } specialist focused on patient-friendly care, clear diagnosis, and proper treatment guidance.`}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoBox icon={<FaClock />} title="Availability" text="Morning & evening slots" color="blue"/>
            <InfoBox icon={<FaShieldAlt />} title="Trusted Care" text="Safe and patient-first" color="emerald"/>
            <InfoBox icon={<FaHospitalUser />} title="Patients" text="500+ happy patients" color="cyan"/>
            <InfoBox icon={<FaLanguage />} title="Languages" text="English / Tamil" color="violet"/>
          </div>
        </section>
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-lg shadow-sky-100 sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-extrabold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <FaNotesMedical />
              </span>
              Services Offered
            </h3>
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
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
                {
                  label: "Email",
                  value: doctor.user?.email || "Not available",
                },
                {
                  label: "Phone",
                  value: doctor.user?.phone_number?.toString() || "Not available",
                },
                {
                  label: "Mode",
                  value: "In-clinic & video consultation",
                },
                {
                  label: "Follow-up",
                  value: "Available after confirmation",
                },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-1 rounded-xl bg-slate-50 px-4 py-3 text-sm sm:flex-row sm:items-start sm:justify-between">
                  <span className="font-semibold text-slate-500">
                    {item.label}
                  </span>
                  <span className="break-words font-medium text-slate-700 sm:ml-4 sm:text-right">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const InfoBox = ({
  icon,
  title,
  text,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  color: "blue" | "emerald" | "cyan" | "violet";
}) => {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    cyan: "bg-cyan-100 text-cyan-600",
    violet: "bg-violet-100 text-violet-600",
  };

  return (
    <div className="rounded-2xl bg-slate-50 p-4 text-center sm:text-left">
      <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-lg sm:mx-0 ${colorMap[color]}`}>
        {icon}
      </div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{text}</p>
    </div>
  );
};