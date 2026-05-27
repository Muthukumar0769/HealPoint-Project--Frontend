import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import doctorImg from "../../assets/images/doctorImage-removebg-preview.png";
import AlarmClock from "../../assets/images/alarmclock.png";

export const Banner = () => {
  const navigate = useNavigate();

  return (
    <>
      <h1 className="px-4 text-center text-2xl font-semibold sm:text-3xl">
        Why Choose Us
      </h1>
      <section className="overflow-hidden bg-white px-4 py-12 sm:px-6 lg:py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative mx-auto w-full max-w-md lg:max-w-lg">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 rounded-full border-4 border-dashed border-blue-200 sm:border-[6px]"/>

            <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-blue-200 opacity-40 blur-3xl sm:h-40 sm:w-40" />
            <motion.img
              animate={{ y: [0, -18, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              src={doctorImg}
              alt="doctor"
              className="relative z-10 mx-auto w-full drop-shadow-2xl"/>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}>
            <h1 className="text-3xl font-bold leading-tight text-gray-800 sm:text-4xl lg:text-5xl">
              Why Choose Our{" "}
              <span className="text-blue-600">Medical Services?</span>
            </h1>

            <p className="mt-5 text-base font-medium leading-7 text-gray-500 sm:text-lg sm:leading-8">
              We provide trusted healthcare solutions with experienced doctors,
              instant appointment booking, modern medical support, and
              patient-friendly care.
            </p>

            <div className="mt-8 space-y-5 sm:mt-10 sm:space-y-6">
              <FeatureCard icon={<span className="text-2xl text-white">✓</span>} title="Expert Doctors"
                text="Highly experienced specialists for every treatment."/>
              <FeatureCard icon={<img src={AlarmClock} alt="Fast appointment" className="w-8" />} title="Fast Appointments" 
                text="Quick online booking with live slot availability."/>
              <FeatureCard icon={<FaHeart className="text-2xl text-red-500" />} title="Patient Care"
                text="Comfortable treatment with advanced healthcare support."/>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/doctors")}
              className="mt-8 rounded-full bg-blue-600 cursor-pointer px-7 py-3 font-semibold text-white shadow-xl transition hover:bg-blue-700 sm:mt-10 sm:px-8 sm:py-4">
              Book Appointment
            </motion.button>
          </motion.div>
        </div>
      </section>
    </>
  );
};

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  text: string;
};

const FeatureCard = ({ icon, title, text }: FeatureCardProps) => {
  return (
    <motion.div whileHover={{ scale: 1.03 }}
      className="flex items-center gap-4 rounded-2xl bg-blue-50 p-4 shadow-md sm:gap-5 sm:p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-500 sm:h-14 sm:w-14">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold sm:text-xl">{title}</h3>
        <p className="text-sm text-gray-600 sm:text-base">{text}</p>
      </div>
    </motion.div>
  );
};