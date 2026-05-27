import { useState, useEffect } from "react";
import {FaCalendarAlt,FaUser,FaEnvelope,FaPhoneAlt,FaRegFileAlt,FaLock,FaArrowLeft,} from "react-icons/fa";
import { MdOutlineAccessTime } from "react-icons/md";
import { IoCardOutline } from "react-icons/io5";
import API from "../../api/axios";
import { useNavigate, useParams } from "react-router-dom";

const dates = [
  { day: "Today", date: "24 May" },
  { day: "Tomorrow", date: "25 May" },
  { day: "Sun", date: "26 May" },
  { day: "Mon", date: "27 May" },
  { day: "Tue", date: "28 May" },
  { day: "Wed", date: "29 May" },
  { day: "Thu", date: "30 May" },
];

const slots = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
];

export const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState("09:00 AM");
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [doctorFee, setDoctorFee] = useState(0);
  const [doctorName, setDoctorName] = useState("");

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await API.get(`/doctors/${doctorId}`);
        const doctor =
          response.data?.data?.doctor ||
          response.data?.data ||
          response.data?.doctor ||
          response.data;

        setDoctorFee(Number(doctor.consultation_fee || 0));
        setDoctorName(doctor.user?.name || "");
      } catch (error) {
        console.log("Fetch doctor error:", error);
      }
    };

    if (doctorId) fetchDoctor();
  }, [doctorId]);

  const platformFee = 20;
  const gstRate = 18;
  const gstAmount = (platformFee * gstRate) / 100;
  const totalAmount = doctorFee + platformFee + gstAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pt-28">
      <div className="mx-auto max-w-6xl">
        <button onClick={() => navigate(-1)} className="mb-5 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold cursor-pointer text-blue-600 transition hover:bg-blue-50 sm:mb-6 sm:px-4">
          <FaArrowLeft />
          Back
        </button>

        <div className="mb-6 flex items-start gap-4 rounded-2xl bg-white p-4 shadow-md shadow-sky-100 sm:mb-8 sm:items-center sm:p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 sm:h-12 sm:w-12">
            <FaCalendarAlt className="text-lg text-blue-600 sm:text-xl" />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              Book Appointment
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Scheduling with{" "}
              <span className="font-bold text-blue-600">
                Dr. {doctorName || "Doctor"}
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <SectionCard icon={<FaCalendarAlt />} title="Select Date">
              <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible xl:grid-cols-7">
                {dates.map((item, index) => (
                  <button key={index} onClick={() => setSelectedDate(index)} className={`min-w-[95px] rounded-xl cursor-pointer border py-3 text-center transition-all duration-200 sm:min-w-0 ${
                      selectedDate === index? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-100"
                        : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50"}`}>
                    <p className={`text-xs font-semibold ${ selectedDate === index
                          ? "text-blue-100": "text-slate-400"}`}>
                      {item.day}
                    </p>
                    <p className={`mt-1 text-sm font-extrabold ${ selectedDate === index
                          ? "text-white": "text-slate-700"}`}>
                      {item.date}
                    </p>
                  </button>
                ))}
              </div>
            </SectionCard>
            <SectionCard icon={<MdOutlineAccessTime />} title="Select Time Slot">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                {slots.map((slot) => (
                  <button key={slot} onClick={() => setSelectedSlot(slot)}
                    className={`rounded-xl border py-2.5 cursor-pointer text-xs font-bold transition-all duration-200 ${
                      selectedSlot === slot? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-100"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300 hover:bg-blue-50"}`}>
                    {slot}
                  </button>
                ))}
              </div>
            </SectionCard>
            <SectionCard icon={<FaUser />} title="Patient Details">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputBox icon={<FaUser />} type="text" placeholder="Full Name" />
                <InputBox icon={<FaEnvelope />} type="email" placeholder="Email" />
                <InputBox icon={<FaPhoneAlt />} type="text" placeholder="Phone" />
                <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition hover:border-blue-400 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                  <MdOutlineAccessTime className="text-base text-slate-400" />
                  <select className="h-full w-full bg-transparent text-sm text-slate-600 outline-none">
                    <option>Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Others</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-400 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <FaRegFileAlt className="mt-0.5 shrink-0 text-sm text-slate-400" />
                <textarea rows={3} placeholder="Reason for consultation (Optional)" className="w-full resize-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"/>
              </div>
            </SectionCard>
          </div>

          <div className="flex flex-col gap-6 lg:sticky lg:top-28 lg:h-fit">
            <div className="rounded-2xl bg-white p-5 shadow-md shadow-sky-100 sm:p-6">
              <h2 className="mb-4 text-base font-extrabold text-slate-900">
                Booking Summary
              </h2>

              <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
                <SummaryRow label="Date" value={`${dates[selectedDate].day}, ${dates[selectedDate].date}`}/>
                <SummaryRow label="Time" value={selectedSlot} />
                <SummaryRow label="Doctor" value={`Dr. ${doctorName || "Doctor"}`}/>
              </div>
              <div className="mt-4 space-y-3">
                <PaymentRow label="Consultation Fee" amount={doctorFee} />
                <PaymentRow label="Platform Fee" amount={platformFee} />
                <PaymentRow label={`GST (${gstRate}%)`} amount={gstAmount} />
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-900">
                      Total
                    </span>
                    <span className="text-xl font-extrabold text-blue-600">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-md shadow-sky-100 sm:p-6">
              <h2 className="mb-4 text-base font-extrabold text-slate-900">
                Payment Method
              </h2>
              <div className="space-y-3">
                <PaymentMethod active={paymentMethod === "online"} onClick={() => setPaymentMethod("online")}
                  icon={<IoCardOutline className="text-xl text-slate-600" />}
                  title="Online Payment"
                  text="Card / UPI / Net Banking"/>
                <PaymentMethod active={paymentMethod === "clinic"} onClick={() => setPaymentMethod("clinic")}
                  icon={<FaLock className="text-base text-slate-600" />}
                  title="Pay at Clinic"
                  text="Pay during your visit"/>
              </div>
            </div>
            <button className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:scale-[1.02] hover:bg-blue-700">
              <FaLock className="text-xs" />
              Confirm & Pay ₹{totalAmount.toFixed(2)}
            </button>

            <div className="flex items-center justify-center gap-2">
              <FaLock className="text-xs text-slate-400" />
              <p className="text-xs text-slate-400">
                Secured & encrypted payment
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type SectionCardProps = {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
};

