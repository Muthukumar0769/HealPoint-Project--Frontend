import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import slideImg4 from "../../assets/images/slideimg1.png";
import slideImg1 from "../../assets/images/slideImg2.png";
import slideImg2 from "../../assets/images/slideimg3.png";
import slideImg3 from "../../assets/images/slideimg4.jpg";

const sliderImages = [slideImg4, slideImg1, slideImg2, slideImg3];
export const Header = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) =>
        prev === sliderImages.length - 1 ? 0 : prev + 1
      );
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="mx-3 mt-20 overflow-hidden rounded-3xl shadow-xl sm:mx-5 lg:mt-24">
      <div className="relative min-h-[520px] overflow-hidden sm:min-h-[620px] lg:min-h-[680px]">
        {sliderImages.map((image, index) => (
          <img key={index} src={image} alt="Hospital slider"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              currentSlide === index ? "opacity-90" : "opacity-0"}`}/>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-slate-900/30" />
        <div className="relative z-10 flex min-h-[520px] items-center px-5 py-12 sm:min-h-[620px] sm:px-8 md:px-14 lg:min-h-[680px] lg:px-20">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex rounded-full bg-blue-900 px-4 py-2 text-xs font-semibold text-white sm:text-sm">
              Trusted Healthcare Platform
            </div>
            <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-5xl">
              Quality{" "}
              <span className="bg-gradient-to-r from-blue-500 to-white bg-clip-text text-transparent">
                Health
              </span>
              <br />
              Care For You
              <br />
              And Your Family
            </h1>
            <p className="mt-5 max-w-[560px] text-sm leading-7 text-white/90 sm:text-lg sm:leading-8">
              Book appointments with trusted doctors and get world-class
              healthcare consultation for you and your loved ones anytime.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link to="/doctors" className="flex items-center gap-3 rounded-full bg-red-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition duration-300 hover:scale-105 sm:px-8 sm:py-4 sm:text-lg">
                Book Appointment
                <FaArrowRight />
              </Link>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
              <Stat value={10} suffix="k+" label="Happy Patients" color="text-blue-300" />
              <Stat value={500} suffix="+" label="Expert Doctors" color="text-cyan-300" />
              <Stat value={4} suffix=".8" label="Average Rating" color="text-emerald-300" />
              <Stat value={50} suffix="+" label="Specialist" color="text-indigo-300" />
            </div>
          </div>
        </div>
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-3">
          {sliderImages.map((_, index) => (
            <button key={index} onClick={() => setCurrentSlide(index)} className={`h-3 rounded-full transition-all ${
                currentSlide === index ? "w-10 bg-blue-600" : "w-3 bg-white/90"}`}/>
          ))}
        </div>
      </div>
    </section>
  );
};

type StatProps = {
  value: number;
  suffix?: string;
  label: string;
  color: string;
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
    <div className="rounded-2xl bg-white/10 p-3 text-center shadow-lg backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/15 sm:p-4">
      <h3 className={`text-2xl font-extrabold sm:text-3xl ${color}`}>
        {count}
        {suffix}
      </h3>
      <p className="mt-1 text-xs font-semibold text-white sm:text-sm">{label}</p>
    </div>
  );
};