import { useEffect, useState } from "react";
import {FaClipboardList,FaBriefcaseMedical,FaRegClock,FaHeart,FaUsers,FaArrowAltCircleRight,FaUserMd} from "react-icons/fa";
import { FaShieldHeart, FaUserDoctor } from "react-icons/fa6";
import { Link } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle";
import API from "../../api/axios";

const stats = [
  { icon: <FaUsers />, count: "10K+", title: "Happy Patients", desc: "We have served thousands of patients with care.", color: "bg-blue-500" },
  { icon: <FaUserDoctor />, count: "200+", title: "Expert Doctors", desc: "Experienced specialists across all departments.", color: "bg-green-500" },
  { icon: <FaClipboardList />, count: "50K+", title: "Appointments", desc: "Appointments booked successfully every month.", color: "bg-orange-500" },
  { icon: <FaBriefcaseMedical />, count: "20+", title: "Specializations", desc: "Wide range of medical specialists under one roof.", color: "bg-purple-500" },
];

const values = [
  { icon: <FaShieldHeart />, title: "Trusted & Safe", desc: "Your safety and privacy are our top priority.", color: "bg-blue-100 text-blue-600" },
  { icon: <FaUserDoctor />, title: "Expert Doctors", desc: "Qualified and experienced doctors you can trust.", color: "bg-green-100 text-green-600" },
  { icon: <FaRegClock />, title: "Fast Appointments", desc: "Quick booking with real-time availability.", color: "bg-purple-100 text-purple-600" },
  { icon: <FaHeart />, title: "Patient First", desc: "Compassionate care designed for you.", color: "bg-red-100 text-red-500" },
];

const DoctorImage = ({ doctor }: { doctor: any }) => {
  const [src, setSrc] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => {
    const raw = doctor.user?.profile_picture || doctor.image || "";
    if (!raw) return;
    const normalized = raw.replace(/^http:\/\//, "https://");
    fetch(normalized, { headers: { "ngrok-skip-browser-warning": "true" } })
      .then((res) => { if (!res.ok) throw new Error(); return res.blob(); })
      .then((blob) => setSrc(URL.createObjectURL(blob)))
      .catch(() => setError(true));
  }, [doctor]);
  if (!src || error) return (
    <div className="flex h-full w-full items-center justify-center bg-blue-50">
      <FaUserMd className="text-4xl text-blue-300" />
    </div>
  );
  return <img src={src} alt={doctor.user?.name || "Doctor"} className="h-full w-full object-cover object-top" onError={() => setError(true)} />;
};

export const About = () => {
  usePageTitle("About Us");
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await API.get("/doctors", { params: { page: 1, limit: 100 } });
        const all = res.data?.data?.doctors || res.data?.doctors || res.data?.data || [];
        const senior = all.filter((d: any) => Number(d.experience_years || 0) >= 10).slice(0, 4);
        setDoctors(senior);
      } catch (e) { console.log(e); }
    };
    fetchDoctors();
  }, []);

  return (
    <main className="min-h-screen bg-[#f0f4fb] text-gray-800">
      <section className="relative overflow-hidden bg-blue-900 px-5 pt-24 pb-12 sm:px-8 lg:px-10 lg:pt-28 lg:pb-14">
        <div className="absolute -left-16 top-8 h-52 w-52 rounded-full bg-blue-700/40" />
        <div className="absolute -right-16 bottom-0 h-44 w-44 rounded-full bg-blue-800/50" />
        <div className="absolute right-8 top-16 h-24 w-24 rounded-full bg-cyan-700/30" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-3 py-1.5 text-xs font-semibold text-blue-200">
            <FaUsers /> About Us
          </div>
          <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-[40px]">
            Compassionate Care <br />
            You Can <span className="text-cyan-400">Trust</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-blue-200">
            At HealPoint, we provide world-class healthcare services with experienced doctors, modern facilities, and patient-first care designed for you and your family.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link to="/doctors" className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-105">
              Book Appointment <FaArrowAltCircleRight />
            </Link>
            <Link to="/doctors" className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
              Our Doctors
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {["Trusted Platform", "24/7 Available", "Certified Doctors"].map((pill) => (
              <span key={pill} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-blue-200">{pill}</span>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="grid overflow-hidden rounded-2xl bg-white shadow-lg sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item, index) => (
            <div key={index} className="flex gap-3 border-b p-4 last:border-b-0 sm:p-5 lg:border-b-0 lg:border-r lg:p-6 lg:last:border-r-0">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-white sm:h-12 sm:w-12 ${item.color}`}>
                {item.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">{item.count}</h2>
                <h3 className="mt-0.5 text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-5 lg:items-center">
        <div className="text-center lg:col-span-1 lg:text-left">
          <p className="mb-2 text-xs font-bold uppercase text-blue-600">Our Values</p>
          <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
            Better Care. <br />
            Better <span className="text-blue-600">Health.</span>
          </h2>
          <p className="mt-4 text-sm leading-6 text-gray-600">
            We believe in transparency, compassion, and excellence. Our goal is to make quality healthcare accessible and affordable for everyone.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-4">
          {values.map((item, index) => (
            <div key={index} className="rounded-2xl bg-white p-5 text-center shadow-md transition duration-300 hover:-translate-y-1 sm:p-6">
              <div className={`mx-auto mb-4 flex h-13 w-13 items-center justify-center rounded-full text-xl sm:h-14 sm:w-14 sm:text-2xl ${item.color}`}>
                {item.icon}
              </div>
              <h3 className="text-sm font-bold">{item.title}</h3>
              <p className="mt-2 text-xs leading-5 text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase text-blue-600">Our Team</p>
          <h2 className="mt-1.5 text-2xl font-bold sm:text-3xl">
            Meet Our Expert <span className="text-blue-600">Doctors</span>
          </h2>
          <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-blue-600" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {doctors.map((doctor, index) => (
            <div key={index} className="overflow-hidden rounded-2xl bg-white text-center shadow-md transition duration-300 hover:-translate-y-1">
              <div className="h-40 w-full bg-blue-50">
                <DoctorImage doctor={doctor} />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold">{doctor.user?.name || "Doctor"}</h3>
                <p className="mt-1 text-xs font-semibold text-blue-600">{doctor.specialization || "Specialist"}</p>
                <p className="mt-1 text-xs text-gray-500">{doctor.experience_years}+ Years Experience</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
};