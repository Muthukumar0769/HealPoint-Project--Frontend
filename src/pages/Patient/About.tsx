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
      <FaUserMd className="text-5xl text-blue-300" />
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
      <section className="relative overflow-hidden bg-blue-900 px-5 pt-32 pb-16 sm:px-8 lg:px-10 lg:pt-36 lg:pb-20">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-blue-700/40" />
        <div className="absolute -right-20 bottom-0 h-52 w-52 rounded-full bg-blue-800/50" />
        <div className="absolute right-10 top-20 h-32 w-32 rounded-full bg-cyan-700/30" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-2 text-sm font-semibold text-blue-200">
            <FaUsers /> About Us
          </div>
          <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-5xl">
            Compassionate Care <br />
            You Can <span className="text-cyan-400">Trust</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-blue-200 sm:mt-6 sm:text-lg sm:leading-8">
            At HealPoint, we provide world-class healthcare services with experienced doctors, modern facilities, and patient-first care designed for you and your family.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 sm:mt-10">
            <Link to="/doctors" className="flex items-center gap-3 rounded-2xl bg-red-600 px-6 py-4 text-sm font-semibold text-white shadow-xl transition duration-300 hover:scale-105 sm:text-base">
              Book Appointment <FaArrowAltCircleRight />
            </Link>
            <Link to="/doctors" className="flex items-center gap-3 rounded-2xl border border-white/25 bg-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/20 sm:text-base">
              Our Doctors
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            {["Trusted Platform", "24/7 Available", "Certified Doctors"].map((pill) => (
              <span key={pill} className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-blue-200">{pill}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:mt-10">
        <div className="grid overflow-hidden rounded-3xl bg-white shadow-xl sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item, index) => (
            <div key={index} className="flex gap-4 border-b p-5 last:border-b-0 sm:p-6 lg:border-b-0 lg:border-r lg:p-8 lg:last:border-r-0">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl text-white sm:h-16 sm:w-16 sm:text-2xl ${item.color}`}>
                {item.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">{item.count}</h2>
                <h3 className="mt-1 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-5 lg:items-center">
        <div className="text-center lg:col-span-1 lg:text-left">
          <p className="mb-3 font-bold uppercase text-blue-600">Our Values</p>
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
            Better Care. <br />
            Better <span className="text-blue-600">Health.</span>
          </h2>
          <p className="mt-5 leading-7 text-gray-600">
            We believe in transparency, compassion, and excellence. Our goal is to make quality healthcare accessible and affordable for everyone.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-4 lg:gap-6">
          {values.map((item, index) => (
            <div key={index} className="rounded-3xl bg-white p-6 text-center shadow-lg transition duration-300 hover:-translate-y-2 sm:p-8">
              <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-2xl sm:h-20 sm:w-20 sm:text-3xl ${item.color}`}>
                {item.icon}
              </div>
              <h3 className="text-lg font-bold">{item.title}</h3>
              <p className="mt-4 text-sm leading-6 text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mb-10 text-center sm:mb-12">
          <p className="font-bold uppercase text-blue-600">Our Team</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
            Meet Our Expert <span className="text-blue-600">Doctors</span>
          </h2>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-blue-600" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {doctors.map((doctor, index) => (
            <div key={index} className="overflow-hidden rounded-3xl bg-white text-center shadow-lg transition duration-300 hover:-translate-y-2">
              <div className="h-44 w-full bg-blue-50">
                <DoctorImage doctor={doctor} />
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="text-lg font-bold">{doctor.user?.name || "Doctor"}</h3>
                <p className="mt-2 font-semibold text-blue-600">{doctor.specialization || "Specialist"}</p>
                <p className="mt-2 text-sm text-gray-500">{doctor.experience_years}+ Years Experience</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};