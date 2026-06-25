import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import slideImg4 from "../../assets/images/slideimg1.png";
import slideImg1 from "../../assets/images/slideImg2.png";
import slideImg2 from "../../assets/images/slideImg3.png";
import slideImg3 from "../../assets/images/slideImg4.jpg";
import type { StatProps } from "../../types/common.ts";

const sliderImages = [slideImg4, slideImg1, slideImg2, slideImg3];

export const Header = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === sliderImages.length - 1 ? 0 : prev + 1));
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="w-full mt-14 overflow-hidden shadow-xl">
      <div className="relative h-[420px] xs:h-[460px] sm:h-[520px] md:h-[560px] lg:h-[580px] xl:h-[600px]">
        {sliderImages.map((image, index) => (
          <img key={index} src={image} alt="Hospital slider"
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ${
              currentSlide === index ? "opacity-100" : "opacity-0"}`}/>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/65 to-slate-900/20" />
        <div className="relative z-10 flex h-full items-center px-4 py-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
          <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
            <div className="mb-3 inline-flex rounded-full bg-blue-900/90 px-3 py-1.5 text-[11px] font-semibold text-white sm:px-4 sm:py-2 sm:text-xs md:text-sm">
              Trusted Healthcare Platform
            </div>
            <h1 className="text-2xl font-extrabold leading-tight text-white xs:text-3xl sm:text-4xl md:text-5xl lg:text-[46px] xl:text-[50px]">
              Quality{" "}
              <span className="bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
                Health
              </span>
              <br />
              Care For You
              <br className="hidden xs:block" />
              <span className="xs:hidden"> </span>
              And Your Family
            </h1>

            <p className="mt-2 max-w-sm text-xs leading-6 text-white/85 xs:text-sm xs:leading-7 sm:max-w-md sm:text-sm md:text-base md:leading-7">
              Create an account and book appointments with trusted doctors and get world-class healthcare consultation for you and your loved ones anytime.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-6">
              <Link to="/doctors" className="flex items-center gap-2 rounded-full bg-red-700 px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition duration-300 hover:scale-105 xs:gap-3 xs:px-6 xs:py-3 xs:text-sm sm:px-7 sm:py-3.5 sm:text-base">
                Book Appointment
                <FaArrowRight />
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2 sm:mt-7 sm:gap-3 md:gap-4">
              <Stat value={10} suffix="k+" label="Happy Patients" color="text-blue-300" />
              <Stat value={500} suffix="+" label="Expert Doctors" color="text-cyan-300" />
              <Stat value={4} suffix=".8" label="Avg Rating" color="text-emerald-300" />
              <Stat value={50} suffix="+" label="Specialists" color="text-indigo-300" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-5 sm:gap-3">
          {sliderImages.map((_, index) => (
            <button key={index} onClick={() => setCurrentSlide(index)} className={`h-2 rounded-full transition-all sm:h-2.5 ${
                currentSlide === index ? "w-7 bg-blue-500 sm:w-9" : "w-2 bg-white/80 sm:w-2.5" }`}/>
          ))}
        </div>
      </div>
    </section>
  );
};

const Stat = ({ value, suffix = "", label, color }: StatProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = value / (duration / 20);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        start = value;
        clearInterval(timer);
      }
      setCount(Math.floor(start));
    }, 20);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="rounded-xl bg-white/10 p-2 text-center shadow-lg backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/15 xs:rounded-2xl xs:p-2.5 sm:p-3">
      <h3 className={`text-base font-extrabold xs:text-lg sm:text-xl md:text-2xl ${color}`}>
        {count}{suffix}
      </h3>
      <p className="mt-0.5 text-[9px] font-semibold text-white xs:text-[10px] sm:text-[11px] md:text-xs">
        {label}
      </p>
    </div>
  );
};