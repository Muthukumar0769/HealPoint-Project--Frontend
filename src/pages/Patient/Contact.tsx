import {FaUsers,FaPhone,FaEnvelope,FaLocationDot,FaRegClock,FaUser,FaPen,FaPaperPlane,FaInstagram,
  FaLinkedinIn,FaCircleCheck,FaHeartPulse,FaHospital,} from "react-icons/fa6";
import { FaGithub } from "react-icons/fa";
import type { PatientInputBoxProps } from "../../types/common.ts";
import usePageTitle from "../../hooks/usePageTitle";

const contactInfo = [
  { icon: <FaPhone />, title: "Phone", text: "+91 123 456 7890" },
  { icon: <FaEnvelope />, title: "Email", text: "support@healpoint.com" },
  { icon: <FaLocationDot />, title: "Address", text: "123, Town Hall, Coimbatore, India" },
  { icon: <FaRegClock />, title: "Working Hours", text: "Mon - Sat: 9:00 AM - 8:00 PM" },
];

const officePoints = [
  "Easy to reach location",
  "Modern and comfortable environment",
  "Friendly staff to assist you",
  "Ample parking space",
];

const socialLinks = [
  { icon: FaGithub, link: "https://github.com/Muthukumar0769?tab=repositories" },
  { icon: FaInstagram, link: "https://instagram.com" },
  { icon: FaLinkedinIn, link: "https://www.linkedin.com/in/muthu-1857aa2b2" },
];

export const Contact = () => {
  usePageTitle("Contact Us");
  return (
    <main className="min-h-screen bg-[#f0f4fb] text-gray-800">
      <section className="relative overflow-hidden bg-blue-900 px-5 pt-32 pb-16 sm:px-8 lg:px-10 lg:pt-36 lg:pb-20">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-blue-700/40" />
        <div className="absolute -right-20 bottom-0 h-52 w-52 rounded-full bg-blue-800/50" />
        <div className="absolute right-10 top-20 h-32 w-32 rounded-full bg-cyan-700/30" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-blue-200">
            <FaUsers /> Contact Us
          </div>
          <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-5xl">
            We Are Here <br />
            To <span className="text-cyan-400">Help You</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-blue-200 sm:mt-6 sm:text-lg sm:leading-8">
            Have a question or need assistance? Reach out to us and our team will get back to you as soon as possible. We are always happy to help you with better healthcare support.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 sm:mt-10">
            <button className="rounded-2xl cursor-pointer bg-red-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl transition duration-300 hover:scale-105 sm:text-base">
              Contact Now
            </button>
            <div className="flex flex-wrap gap-3 sm:items-center">
              {["24/7 Support", "Quick Response", "Trusted Care"].map((pill) => (
                <span key={pill} className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-blue-200">{pill}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:mt-8">
        <div className="grid overflow-hidden rounded-3xl bg-white shadow-xl sm:grid-cols-2 lg:grid-cols-4">
          {contactInfo.map((item, index) => (
            <div key={index} className="flex items-center gap-4 border-b p-4 last:border-b-0 sm:gap-5 sm:p-5 lg:border-b-0 lg:border-r lg:p-6 lg:last:border-r-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg text-blue-600 sm:h-14 sm:w-14 sm:text-xl">
                {item.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold sm:text-base">{item.title}</h3>
                <p className="mt-1 break-words text-xs leading-5 text-gray-600 sm:text-sm">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-2 lg:gap-8">
        <div className="rounded-3xl bg-white p-5 shadow-xl sm:p-6">
          <h2 className="text-xl font-bold sm:text-2xl">Send Us A Message</h2>
          <div className="mt-3 h-1 w-16 rounded-full bg-blue-600" />
          <p className="mt-4 text-sm leading-6 text-gray-600">
            Fill out the form below and we will get back to you shortly.
          </p>
          <form className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <InputBox icon={<FaUser />} type="text" placeholder="Your Name" />
              <InputBox icon={<FaEnvelope />} type="email" placeholder="Your Email" />
            </div>
            <InputBox icon={<FaPhone />} type="text" placeholder="Phone Number" />
            <InputBox icon={<FaPen />} type="text" placeholder="Subject" />
            <div className="flex items-start rounded-xl border border-gray-300 px-4 py-3 transition focus-within:border-blue-600">
              <FaPen className="mt-1 shrink-0 text-gray-400" />
              <textarea placeholder="Your Message" rows={4}
                className="w-full resize-none bg-transparent px-3 text-sm outline-none sm:text-base" />
            </div>
            <button type="submit" className="flex h-12 cursor-pointer w-full items-center justify-center gap-3 rounded-xl bg-blue-600 font-semibold text-white shadow-lg transition hover:bg-blue-700">
              Send Message <FaPaperPlane />
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="h-56 overflow-hidden rounded-3xl bg-white shadow-xl sm:h-72 lg:h-64">
            <iframe title="map" src="https://www.google.com/maps?q=Coimbatore,Tamil%20Nadu,India&output=embed"
              className="h-full w-full border-0" loading="lazy" />
          </div>
          <div className="grid gap-6 rounded-3xl bg-blue-50 p-5 shadow-xl sm:p-6 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-xl font-bold">Our Office</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Visit us at our office for any queries or assistance.
              </p>
              <div className="mt-4 space-y-2.5">
                {officePoints.map((point, index) => (
                  <p key={index} className="flex items-start gap-3 text-sm text-gray-700">
                    <FaCircleCheck className="mt-0.5 shrink-0 text-blue-600" />
                    {point}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex justify-center text-blue-600">
              <FaHospital className="text-[90px] sm:text-[110px]" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 sm:pb-12">
        <div className="flex flex-col items-center justify-between gap-5 rounded-3xl bg-white p-5 text-center shadow-xl sm:p-6 md:flex-row md:text-left">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:text-left">
            <FaHeartPulse className="shrink-0 text-4xl text-blue-600" />
            <p className="text-sm leading-6 text-gray-600">
              Your health and satisfaction are our top priorities.<br />
              We look forward to hearing from you!
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <p className="text-sm font-semibold">Stay Connected</p>
            <div className="flex items-center gap-2">
              {socialLinks.map((item, index) => {
                const Icon = item.icon;
                return (
                  <a key={index} href={item.link} target="_blank" rel="noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white">
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

const InputBox = ({ icon, type, placeholder }: PatientInputBoxProps) => (
  <div className="flex h-12 items-center rounded-xl border border-gray-300 px-4 transition focus-within:border-blue-600">
    <span className="shrink-0 text-gray-400">{icon}</span>
    <input type={type} placeholder={placeholder} className="h-full w-full bg-transparent px-3 text-sm outline-none sm:text-base" />
  </div>
);