const SectionCard = ({ icon, title, children }: SectionCardProps) => {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-md shadow-sky-100 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold text-slate-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-sm text-blue-600">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </div>
  );
};

type InputBoxProps = {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
};

const InputBox = ({ icon, type, placeholder }: InputBoxProps) => (
  <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition hover:border-blue-400 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
    <span className="text-sm text-slate-400">{icon}</span>
    <input type={type} placeholder={placeholder} className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"/>
  </div>
);

type SummaryRowProps = {
  label: string;
  value: string;
};
const SummaryRow = ({ label, value }: SummaryRowProps) => {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-700">{value}</span>
    </div>
  );
};

type PaymentRowProps = {
  label: string;
  amount: number;
};

const PaymentRow = ({ label, amount }: PaymentRowProps) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="font-semibold text-slate-700">₹{amount.toFixed(2)}</span>
  </div>
);

type PaymentMethodProps = {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  text: string;
};

const PaymentMethod = ({active,onClick,icon,title,text,}: PaymentMethodProps) => (
  <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
      active ? "border-blue-500 bg-blue-50 shadow-sm shadow-blue-100": "border-slate-200 bg-slate-50 hover:border-blue-300"}`}>
    <div className={`h-4 w-4 shrink-0 rounded-full border-2 transition-all ${
        active ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}/>
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
        active ? "bg-blue-100" : "border border-slate-200 bg-white"}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className={`text-sm font-bold ${ active ? "text-blue-700" : "text-slate-700"}`}>
        {title}
      </p>
      <p className="text-xs text-slate-400">{text}</p>
    </div>
  </button>
);