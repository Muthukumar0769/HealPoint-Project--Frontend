import { Link } from "react-router-dom";
import heartBeat from "../../assets/images/heartbeat.png";
import DermaImg from "../../assets/images/dermatologically-tested.png";
import PediaImg from "../../assets/images/pediatrics.png";
import OrthoImg from "../../assets/images/orthopedics.png";
import GyneoImg from "../../assets/images/gynecology.png";
import NeuroImg from "../../assets/images/neuron.png";
import GeneralImg from "../../assets/images/health.png";
import EntImg from "../../assets/images/sore-throat.png";
import OpthalImg from "../../assets/images/ophthalmology.png";
import DenImg from "../../assets/images/clean-tooth.png";

const SpecialityData = [
  { speciality: "Cardiologist", image: heartBeat },
  { speciality: "Dermatologist", image: DermaImg },
  { speciality: "Pediatrician", image: PediaImg },
  { speciality: "Orthopedic", image: OrthoImg },
  { speciality: "Gynecologist", image: GyneoImg },
  { speciality: "Neurologist", image: NeuroImg },
  { speciality: "General Physician", image: GeneralImg },
  { speciality: "ENT", image: EntImg },
  { speciality: "Ophthalmologist", image: OpthalImg },
  { speciality: "Dentist", image: DenImg }
];

export const SpecialityMenu = () => {
  return (
    <section className="px-4 py-12 text-gray-800 sm:py-16">
      <div className="mx-auto max-w-7xl text-center">
        <h1 className="text-2xl font-semibold sm:text-3xl">Our Specialization</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-500 sm:text-base">
          Choose your required medical specialist and book an appointment easily.
        </p>

        <div className="mt-8 flex gap-3 overflow-x-auto pb-4 scrollbar-hide lg:grid lg:grid-cols-10 lg:overflow-visible">
          {SpecialityData.map((item) => (
            <Link to={`/doctors/speciality/${encodeURIComponent(item.speciality)}`} className="flex min-w-[95px] flex-col items-center text-center text-sm"
              key={item.speciality}>
              <div className="flex lg:h-20 lg:w-20 items-center justify-center rounded-full bg-blue-400 p-4 shadow-md transition-all duration-300 hover:scale-105 sm:h-24 sm:w-24 sm:p-5">
                <img src={item.image} alt={item.speciality} className="h-full w-full object-contain" />
              </div>
              <p className="mt-2 text-xs font-semibold text-gray-600 sm:text-sm">
                {item.speciality}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};