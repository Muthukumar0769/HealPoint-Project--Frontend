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
      <section className="relative overflow-hidden bg-blue-900 px-5 pt-24 pb-12 sm:px-8 lg:px-10 lg:pt-28 lg:pb-14">
        <div className="absolute -left-16 top-8 h-52 w-52 rounded-full bg-blue-700/40" />
        <div className="absolute -right-16 bottom-0 h-44 w-44 rounded-full bg-blue-800/50" />
        <div className="absolute right-8 top-16 h-24 w-24 rounded-full bg-cyan-700/30" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold text-blue-200">
            <FaUsers /> Contact Us
          </div>
          <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-[40px]">
            We Are Here <br />
            To <span className="text-cyan-400">Help You</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-blue-200">
            Have a question or need assistance? Reach out to us and our team will get back to you as soon as possible. We are always happy to help you with better healthcare support.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <button className="rounded-xl cursor-pointer bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-105">
              Contact Now
            </button>
            <div className="flex flex-wrap gap-2">
              {["24/7 Support", "Quick Response", "Trusted Care"].map((pill) => (
                <span key={pill} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-blue-200">{pill}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info Bar */}
      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="grid overflow-hidden rounded-2xl bg-white shadow-lg sm:grid-cols-2 lg:grid-cols-4">
          {contactInfo.map((item, index) => (
            <div key={index} className="flex items-center gap-3 border-b p-4 last:border-b-0 sm:p-5 lg:border-b-0 lg:border-r lg:last:border-r-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-base text-blue-600 sm:h-11 sm:w-11">
                {item.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold sm:text-sm">{item.title}</h3>
                <p className="mt-0.5 break-words text-[11px] leading-5 text-gray-600 sm:text-xs">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-lg sm:p-6">
          <h2 className="text-lg font-bold sm:text-xl">Send Us A Message</h2>
          <div className="mt-2.5 h-1 w-14 rounded-full bg-blue-600" />
          <p className="mt-3 text-xs leading-5 text-gray-600">
            Fill out the form below and we will get back to you shortly.
          </p>
          <form className="mt-5 space-y-3.5">
            <div className="grid gap-3.5 md:grid-cols-2">
              <InputBox icon={<FaUser />} type="text" placeholder="Your Name" />
              <InputBox icon={<FaEnvelope />} type="email" placeholder="Your Email" />
            </div>
            <InputBox icon={<FaPhone />} type="text" placeholder="Phone Number" />
            <InputBox icon={<FaPen />} type="text" placeholder="Subject" />
            <div className="flex items-start rounded-xl border border-gray-300 px-4 py-2.5 transition focus-within:border-blue-600">
              <FaPen className="mt-1 shrink-0 text-xs text-gray-400" />
              <textarea placeholder="Your Message" rows={4}
                className="w-full resize-none bg-transparent px-3 text-sm outline-none" />
            </div>
            <button type="submit" className="flex h-11 cursor-pointer w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700">
              Send Message <FaPaperPlane />
            </button>
          </form>
        </div>
        <div className="space-y-5">
          <div className="h-52 overflow-hidden rounded-2xl bg-white shadow-lg sm:h-64">
            <iframe title="map" src="https://www.google.com/maps?q=Coimbatore,Tamil%20Nadu,India&output=embed"
              className="h-full w-full border-0" loading="lazy" />
          </div>
          <div className="grid gap-5 rounded-2xl bg-blue-50 p-5 shadow-lg md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-base font-bold sm:text-lg">Our Office</h2>
              <p className="mt-2 text-xs leading-5 text-gray-600">
                Visit us at our office for any queries or assistance.
              </p>
              <div className="mt-3 space-y-2">
                {officePoints.map((point, index) => (
                  <p key={index} className="flex items-start gap-2 text-xs text-gray-700">
                    <FaCircleCheck className="mt-0.5 shrink-0 text-blue-600" />
                    {point}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex justify-center text-blue-600">
              <FaHospital className="text-[80px] sm:text-[90px]" />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-white p-4 text-center shadow-lg sm:p-5 md:flex-row md:text-left">
          <div className="flex flex-col items-center gap-2.5 sm:flex-row sm:text-left">
            <FaHeartPulse className="shrink-0 text-3xl text-blue-600" />
            <p className="text-xs leading-5 text-gray-600">
              Your health and satisfaction are our top priorities.<br />
              We look forward to hearing from you!
            </p>
          </div>
          <div className="flex flex-col items-center gap-2.5 sm:flex-row">
            <p className="text-xs font-semibold">Stay Connected</p>
            <div className="flex items-center gap-2">
              {socialLinks.map((item, index) => {
                const Icon = item.icon;
                return (
                  <a key={index} href={item.link} target="_blank" rel="noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white">
                    <Icon className="text-sm" />
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
  <div className="flex h-11 items-center rounded-xl border border-gray-300 px-3.5 transition focus-within:border-blue-600">
    <span className="shrink-0 text-xs text-gray-400">{icon}</span>
    <input type={type} placeholder={placeholder} className="h-full w-full bg-transparent px-3 text-sm outline-none" />
  </div>
);