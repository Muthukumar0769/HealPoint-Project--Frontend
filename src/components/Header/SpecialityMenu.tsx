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
    <section className="px-4 py-8 text-gray-800 sm:py-10">
      <div className="mx-auto max-w-7xl text-center">
        <h1 className="text-xl font-semibold sm:text-2xl">Our Specialization</h1>
        <p className="mx-auto mt-2 max-w-2xl text-xs text-gray-500 sm:text-sm">
          Choose your required medical specialist and book an appointment easily.
        </p>

        <div className="mt-6 grid grid-cols-5 gap-3 sm:grid-cols-5 md:grid-cols-10 lg:grid-cols-10">
          {SpecialityData.map((item) => (
            <Link to={`/doctors/speciality/${encodeURIComponent(item.speciality)}`} className="flex flex-col items-center text-center"
              key={item.speciality}>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-400 p-2.5 shadow-md transition-all duration-300 hover:scale-105 xs:h-13 xs:w-13 sm:h-14 sm:w-14 sm:p-3 md:h-16 md:w-16 md:p-4">
                <img src={item.image} alt={item.speciality} className="h-full w-full object-contain" />
              </div>
              <p className="mt-1.5 text-[9px] font-semibold text-gray-600 xs:text-[10px] sm:text-[10px] md:text-xs">
                {item.speciality}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};