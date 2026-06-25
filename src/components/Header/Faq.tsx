import { useState } from "react";

const faqs = [
  {
    question: "How to Book an Appointment?",
    answer:
      "Go to the Doctors page, find your preferred doctor, click View Details, then click the Book Appointment button to schedule your visit.",
  },
  {
    question: "What Information is Required to Book a Medical Appointment?",
    answer:
      "You will need to provide your full name, contact number, age, reason for visit, and preferred date and time for the appointment.",
  },
  {
    question: "What Documents Should I Bring for My Hospital Visit or Admission?",
    answer:
      "Please bring a valid ID proof, previous medical records, prescription slips, insurance documents (if applicable), and any prior test reports.",
  },
  {
    question: "What Support Services Does HealPoint Provide for Patients and Families?",
    answer:
      "We offer counseling services, patient assistance desks, ambulance facilities, pharmacy, cafeteria, and 24/7 emergency support for patients and their families.",
  },
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-[#EEF0F8] px-5 py-9 md:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3 flex flex-col justify-start gap-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">FAQ</p>
          <h2 className="text-xl font-bold text-[#0d1b5e] leading-snug sm:text-2xl">
            We are here to <span className="font-extrabold">Answer your Questions</span>
          </h2>

          <div className="flex items-center gap-3 mt-3">
            <div className="w-12 h-12 flex-shrink-0">
              <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="80" height="80" rx="12" fill="#dce3f5" />
                <circle cx="40" cy="28" r="12" fill="#3b5bdb" />
                <rect x="20" y="50" width="40" height="16" rx="4" fill="#3b5bdb" />
                <circle cx="56" cy="22" r="8" fill="#74c0fc" />
                <text x="53" y="26" fontSize="10" fill="white" fontWeight="bold">i</text>
              </svg>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-0.5">Still do you have any questions?</p>
              <a href="tel:+919876543210" className="text-[#3b5bdb] font-semibold flex items-center gap-1 hover:underline">
                📞 +91 9876543210
              </a>
            </div>
          </div>
        </div>
        <div  className="md:w-2/3 flex flex-col gap-3">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <button onClick={() => toggle(index)} className="w-full flex justify-between items-center px-5 py-3 text-left">
                <span className="font-semibold text-[#0d1b5e] text-xs md:text-sm">
                  {faq.question}
                </span>
                <span className="text-gray-500 text-lg ml-4">
                  {openIndex === index ? "▲" : "▼"}
                </span>
              </button>

              {openIndex === index && (
                <div className="px-5 pb-4 text-gray-600 text-xs leading-relaxed border-t border-gray-100 pt-2.5">
                  <span className="font-semibold text-gray-700">Ans: </span>
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};