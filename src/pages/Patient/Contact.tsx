import {FaUsers,FaPhone,FaEnvelope,FaLocationDot,FaRegClock,FaUser,FaPen,FaPaperPlane,FaInstagram,
  FaLinkedinIn,FaCircleCheck,FaHeartPulse,FaHospital,} from "react-icons/fa6";
import { FaGithub } from "react-icons/fa";
import ContactDoctor from "../../assets/images/contactImg.png";
import type { PatientInputBoxProps } from "../../types/common.ts";
import usePageTitle from "../../hooks/usePageTitle";

const contactInfo = [
  {
    icon: <FaPhone />,
    title: "Phone",
    text: "+91 123 456 7890",
  },
  {
    icon: <FaEnvelope />,
    title: "Email",
    text: "support@healpoint.com",
  },
  {
    icon: <FaLocationDot />,
    title: "Address",
    text: "123, Town Hall, Coimbatore, India",
  },
  {
    icon: <FaRegClock />,
    title: "Working Hours",
    text: "Mon - Sat: 9:00 AM - 8:00 PM",
  },
];

const officePoints = [
  "Easy to reach location",
  "Modern and comfortable environment",
  "Friendly staff to assist you",
  "Ample parking space",
];

const socialLinks = [
  {
    icon: FaGithub,
    link: "https://github.com/Muthukumar0769?tab=repositories",
  },
  {
    icon: FaInstagram,
    link: "https://instagram.com",
  },
  {
    icon: FaLinkedinIn,
    link: "https://www.linkedin.com/in/muthu-1857aa2b2",
  },
];

export const Contact = () => {
  usePageTitle("Contact Us");
  return (
    <main className="min-h-screen bg-[#f0f4fb] pt-24 text-gray-800 sm:pt-15">
      <section className="relative w-full overflow-hidden  bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${ContactDoctor})` }}>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-slate-900/30" />
        <div className="relative z-10 flex min-h-[520px] items-center px-5 py-14 sm:min-h-[600px] sm:px-8 lg:min-h-[550px] lg:px-10">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md sm:px-5">
              <FaUsers /> Contact Us
            </div>
            <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-5xl">
              We Are Here <br />
              To <span className="text-blue-400">Help You</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-gray-200 sm:mt-6 sm:text-lg sm:leading-8">
              Have a question or need assistance? Reach out to us and our team
              will get back to you as soon as possible. We are always happy to
              help you with better healthcare support.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 sm:mt-10">
              <button className="rounded-2xl bg-gradient-to-r cursor-pointer from-blue-600 to-cyan-500 px-7 py-4 text-sm font-semibold text-white shadow-xl transition duration-300 hover:scale-105 sm:px-8 sm:text-base">
                Contact Now
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:mt-10">
        <div className="grid overflow-hidden rounded-3xl bg-white shadow-xl sm:grid-cols-2 lg:grid-cols-4">
          {contactInfo.map((item, index) => (
            <div key={index} className="flex items-center gap-4 border-b p-5 last:border-b-0 sm:gap-5 sm:p-6 lg:border-b-0 lg:border-r lg:p-8 lg:last:border-r-0">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl text-blue-600 sm:h-16 sm:w-16 sm:text-2xl">
                {item.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold sm:text-lg">
                  {item.title}
                </h3>
                <p className="mt-2 break-words text-sm leading-6 text-gray-600">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-10">
        <div className="rounded-3xl bg-white p-5 shadow-xl sm:p-8">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Send Us A Message
          </h2>
          <div className="mt-4 h-1 w-20 rounded-full bg-blue-600" />
          <p className="mt-5 text-sm leading-6 text-gray-600 sm:text-base">
            Fill out the form below and we will get back to you shortly.
          </p>
          <form className="mt-8 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <InputBox icon={<FaUser />} type="text" placeholder="Your Name" />
              <InputBox icon={<FaEnvelope />} type="email" placeholder="Your Email"/>
            </div>
            <InputBox icon={<FaPhone />} type="text" placeholder="Phone Number" />
            <InputBox icon={<FaPen />} type="text" placeholder="Subject" />
            <div className="flex items-start rounded-xl border border-gray-300 px-4 py-4 transition focus-within:border-blue-600">
              <FaPen className="mt-1 shrink-0 text-gray-400" />
              <textarea placeholder="Your Message" rows={5}
                className="w-full resize-none bg-transparent px-4 text-sm outline-none sm:text-base"/>
            </div>
            <button type="submit" className="flex h-14 cursor-pointer
             w-full items-center justify-center gap-3 rounded-xl bg-blue-600 font-semibold text-white shadow-lg transition hover:bg-blue-700">
              Send Message
              <FaPaperPlane />
            </button>
          </form>
        </div>
        <div className="space-y-8">
          <div className="h-64 overflow-hidden rounded-3xl bg-white shadow-xl sm:h-80 lg:h-72">
            <iframe title="map" src="https://www.google.com/maps?q=Coimbatore,Tamil%20Nadu,India&output=embed"
              className="h-full w-full border-0"
              loading="lazy"/>
          </div>
          <div className="grid gap-8 rounded-3xl bg-blue-50 p-5 shadow-xl sm:p-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-bold">Our Office</h2>
              <p className="mt-4 text-sm leading-6 text-gray-600 sm:text-base">
                Visit us at our office for any queries or assistance.
              </p>
              <div className="mt-6 space-y-3">
                {officePoints.map((point, index) => (
                  <p key={index} className="flex items-start gap-3 text-sm text-gray-700 sm:text-base">
                    <FaCircleCheck className="mt-1 shrink-0 text-blue-600" />
                    {point}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex justify-center text-blue-600">
              <FaHospital className="text-[100px] sm:text-[130px] lg:text-[140px]" />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-16">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-white p-5 text-center shadow-xl sm:p-6 md:flex-row md:text-left">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:text-left">
            <FaHeartPulse className="shrink-0 text-5xl text-blue-600" />
            <p className="text-sm leading-6 text-gray-600 sm:text-base">
              Your health and satisfaction are our top priorities.
              <br />
              We look forward to hearing from you!
            </p>
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <p className="font-semibold">Stay Connected</p>
            <div className="flex items-center gap-3">
              {socialLinks.map((item, index) => {
                const Icon = item.icon;
                return (
                  <a key={index} href={item.link} target="_blank" rel="noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white sm:h-12 sm:w-12">
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
const InputBox = ({ icon, type, placeholder }: PatientInputBoxProps) => {
  return (
    <div className="flex h-14 items-center rounded-xl border border-gray-300 px-4 transition focus-within:border-blue-600">
      <span className="shrink-0 text-gray-400">{icon}</span>
      <input type={type} placeholder={placeholder} className="h-full w-full bg-transparent px-4 text-sm outline-none sm:text-base"/>
    </div>
  );
};