import { useEffect, useRef, useState } from "react";
import {
  FaCalendarAlt, FaRegFileAlt, FaLock, FaArrowLeft, FaCheckCircle, FaCreditCard, FaHospital,
  FaRupeeSign, FaUserCircle, FaVideo, FaCopy, FaDownload
} from "react-icons/fa";
import { SiRazorpay } from "react-icons/si";
import { MdOutlineAccessTime, MdReceipt } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchDoctorById } from "../../store/slices/DoctorListingSlice";
import {
  fetchSlotsForDate, setSelectedDateIndex, setSelectedSlot, setConsultationType, setPaymentMethod,
  setConsultationReason, resetBooking, submitBooking, createRazorpayOrder, verifyRazorpayPayment,
} from "../../store/slices/BookAppointmentSlice";
import type { SummaryRowProps, PaymentRowProps } from "../../types/common.ts";
import { isBookableSlot } from "../../utils/slotHelpers";
import { setAppointmentNotification, setEarningNotification, setVideoNotification, setClinicNotification } from "../../store/slices/NotificationSlice.ts";
import usePageTitle from "../../hooks/usePageTitle";

declare global {
  interface Window { Razorpay: any; }
}

const TransactionPanel = ({ paymentId, orderId, amountPaid, doctorName, date, time,
  consultationType, patientName, reason, onBack, onDownload }: {
    paymentId: string; orderId: string; amountPaid: number; doctorName: string;
    date: string; time: string; consultationType: string; patientName: string;
    reason: string; onBack: () => void; onDownload: () => void;
  }) => (
  <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl sm:rounded-3xl">
    <div className="flex items-center gap-3 bg-blue-600 px-4 py-3 sm:px-5 sm:py-4">
      <button onClick={onBack} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition sm:h-8 sm:w-8 sm:rounded-xl">
        <FaArrowLeft className="text-xs" />
      </button>
      <div className="flex items-center gap-2">
        <MdReceipt className="text-base text-white sm:text-lg" />
        <h2 className="text-xs font-extrabold text-white sm:text-sm">Transaction Details</h2>
      </div>
    </div>
    <div className="max-h-[65vh] overflow-y-auto p-4 space-y-3 sm:max-h-[70vh] sm:p-5 sm:space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
        <FaCheckCircle className="shrink-0 text-lg text-emerald-500 sm:text-xl" />
        <div>
          <p className="text-xs font-extrabold text-emerald-700 sm:text-sm">Payment Successful</p>
          <p className="text-[10px] text-emerald-500 sm:text-xs">Your appointment is confirmed</p>
        </div>
        <span className="ml-auto text-base font-extrabold text-emerald-600 sm:text-lg">₹{amountPaid.toFixed(2)}</span>
      </div>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50 sm:rounded-2xl">
        <div className="px-3 py-2 sm:px-4">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">Payment Info</p>
        </div>
        <TxRow label="Payment ID" value={paymentId} canCopy />
        <TxRow label="Order ID" value={orderId} canCopy />
        <TxRow label="Method" value="Razorpay" />
        <TxRow label="Status" value="Successful" green />
        <TxRow label="Amount" value={`₹${amountPaid.toFixed(2)}`} green />
        <TxRow label="Date" value={new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
      </div>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50 sm:rounded-2xl">
        <div className="px-3 py-2 sm:px-4">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">Appointment Info</p>
        </div>
        <TxRow label="Patient" value={patientName} />
        <TxRow label="Doctor" value={`Dr. ${doctorName}`} />
        <TxRow label="Date & Time" value={`${date} · ${time}`} />
        <TxRow label="Type" value={consultationType} />
        {reason && <TxRow label="Reason" value={reason} />}
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-[#072654] px-3 py-2.5 sm:px-4 sm:py-3">
        <SiRazorpay className="text-lg text-white sm:text-xl" />
        <div>
          <p className="text-xs font-bold text-white">Secured by Razorpay</p>
          <p className="text-[10px] text-blue-300">Encrypted · Safe · Instant</p>
        </div>
        <FaLock className="ml-auto text-xs text-blue-300" />
      </div>
      <button onClick={onDownload} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-blue-600 sm:rounded-2xl sm:py-3 sm:text-sm">
        <FaDownload className="text-xs" /> Download PDF Receipt
      </button>
    </div>
  </div>
);

const TxRow = ({ label, value, canCopy, green }: { label: string; value: string; canCopy?: boolean; green?: boolean }) => (
  <div className="flex items-center justify-between gap-3 px-3 py-2 sm:px-4 sm:py-2.5">
    <span className="text-[10px] text-slate-400 sm:text-xs shrink-0">{label}</span>
    <div className="flex min-w-0 items-center gap-1.5">
      <span className={`max-w-[130px] truncate text-[10px] font-semibold sm:max-w-[160px] sm:text-xs ${green ? "text-emerald-600" : "text-slate-700"}`}>{value}</span>
      {canCopy && value !== "—" && (
        <button onClick={() => { navigator.clipboard.writeText(value); toast.success("Copied!"); }} className="shrink-0 text-slate-300 hover:text-blue-500 transition">
          <FaCopy className="text-[10px]" />
        </button>
      )}
    </div>
  </div>
);

interface SuccessModalProps {
  doctorName: string; date: string; time: string; consultationType: string;
  totalAmount: number; paymentId?: string; orderId?: string; appointmentId: number;
  paymentMethod: "online" | "clinic"; patientName: string; reason: string;
  onGoToAppointments: () => void;
}

const SuccessModal = ({ doctorName, date, time, consultationType, totalAmount,
  paymentId, orderId, paymentMethod, patientName, reason, onGoToAppointments }: SuccessModalProps) => {
  const [showTx, setShowTx] = useState(false);

  const handleDownload = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const receiptNo = paymentId || `HP-${Date.now()}`;
    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.text("HealPoint", 15, 18);
    doc.setFontSize(11); doc.setFont("helvetica", "normal"); doc.text("Payment Receipt", 15, 27);
    doc.setTextColor(15, 23, 42); doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.text("Transaction Receipt", 15, 50);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Receipt No: ${receiptNo}`, 15, 58); doc.text(`Generated On: ${new Date().toLocaleString("en-IN")}`, 15, 64);
    let y = 78;
    const sectionTitle = (title: string) => {
      doc.setFillColor(239, 246, 255); doc.rect(15, y, 180, 10, "F");
      doc.setTextColor(37, 99, 235); doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(title, 20, y + 7); y += 18;
    };
    const row = (label: string, value: string) => {
      doc.setTextColor(100, 116, 139); doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text(label, 20, y);
      doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold"); doc.text(value || "—", 85, y); y += 8;
    };
    sectionTitle("Payment Details");
    row("Payment Status", "Successful"); row("Payment ID", paymentId || "—");
    row("Order ID", orderId || "—"); row("Payment Method", "Razorpay");
    row("Amount Paid", `Rs. ${totalAmount.toFixed(2)}`); row("Transaction Date", new Date().toLocaleString("en-IN"));
    y += 6; sectionTitle("Appointment Details");
    row("Patient Name", patientName); row("Doctor Name", `Dr. ${doctorName}`);
    row("Date & Time", `${date} · ${time}`); row("Consultation Type", consultationType);
    row("Reason", reason || "Not specified");
    y += 6; sectionTitle("Fee Summary");
    row("Appointment Fee", `Rs. ${totalAmount.toFixed(2)}`); row("Platform Fee", "Rs. 0.00"); row("Tax", "Rs. 0.00");
    doc.setDrawColor(226, 232, 240); doc.line(20, y, 190, y); y += 10;
    doc.setTextColor(15, 23, 42); doc.setFontSize(13); doc.setFont("helvetica", "bold");
    doc.text("Total Amount", 20, y); doc.text(`Rs. ${totalAmount.toFixed(2)}`, 150, y);
    y += 20; doc.setFillColor(240, 253, 244); doc.rect(15, y, 180, 16, "F");
    doc.setTextColor(22, 163, 74); doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("Payment completed successfully. Thank you for using HealPoint.", 20, y + 10);
    doc.save(`HealPoint_Receipt_${receiptNo}.pdf`);
    toast.success("Receipt downloaded!");
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.75rem" }}
      onClick={(e) => { if (e.target === e.currentTarget) onGoToAppointments(); }}>
      <div style={{ width: "100%", maxWidth: "28rem", overflow: "hidden", borderRadius: "1.25rem" }}>
        <div style={{ display: "flex", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)", transform: showTx ? "translateX(-50%)" : "translateX(0%)", width: "200%" }}>
          <div style={{ width: "50%" }}>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-2xl sm:rounded-3xl sm:p-7">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 sm:mb-4 sm:h-20 sm:w-20">
                <FaCheckCircle className="text-3xl text-emerald-500 sm:text-4xl" />
              </div>
              <span className="mb-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:mb-3">
                {paymentMethod === "online" ? "Payment confirmed" : "Booking confirmed"}
              </span>
              <h2 className="mb-1 text-lg font-extrabold text-slate-900 sm:text-xl">Appointment booked!</h2>
              <p className="mb-4 text-xs text-slate-500 sm:mb-5 sm:text-sm">
                {paymentMethod === "online" ? "Your payment was successful and appointment is confirmed." : "Your appointment is confirmed. Please pay at the clinic."}
              </p>
              <div className="mb-1 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50 text-left sm:rounded-2xl">
                <DetailRow label="Doctor" value={`Dr. ${doctorName}`} />
                <DetailRow label="Date & time" value={`${date} · ${time}`} />
                <DetailRow label="Type" value={consultationType} />
                {paymentId && <DetailRow label="Payment ID" value={paymentId} small />}
              </div>
              <div className="my-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5 sm:my-4 sm:px-4 sm:py-3">
                <span className="text-xs font-semibold text-slate-600 sm:text-sm">
                  {paymentMethod === "online" ? "Total paid" : "Payable at clinic"}
                </span>
                <span className="text-base font-extrabold text-emerald-600 sm:text-lg">₹{totalAmount.toFixed(2)}</span>
              </div>
              {paymentMethod === "online" && (
                <button onClick={() => setShowTx(true)} className="mb-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-xs font-bold text-white shadow-lg transition hover:bg-blue-600 sm:mb-3 sm:rounded-2xl sm:py-3.5 sm:text-sm">
                  <MdReceipt className="text-sm" /> View transaction details
                </button>
              )}
              <button onClick={onGoToAppointments} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 sm:rounded-2xl sm:py-3.5 sm:text-sm">
                Back to appointments
              </button>
            </div>
          </div>
          <div style={{ width: "50%" }}>
            <TransactionPanel paymentId={paymentId || "—"} orderId={orderId || "—"} amountPaid={totalAmount}
              doctorName={doctorName} date={date} time={time} consultationType={consultationType}
              patientName={patientName} reason={reason} onBack={() => setShowTx(false)} onDownload={handleDownload} />
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, small }: { label: string; value: string; small?: boolean }) => (
  <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5">
    <span className="text-[10px] text-slate-400 sm:text-xs">{label}</span>
    <span className={`text-right font-semibold text-slate-700 ${small ? "max-w-[130px] truncate text-[10px] sm:max-w-[160px] sm:text-[11px]" : "text-[10px] sm:text-xs"}`}>{value}</span>
  </div>
);

export const BookAppointment = () => {
  usePageTitle("Book Appointment");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { doctorId } = useParams();
  const razorpayScriptLoaded = useRef(false);
  const [successModal, setSuccessModal] = useState<{
    open: boolean; appointmentId: number; paymentId?: string;
    razorpayOrderId?: string; amountPaid: number;
  } | null>(null);

  const authUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  })();

  const { selectedDoctor: doctor } = useAppSelector((state) => state.doctorListing);
  const { dateItems, slots, slotsLoading, slotsError, selectedDateIndex, selectedSlot,
    paymentMethod, consultationType, consultationReason, bookingLoading, orderLoading,
  } = useAppSelector((state) => state.bookAppointment);

  useEffect(() => {
    if (!razorpayScriptLoaded.current) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => { razorpayScriptLoaded.current = true; };
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!authUser) { toast.error("Please login to book an appointment"); navigate("/login"); }
  }, []);

  useEffect(() => {
    if (!doctor && doctorId) dispatch(fetchDoctorById(doctorId));
  }, [doctorId, doctor, dispatch]);

  useEffect(() => {
    if (doctorId && dateItems.length > 0) {
      dispatch(fetchSlotsForDate({ doctorId, date: dateItems[selectedDateIndex].date }));
    }
    return () => { dispatch(resetBooking()); };
  }, [doctorId, dispatch]);

  const handleDateSelect = (index: number) => {
    dispatch(setSelectedDateIndex(index));
    if (doctorId) dispatch(fetchSlotsForDate({ doctorId, date: dateItems[index].date }));
  };

  const fireAppointmentBooked = () => { window.dispatchEvent(new Event("appointmentBooked")); };

  const openRazorpay = (orderId: string, amount: number, apptId: number) => {
    if (!window.Razorpay) { toast.error("Payment gateway not loaded. Please refresh."); return; }
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID, amount, currency: "INR", name: "HealPoint",
      description: `Appointment with Dr. ${doctor?.user?.name || "Doctor"}`,
      order_id: orderId,
      prefill: { name: authUser?.name || "Test User", email: authUser?.email || "test@example.com", contact: "9999999999" },
      method: { card: true, netbanking: true, upi: true, wallet: true },
      theme: { color: "#0EA5E9" },
      handler: async (response: any) => {
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.width = "";
        try {
          const verifyResult = await dispatch(verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }));
          if (verifyRazorpayPayment.fulfilled.match(verifyResult)) {
            dispatch(setAppointmentNotification()); dispatch(setEarningNotification());
            dispatch(consultationType === "Video Call" ? setVideoNotification() : setClinicNotification());
            fireAppointmentBooked();
            setSuccessModal({ open: true, appointmentId: apptId, paymentId: response.razorpay_payment_id, razorpayOrderId: response.razorpay_order_id, amountPaid: amount / 100 });
          } else { toast.error("Payment verification failed"); }
        } catch { toast.error("Payment verification error"); }
      },
      modal: {
        ondismiss: () => {
          document.body.style.overflow = "";
          document.body.style.position = "";
          document.body.style.width = "";
          toast.error("Payment cancelled");
          toast.error("Payment cancelled");
        }
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response: any) => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      toast.error(response.error.description || "Payment failed");
    });
    rzp.open();
  };

  const handleConfirm = async () => {
    if (!authUser) { toast.error("Please login to book an appointment"); navigate("/login"); return; }
    if (!selectedSlot) { toast.error("Please select a time slot"); return; }
    const bookResult = await dispatch(submitBooking({
      doctorId: doctorId!, date: dateItems[selectedDateIndex].date,
      start_time: selectedSlot.start_time, end_time: selectedSlot.end_time,
      consultation_type: consultationType, reason: consultationReason,
    }));
    if (!submitBooking.fulfilled.match(bookResult)) { toast.error((bookResult.payload as string) || "Booking failed"); return; }
    const newAppointmentId = bookResult.payload as number;
    if (paymentMethod === "clinic") {
      dispatch(setAppointmentNotification());
      dispatch(consultationType === "Video Call" ? setVideoNotification() : setClinicNotification());
      fireAppointmentBooked();
      setSuccessModal({ open: true, appointmentId: newAppointmentId, amountPaid: totalAmount });
      return;
    }
    const orderResult = await dispatch(createRazorpayOrder(newAppointmentId));
    if (!createRazorpayOrder.fulfilled.match(orderResult)) { toast.error((orderResult.payload as string) || "Failed to create order"); return; }
    const payload = orderResult.payload as { orderId: string; amount: number };
    openRazorpay(payload.orderId, payload.amount, newAppointmentId);
  };

  const formatTime = (time: string) =>
    new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  const doctorFee = Number(doctor?.consultation_fee || 0);
  const doctorName = doctor?.user?.name || "";
  const selectedDateItem = dateItems[selectedDateIndex];
  const isLoading = bookingLoading || orderLoading;
  const platformFee = paymentMethod === "clinic" ? 20 : 0;
  const gstRate = paymentMethod === "clinic" ? 18 : 0;
  const gstAmount = parseFloat(((platformFee * gstRate) / 100).toFixed(2));
  const totalAmount = parseFloat((doctorFee + platformFee + gstAmount).toFixed(2));

  return (
    <>
      {successModal?.open && (
        <SuccessModal doctorName={doctorName}
          date={selectedDateItem ? `${selectedDateItem.day}, ${new Date(selectedDateItem.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}` : "—"}
          time={selectedSlot ? formatTime(selectedSlot.start_time) : "—"}
          consultationType={consultationType} totalAmount={successModal.amountPaid}
          paymentId={successModal.paymentId} orderId={successModal.razorpayOrderId}
          appointmentId={successModal.appointmentId} paymentMethod={paymentMethod as "online" | "clinic"}
          patientName={authUser?.name || "—"} reason={consultationReason}
          onGoToAppointments={() => navigate("/my-appointments")} />
      )}

      <div className="min-h-screen bg-[#f0f4fb] px-3 pb-16 pt-20 sm:px-5 sm:pt-24 lg:px-8 lg:pb-20 lg:pt-28">
        <div className="mx-auto max-w-6xl">
          <button onClick={() => navigate(-1)} className="mb-4 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-blue-600 sm:mb-6 sm:text-sm">
            <FaArrowLeft className="text-xs" /> Back
          </button>

          <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-blue-600 sm:text-xs">Appointment Booking</p>
              <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl lg:text-3xl">
                {doctorName ? `Dr. ${doctorName}` : "Select a Doctor"}
              </h1>
            </div>
            {authUser && (
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 sm:h-9 sm:w-9 sm:rounded-xl">
                  <FaUserCircle className="text-base text-blue-500 sm:text-lg" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 sm:text-sm">{authUser.name}</p>
                  <p className="text-[10px] text-slate-400 sm:text-xs">{authUser.email}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            <div className="flex flex-col gap-4 sm:gap-5 lg:col-span-2">
              <StepCard step={1} icon={<FaCalendarAlt />} title="Select Date">
                <div className="grid grid-cols-4 gap-1.5 xs:grid-cols-5 sm:grid-cols-7 sm:gap-2">
                  {dateItems.map((item, index) => (
                    <button key={item.date} onClick={() => handleDateSelect(index)}
                      className={`rounded-lg border py-2 text-center transition-all duration-200 cursor-pointer sm:rounded-xl sm:py-3
                      ${selectedDateIndex === index ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-100"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"}`}>
                      <p className={`text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${selectedDateIndex === index ? "text-blue-100" : "text-slate-400"}`}>
                        {item.day.slice(0, 3)}
                      </p>
                      <p className={`mt-0.5 text-xs font-extrabold sm:mt-1 sm:text-sm ${selectedDateIndex === index ? "text-white" : "text-slate-800"}`}>
                        {new Date(item.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}
                      </p>
                    </button>
                  ))}
                </div>
              </StepCard>

              <StepCard step={2} icon={<MdOutlineAccessTime />} title="Select Time Slot">
                {slotsLoading && (
                  <div className="flex h-24 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-sky-200 bg-sky-50 sm:h-32 sm:rounded-xl">
                    <div className="h-4 w-4 animate-spin rounded-full border-[3px] border-sky-500 border-t-transparent sm:h-5 sm:w-5" />
                    <p className="text-[10px] font-semibold text-blue-500 sm:text-xs">Fetching available slots…</p>
                  </div>
                )}
                {!slotsLoading && slotsError && (
                  <div className="flex h-24 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-red-200 bg-red-50 sm:h-32 sm:rounded-xl">
                    <p className="text-xs font-semibold text-red-500 sm:text-sm">Failed to load slots.</p>
                    <button onClick={() => dispatch(fetchSlotsForDate({ doctorId: doctorId!, date: dateItems[selectedDateIndex].date }))}
                      className="rounded-lg bg-red-500 px-3 py-1 text-[10px] font-bold text-white hover:bg-red-600 sm:px-4 sm:py-1.5 sm:text-xs">Retry</button>
                  </div>
                )}
                {!slotsLoading && !slotsError && slots.length === 0 && (
                  <div className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 bg-slate-50 sm:h-32 sm:rounded-xl sm:gap-2">
                    <p className="text-xs font-semibold text-slate-500 sm:text-sm">No slots on <span className="text-slate-700">{selectedDateItem?.day}</span></p>
                    <p className="text-[10px] text-slate-400 sm:text-xs">Doctor may be on leave or has no schedule.</p>
                  </div>
                )}
                {!slotsLoading && !slotsError && slots.length > 0 && (
                  <>
                    <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 sm:px-3 sm:text-xs">
                        {slots.filter(isBookableSlot).length} available
                      </span>
                      <span className="text-[10px] text-slate-400 sm:text-xs">
                        {selectedDateItem?.day}, {new Date(selectedDateItem?.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 xs:grid-cols-4 sm:grid-cols-4 sm:gap-2 xl:grid-cols-5">
                      {slots.map((slot) => {
                        const isSelected = selectedSlot?.start_time === slot.start_time;
                        const slotStatus = String(slot.status || "").toLowerCase();
                        const isBooked = slotStatus === "booked" || slotStatus === "confirmed" || slotStatus === "accepted" || slotStatus === "completed" || Boolean(slot.appointment_id);
                        const isBlocked = slotStatus === "blocked" || slotStatus === "pending_payment";
                        const isUnavailable = !isBooked && !isBlocked && (slotStatus === "unavailable" || slot.is_available === false);
                        const isDisabled = isBooked || isBlocked || isUnavailable;
                        const label = isBooked ? "Booked" : isBlocked ? "Blocked" : isUnavailable ? "N/A" : "";
                        return (
                          <div key={`${slot.start_time}-${slot.end_time}`} className="group relative" title={isDisabled ? label : "Available"}>
                            <button type="button" disabled={isDisabled} onClick={() => { if (!isDisabled) dispatch(setSelectedSlot(slot)); }}
                              className={`relative w-full cursor-pointer rounded-lg border py-2 text-[10px] font-bold transition-all duration-200 sm:rounded-xl sm:py-2.5 sm:text-xs
                              ${isBooked ? "cursor-not-allowed border-red-200 bg-red-50 text-red-300 line-through"
                                  : isBlocked ? "cursor-not-allowed border-amber-200 bg-amber-50 text-amber-300"
                                    : isUnavailable ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                                      : isSelected ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-100"
                                        : "border-gray-200 bg-gray-50 text-gray-800 hover:border-blue-400 hover:bg-blue-500 hover:text-white"}`}>
                              {formatTime(slot.start_time)}
                              {isDisabled && (
                                <span className="absolute -top-1.5 right-0.5 rounded-full bg-white px-1 py-px text-[8px] font-bold text-slate-500 shadow-sm ring-1 ring-slate-200 sm:text-[9px]">
                                  {label}
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </StepCard>

              <StepCard step={3} icon={<FaRegFileAlt />} title="Reason for Visit">
                {authUser && (
                  <div className="mb-3 grid grid-cols-2 gap-2.5 rounded-lg bg-slate-50 p-3 sm:mb-4 sm:gap-3 sm:rounded-xl sm:p-4">
                    <InfoField label="Patient Name" value={authUser.name} />
                    <InfoField label="Email" value={authUser.email} />
                    {authUser.phone_number && <InfoField label="Phone" value={authUser.phone_number} />}
                    {authUser.gender && <InfoField label="Gender" value={authUser.gender} />}
                  </div>
                )}
                <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-white px-3 py-2.5 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-sky-100 sm:gap-3 sm:rounded-xl sm:px-4 sm:py-3">
                  <FaRegFileAlt className="mt-1 shrink-0 text-xs text-slate-300 sm:text-sm" />
                  <textarea rows={3} value={consultationReason} onChange={(e) => dispatch(setConsultationReason(e.target.value))}
                    placeholder="Describe your symptoms or reason (optional)" className="w-full resize-none bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-300 sm:text-sm" />
                </div>
              </StepCard>
            </div>

            <div className="flex flex-col gap-4 sm:gap-5 lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400 sm:mb-4">Summary</h2>
                <div className="space-y-2">
                  <SummaryRow label="Date" value={selectedDateItem ? `${selectedDateItem.day}, ${new Date(selectedDateItem.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}` : "—"} />
                  <SummaryRow label="Time" value={selectedSlot ? formatTime(selectedSlot.start_time) : "—"} />
                  <SummaryRow label="Doctor" value={doctorName ? `Dr. ${doctorName}` : "—"} />
                  <SummaryRow label="Patient" value={authUser?.name || "—"} />
                </div>
                {selectedSlot && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 sm:mt-4 sm:rounded-xl sm:py-2.5">
                    <FaCheckCircle className="shrink-0 text-sm text-emerald-500" />
                    <span className="text-[10px] font-semibold text-emerald-700 sm:text-xs">
                      {formatTime(selectedSlot.start_time)} — {formatTime(selectedSlot.end_time)}
                    </span>
                  </div>
                )}
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 sm:mt-5 sm:space-y-2.5 sm:pt-4">
                  <PaymentRow label="Consultation Fee" amount={doctorFee} />
                  <PaymentRow label="Platform Fee" amount={platformFee} />
                  <PaymentRow label={`GST (${gstRate}%)`} amount={gstAmount} />
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 sm:pt-3">
                    <span className="text-xs font-bold text-slate-700 sm:text-sm">Total</span>
                    <span className="text-lg font-extrabold text-blue-600 sm:text-xl">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                {paymentMethod === "clinic" && (
                  <p className="mt-2.5 rounded-lg bg-amber-50 px-3 py-2 text-[10px] font-medium text-amber-700 sm:mt-3 sm:rounded-xl sm:text-xs">
                    Platform fee ₹20 + GST 18% applies for clinic visits.
                  </p>
                )}
                {paymentMethod === "online" && (
                  <p className="mt-2.5 rounded-lg bg-emerald-50 px-3 py-2 text-[10px] font-medium text-emerald-700 sm:mt-3 sm:rounded-xl sm:text-xs">
                    No platform fee or GST for online payments.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
                <h2 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-slate-400 sm:mb-3">Consultation Type</h2>
                <div className="space-y-2">
                  <SelectOption active={consultationType === "Video Call"} onClick={() => dispatch(setConsultationType("Video Call"))}
                    icon={<FaVideo className="text-xs sm:text-sm" />} title="Video Call" subtitle="Online consultation" />
                  <SelectOption active={consultationType === "Clinic visit"} onClick={() => dispatch(setConsultationType("Clinic visit"))}
                    icon={<FaHospital className="text-xs sm:text-sm" />} title="Clinic Visit" subtitle="In-person at clinic" />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
                <h2 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-slate-400 sm:mb-3">Payment Method</h2>
                <div className="space-y-2">
                  <SelectOption active={paymentMethod === "online"} onClick={() => dispatch(setPaymentMethod("online"))}
                    icon={<FaCreditCard className="text-xs sm:text-sm" />} title="Online Payment" subtitle="Card / UPI / Net Banking" />
                  {consultationType === "Clinic visit" && (
                    <SelectOption active={paymentMethod === "clinic"} onClick={() => dispatch(setPaymentMethod("clinic"))}
                      icon={<FaHospital className="text-xs sm:text-sm" />} title="Pay at Clinic" subtitle="Pay during your visit" />
                  )}
                </div>
                {paymentMethod === "online" && (
                  <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-[#072654] px-3 py-2.5 sm:mt-4 sm:gap-3 sm:rounded-xl sm:px-4 sm:py-3">
                    <SiRazorpay className="text-lg text-white sm:text-xl" />
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-white sm:text-xs">Powered by Razorpay</p>
                      <p className="text-[9px] text-blue-300 sm:text-[10px]">Secure · Encrypted · Instant</p>
                    </div>
                    <FaLock className="text-[10px] text-blue-300" />
                  </div>
                )}
              </div>

              <button onClick={handleConfirm} disabled={!selectedSlot || isLoading}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-sky-200 transition-all hover:bg-blue-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-2xl sm:py-4 sm:text-sm">
                {isLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-4 sm:w-4" />
                    {bookingLoading ? "Booking…" : "Creating order…"}
                  </>
                ) : (
                  <>
                    {paymentMethod === "online" ? <SiRazorpay className="text-sm sm:text-base" /> : <FaRupeeSign className="text-xs" />}
                    {paymentMethod === "online" ? `Pay ₹${totalAmount.toFixed(2)} via Razorpay` : `Book & Pay ₹${totalAmount.toFixed(2)} at Clinic`}
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 pb-2">
                <FaLock className="text-[9px] text-slate-300 sm:text-[10px]" />
                <p className="text-[10px] text-slate-400 sm:text-xs">Secured & encrypted payment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const StepCard = ({ step, icon, title, children }: { step: number; icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5 lg:p-6">
    <div className="mb-4 flex items-center gap-2.5 sm:mb-5 sm:gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500 text-xs font-extrabold text-white shadow-md shadow-sky-100 sm:h-8 sm:w-8 sm:rounded-xl">
        {step}
      </div>
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 sm:text-base">
        <span className="text-slate-400">{icon}</span>{title}
      </h2>
    </div>
    {children}
  </div>
);

const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[10px]">{label}</p>
    <p className="mt-0.5 text-xs font-semibold text-slate-700 sm:text-sm">{value}</p>
  </div>
);

const SummaryRow = ({ label, value }: SummaryRowProps) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-[10px] text-slate-400 sm:text-xs">{label}</span>
    <span className="text-right text-[10px] font-semibold text-slate-700 sm:text-xs">{value}</span>
  </div>
);

const PaymentRow = ({ label, amount }: PaymentRowProps) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] text-slate-400 sm:text-xs">{label}</span>
    <span className="text-[10px] font-semibold text-slate-700 sm:text-xs">₹{amount.toFixed(2)}</span>
  </div>
);

const SelectOption = ({ active, onClick, icon, title, subtitle }:
  { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string }) => (
  <button onClick={onClick}
    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-150 sm:gap-3 sm:rounded-xl sm:px-4 sm:py-3
    ${active ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-blue-200"}`}>
    <div className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-all sm:h-4 sm:w-4
    ${active ? "border-blue-500 bg-blue-500" : "border-slate-300"}`}>
      {active && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
    </div>
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl
    ${active ? "bg-blue-100 text-blue-600" : "bg-white text-slate-400 ring-1 ring-slate-200"}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className={`text-xs font-bold sm:text-sm ${active ? "text-blue-700" : "text-slate-700"}`}>{title}</p>
      <p className="text-[10px] text-slate-400 sm:text-xs">{subtitle}</p>
    </div>
  </button>
);