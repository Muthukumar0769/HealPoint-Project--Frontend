import LogoIcon from "../../assets/images/New_logo-removebg-preview.png";
import {FaFacebookF,FaInstagram,FaLinkedinIn,FaTwitter,} from "react-icons/fa";

export const Footer = () => {
  return (
    <footer className="mx-3 mt-16 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-cyan-950 to-blue-950 shadow-2xl sm:mx-5 lg:mt-24">
      <div className="grid grid-cols-1 gap-10 px-6 py-12 text-sm text-white sm:px-8 md:grid-cols-2 lg:grid-cols-[3fr_1fr_1fr_1fr] lg:px-20 lg:py-16">
        <div>
          <img className="mb-5 w-44 rounded-lg bg-white p-2 sm:w-52" src={LogoIcon} alt="HealPoint"/>
          <p className="max-w-[450px] text-base leading-8 text-gray-300 sm:text-lg sm:leading-9">
            Easily find doctors and schedule appointments based on availability.
            HealPoint simplifies healthcare with a modern, user-friendly booking
            experience for patients and doctors.
          </p>
          <div className="mt-7 flex items-center gap-4">
            <SocialIcon icon={<FaFacebookF />} hover="hover:bg-cyan-500" />
            <SocialIcon icon={<FaInstagram />} hover="hover:bg-pink-500" />
            <SocialIcon icon={<FaTwitter />} hover="hover:bg-sky-500" />
            <SocialIcon icon={<FaLinkedinIn />} hover="hover:bg-blue-600" />
          </div>
        </div>
        <FooterColumn title="Company" items={["Home", "About Us", "Contact Us", "Privacy Policy"]}/>
        <FooterColumn title="For Patients" items={["Find Doctors", "Appointment", "Login", "Register"]}/>
        <div>
          <h2 className="mb-5 text-xl font-bold text-white sm:text-2xl">
            Get In Touch
          </h2>
          <ul className="space-y-3 text-base text-gray-300 sm:text-lg">
            <li>+91 9876543210</li>
            <li>mk@gmail.com</li>
            <li>Tamil Nadu, India</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="px-4 py-5 text-center text-sm text-gray-400 sm:text-base">
          © 2026 HealPoint. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

type FooterColumnProps = {
  title: string;
  items: string[];
};

const FooterColumn = ({ title, items }: FooterColumnProps) => {
  return (
    <div>
      <h2 className="mb-5 text-xl font-bold text-white sm:text-2xl">{title}</h2>
      <ul className="space-y-3 text-base text-gray-300 sm:text-lg">
        {items.map((item) => (
          <li key={item} className="cursor-pointer transition hover:text-cyan-400">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

type SocialIconProps = {
  icon: React.ReactNode;
  hover: string;
};

const SocialIcon = ({ icon, hover }: SocialIconProps) => {
  return (
    <div className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition sm:h-11 sm:w-11 ${hover}`}>
      {icon}
    </div>
  );
};