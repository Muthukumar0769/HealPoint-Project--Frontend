import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaCheckCircle, FaBolt } from "react-icons/fa";
import doctorImg from "../../assets/images/doctorImage-removebg-preview.png";
import type { FeatureCardProps } from "../../types/common.ts";

export const Banner = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <span className="rounded-full bg-blue-100 px-4 py-1 text-xs font-bold uppercase tracking-widest text-blue-600">
          Why Choose Us
        </span>
        <h2 className="text-2xl font-extrabold text-gray-800 sm:text-3xl lg:text-4xl">
          Why Choose Our{" "}
          <span className="text-blue-600">Medical Services?</span>
        </h2>
        <p className="max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
          Trusted healthcare with experienced doctors, instant booking, and
          patient-friendly care — all in one place.
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl items-center gap-6 md:grid-cols-2 lg:gap-10">
        <motion.div initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }} viewport={{ once: true }} className="relative mx-auto flex w-full max-w-[280px] items-end justify-center sm:max-w-[320px]">
          <div className="absolute bottom-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-blue-100 sm:h-64 sm:w-64" />
          <div className="absolute -right-4 top-6 h-16 w-16 rounded-full bg-indigo-200 opacity-50 blur-2xl" />
          <div className="absolute -left-4 top-10 h-12 w-12 rounded-full bg-blue-300 opacity-40 blur-2xl" />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 rounded-full border-4 border-dashed border-blue-300"/>
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -right-3 top-10 flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 shadow-lg">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white">
              <FaCheckCircle className="text-xs" />
            </span>
            <div>
              <p className="text-[10px] font-extrabold text-gray-800">500+</p>
              <p className="text-[9px] text-gray-400">Expert Doctors</p>
            </div>
          </motion.div>

          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }} className="absolute -left-3 bottom-12 flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 shadow-lg">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white">
              <FaHeart className="text-xs" />
            </span>
            <div>
              <p className="text-[10px] font-extrabold text-gray-800">10k+</p>
              <p className="text-[9px] text-gray-400">Happy Patients</p>
            </div>
          </motion.div>
          <motion.img animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}
            src={doctorImg} alt="doctor" className="relative z-10 w-[220px] drop-shadow-xl sm:w-[260px]"/>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }} viewport={{ once: true }} className="flex flex-col gap-4">
          <div className="space-y-3">
            <FeatureCard icon={<FaCheckCircle className="text-xl text-white" />} iconBg="bg-green-500"
              title="Expert Doctors" text="Highly experienced specialists for every treatment."/>
            <FeatureCard icon={<FaBolt className="text-xl text-white" />} iconBg="bg-blue-500"
              title="Fast Appointments" text="Quick online booking with live slot availability."/>
            <FeatureCard icon={<FaHeart className="text-xl text-white" />} iconBg="bg-rose-500"
              title="Patient Care" text="Comfortable treatment with advanced healthcare support."/>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={() => navigate("/doctors")}
            className="mt-2 w-fit rounded-full bg-blue-600 cursor-pointer px-7 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700">
            Book Appointment →
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

const FeatureCard = ({icon,iconBg,title,text,}: FeatureCardProps & { iconBg?: string }) => {
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white px-4 py-3.5 shadow-sm transition">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg ?? "bg-green-500"}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-extrabold text-gray-800 sm:text-base">{title}</h3>
        <p className="text-xs text-gray-500 sm:text-sm">{text}</p>
      </div>
    </motion.div>
  );
};