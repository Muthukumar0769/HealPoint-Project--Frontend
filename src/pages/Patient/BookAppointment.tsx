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
  consultationType, patientName, reason, onBack, onDownload, }: {
    paymentId: string;
    orderId: string;
    amountPaid: number;
    doctorName: string;
    date: string;
    time: string;
    consultationType: string;
    patientName: string; reason: string;
    onBack: () => void;
    onDownload: () => void;
  }) => (
  <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
    <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 flex items-center gap-3">
      <button onClick={onBack}
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30 transition">
        <FaArrowLeft className="text-xs" />
      </button>
      <div className="flex items-center gap-2">
        <MdReceipt className="text-white text-lg" />
        <h2 className="text-sm font-extrabold text-white">Transaction Details</h2>
      </div>
    </div>

    <div className="max-h-[70vh] overflow-y-auto p-5 space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3">
        <FaCheckCircle className="text-emerald-500 text-xl shrink-0" />
        <div>
          <p className="text-sm font-extrabold text-emerald-700">Payment Successful</p>
          <p className="text-xs text-emerald-500">Your appointment is confirmed</p>
        </div>
        <span className="ml-auto text-lg font-extrabold text-emerald-600">₹{amountPaid.toFixed(2)}</span>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 divide-y divide-slate-100">
        <div className="px-4 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Payment Info</p>
        </div>
        <TxRow label="Payment ID" value={paymentId} canCopy />
        <TxRow label="Order ID" value={orderId} canCopy />
        <TxRow label="Method" value="Razorpay" />
        <TxRow label="Status" value="Successful" green />
        <TxRow label="Amount" value={`₹${amountPaid.toFixed(2)}`} green />
        <TxRow label="Date" value={new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 divide-y divide-slate-100">
        <div className="px-4 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Appointment Info</p>
        </div>
        <TxRow label="Patient" value={patientName} />
        <TxRow label="Doctor" value={`Dr. ${doctorName}`} />
        <TxRow label="Date & Time" value={`${date} · ${time}`} />
        <TxRow label="Type" value={consultationType} />
        {reason && <TxRow label="Reason" value={reason} />}
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-[#072654] px-4 py-3">
        <SiRazorpay className="text-xl text-white" />
        <div>
          <p className="text-xs font-bold text-white">Secured by Razorpay</p>
          <p className="text-[10px] text-blue-300">Encrypted · Safe · Instant</p>
        </div>
        <FaLock className="ml-auto text-xs text-blue-300" />
      </div>
      <button onClick={onDownload}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-500 py-3 text-sm font-bold text-white shadow-lg shadow-sky-100 transition hover:bg-blue-600">
        <FaDownload className="text-xs" />
        Download PDF Receipt
      </button>
    </div>
  </div>
);

const TxRow = ({ label, value, canCopy, green }: { label: string; value: string; canCopy?: boolean; green?: boolean }) => (
  <div className="flex items-center justify-between px-4 py-2.5 gap-3">
    <span className="text-xs text-slate-400 shrink-0">{label}</span>
    <div className="flex items-center gap-1.5 min-w-0">
      <span className={`text-xs font-semibold truncate max-w-[160px] ${green ? "text-emerald-600" : "text-slate-700"}`}>
        {value}
      </span>
      {canCopy && value !== "—" && (
        <button onClick={() => { navigator.clipboard.writeText(value); toast.success("Copied!"); }}
          className="shrink-0 text-slate-300 hover:text-blue-500 transition">
          <FaCopy className="text-[10px]" />
        </button>
      )}
    </div>
  </div>
);

interface SuccessModalProps {
  doctorName: string; date: string; time: string;
  consultationType: string; totalAmount: number;
  paymentId?: string; orderId?: string;
  appointmentId: number; paymentMethod: "online" | "clinic";
  patientName: string; reason: string;
  onGoToAppointments: () => void;
}

const SuccessModal = ({ doctorName, date, time, consultationType, totalAmount,
  paymentId, orderId, paymentMethod, patientName, reason, onGoToAppointments, }: SuccessModalProps) => {
  const [showTx, setShowTx] = useState(false);

  const handleDownload = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const receiptNo = paymentId || `HP-${Date.now()}`;

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("HealPoint", 15, 18);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Payment Receipt", 15, 27);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Transaction Receipt", 15, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Receipt No: ${receiptNo}`, 15, 58);
    doc.text(`Generated On: ${new Date().toLocaleString("en-IN")}`, 15, 64);

    let y = 78;
    const sectionTitle = (title: string) => {
      doc.setFillColor(239, 246, 255);
      doc.rect(15, y, 180, 10, "F");
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(title, 20, y + 7);
      y += 18;
    };
    const row = (label: string, value: string) => {
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(label, 20, y);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(value || "—", 85, y);
      y += 8;
    };

    sectionTitle("Payment Details");
    row("Payment Status", "Successful");
    row("Payment ID", paymentId || "—");
    row("Order ID", orderId || "—");
    row("Payment Method", "Razorpay");
    row("Amount Paid", `Rs. ${totalAmount.toFixed(2)}`);
    row("Transaction Date", new Date().toLocaleString("en-IN"));

    y += 6;
    sectionTitle("Appointment Details");
    row("Patient Name", patientName);
    row("Doctor Name", `Dr. ${doctorName}`);
    row("Date & Time", `${date} · ${time}`);
    row("Consultation Type", consultationType);
    row("Reason", reason || "Not specified");

    y += 6;
    sectionTitle("Fee Summary");
    row("Appointment Fee", `Rs. ${totalAmount.toFixed(2)}`);
    row("Platform Fee", "Rs. 0.00");
    row("Tax", "Rs. 0.00");

    doc.setDrawColor(226, 232, 240);
    doc.line(20, y, 190, y);
    y += 10;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Total Amount", 20, y);
    doc.text(`Rs. ${totalAmount.toFixed(2)}`, 150, y);

    y += 20;
    doc.setFillColor(240, 253, 244);
    doc.rect(15, y, 180, 16, "F");
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Payment completed successfully. Thank you for using HealPoint.", 20, y + 10);

    doc.save(`HealPoint_Receipt_${receiptNo}.pdf`);
    toast.success("Receipt downloaded!");
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => { if (e.target === e.currentTarget) onGoToAppointments(); }}>
      <div style={{ width: "100%", maxWidth: "28rem", overflow: "hidden", borderRadius: "1.5rem" }}>
        <div style={{
          display: "flex", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          transform: showTx ? "translateX(-50%)" : "translateX(0%)", width: "200%"
        }}>
          <div style={{ width: "50%", padding: "0 0" }}>
            <div className="rounded-3xl border border-slate-100 bg-white p-7 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <FaCheckCircle className="text-4xl text-emerald-500" />
              </div>
              <span className="mb-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {paymentMethod === "online" ? "Payment confirmed" : "Booking confirmed"}
              </span>
              <h2 className="mb-1 text-xl font-extrabold text-slate-900">Appointment booked!</h2>
              <p className="mb-5 text-sm text-slate-500">
                {paymentMethod === "online" ? "Your payment was successful and appointment is confirmed."
                  : "Your appointment is confirmed. Please pay at the clinic."}
              </p>
              <div className="mb-1 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50 text-left">
                <DetailRow label="Doctor" value={`Dr. ${doctorName}`} />
                <DetailRow label="Date & time" value={`${date} · ${time}`} />
                <DetailRow label="Type" value={consultationType} />
                {paymentId && <DetailRow label="Payment ID" value={paymentId} small />}
              </div>
              <div className="my-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
                <span className="text-sm font-semibold text-slate-600">
                  {paymentMethod === "online" ? "Total paid" : "Payable at clinic"}
                </span>
                <span className="text-lg font-extrabold text-emerald-600">₹{totalAmount.toFixed(2)}</span>
              </div>
              {paymentMethod === "online" && (
                <button onClick={() => setShowTx(true)} className="mb-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-100 transition hover:bg-blue-600">
                  <MdReceipt className="text-sm" />
                  View transaction details
                </button>
              )}
              <button onClick={onGoToAppointments} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                Back to appointments
              </button>
            </div>
          </div>
          <div style={{ width: "50%" }}>
            <TransactionPanel
              paymentId={paymentId || "—"}
              orderId={orderId || "—"}
              amountPaid={totalAmount}
              doctorName={doctorName}
              date={date} time={time}
              consultationType={consultationType}
              patientName={patientName}
              reason={reason}
              onBack={() => setShowTx(false)}
              onDownload={handleDownload}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, small }: { label: string; value: string; small?: boolean }) => (
  <div className="flex items-center justify-between px-4 py-2.5">
    <span className="text-xs text-slate-400">{label}</span>
    <span className={`text-right font-semibold text-slate-700 ${small ? "max-w-[160px] truncate text-[11px]" : "text-xs"}`}>
      {value}
    </span>
  </div>
);
export const BookAppointment = () => {
   usePageTitle("Book Appointment");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { doctorId } = useParams();
  const razorpayScriptLoaded = useRef(false);
  const [successModal, setSuccessModal] = useState<{
    open: boolean;
    appointmentId: number;
    paymentId?: string;
    razorpayOrderId?: string;
    amountPaid: number;
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

  const fireAppointmentBooked = () => {
    window.dispatchEvent(new Event("appointmentBooked"));
  };

  const openRazorpay = (orderId: string, amount: number, apptId: number) => {
    if (!window.Razorpay) { toast.error("Payment gateway not loaded. Please refresh."); return; }
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount, currency: "INR", name: "HealPoint",
      description: `Appointment with Dr. ${doctor?.user?.name || "Doctor"}`,
      order_id: orderId,
      prefill: { name: authUser?.name || "Test User", email: authUser?.email || "test@example.com", contact: "9999999999" },
      method: { card: true, netbanking: true, upi: true, wallet: true },
      theme: { color: "#0EA5E9" },
      handler: async (response: any) => {
        try {
          const verifyResult = await dispatch(verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }));
          if (verifyRazorpayPayment.fulfilled.match(verifyResult)) {
            dispatch(setAppointmentNotification());
            dispatch(setEarningNotification());
            dispatch(consultationType === "Video Call" ? setVideoNotification() : setClinicNotification());
            fireAppointmentBooked();
            setSuccessModal({
              open: true,
              appointmentId: apptId,
              paymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              amountPaid: amount / 100,
            });
          } else { toast.error("Payment verification failed"); }
        } catch { toast.error("Payment verification error"); }
      },
      modal: { ondismiss: () => { toast.error("Payment cancelled"); } },
    };
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response: any) => { toast.error(response.error.description || "Payment failed"); });
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

    if (!submitBooking.fulfilled.match(bookResult)) {
      toast.error((bookResult.payload as string) || "Booking failed"); return;
    }

    const newAppointmentId = bookResult.payload as number;

    if (paymentMethod === "clinic") {
      dispatch(setAppointmentNotification());
      dispatch(consultationType === "Video Call" ? setVideoNotification() : setClinicNotification());
      fireAppointmentBooked();
      setSuccessModal({
        open: true,
        appointmentId: newAppointmentId,
        amountPaid: totalAmount,
      });
      return;
    }

    const orderResult = await dispatch(createRazorpayOrder(newAppointmentId));
    if (!createRazorpayOrder.fulfilled.match(orderResult)) {
      toast.error((orderResult.payload as string) || "Failed to create order"); return;
    }

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
        <SuccessModal doctorName={doctorName} date={
          selectedDateItem ? `${selectedDateItem.day}, ${new Date(selectedDateItem.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}` : "—"}
          time={selectedSlot ? formatTime(selectedSlot.start_time) : "—"}
          consultationType={consultationType}
          totalAmount={successModal.amountPaid}
          paymentId={successModal.paymentId}
          orderId={successModal.razorpayOrderId}
          appointmentId={successModal.appointmentId}
          paymentMethod={paymentMethod as "online" | "clinic"}
          patientName={authUser?.name || "—"}
          reason={consultationReason}
          onGoToAppointments={() => navigate("/my-appointments")} />
      )}
      <div className="min-h-screen bg-[#f0f4fb] px-4 pb-20 pt-24 sm:px-6 lg:px-8 lg:pt-28">
        <div className="mx-auto max-w-6xl">
          <button onClick={() => navigate(-1)}
            className="mb-6 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600">
            <FaArrowLeft className="text-xs" /> Back
          </button>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-600">Appointment Booking</p>
              <h1 className="text-3xl font-extrabold text-slate-900">
                {doctorName ? `Dr. ${doctorName}` : "Select a Doctor"}
              </h1>
            </div>
            {authUser && (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                  <FaUserCircle className="text-lg text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{authUser.name}</p>
                  <p className="text-xs text-slate-400">{authUser.email}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-5 lg:col-span-2">
              <StepCard step={1} icon={<FaCalendarAlt />} title="Select Date">
                <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 xl:grid-cols-7">
                  {dateItems.map((item, index) => (
                    <button key={item.date} onClick={() => handleDateSelect(index)}
                      className={`min-w-[84px] rounded-xl cursor-pointer border py-3 text-center transition-all duration-200 sm:min-w-0
                      ${selectedDateIndex === index
                          ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-100"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${selectedDateIndex === index ? "text-blue-100" : "text-slate-400"}`}>
                        {item.day.slice(0, 3)}
                      </p>
                      <p className={`mt-1 text-sm font-extrabold ${selectedDateIndex === index ? "text-white" : "text-slate-800"}`}>
                        {new Date(item.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}
                      </p>
                    </button>
                  ))}
                </div>
              </StepCard>

              <StepCard step={2} icon={<MdOutlineAccessTime />} title="Select Time Slot">
                {slotsLoading && (
                  <div className="flex h-32 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-sky-200 bg-sky-50">
                    <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-sky-500 border-t-transparent" />
                    <p className="text-xs font-semibold text-blue-500">
                      Fetching slots for{" "}
                      <span className="text-sky-700">
                        {selectedDateItem?.day}, {new Date(selectedDateItem?.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}
                      </span>
                    </p>
                  </div>
                )}
                {!slotsLoading && slotsError && (
                  <div className="flex h-32 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-red-200 bg-red-50">
                    <p className="text-sm font-semibold text-red-500">Failed to load slots.</p>
                    <button onClick={() => dispatch(fetchSlotsForDate({ doctorId: doctorId!, date: dateItems[selectedDateIndex].date }))}
                      className="rounded-lg bg-red-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-600">
                      Retry
                    </button>
                  </div>
                )}
                {!slotsLoading && !slotsError && slots.length === 0 && (
                  <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50">
                    <p className="text-sm font-semibold text-slate-500">No slots on <span className="text-slate-700">{selectedDateItem?.day}</span></p>
                    <p className="text-xs text-slate-400">Doctor may be on leave or has no schedule.</p>
                  </div>
                )}
                {!slotsLoading && !slotsError && slots.length > 0 && (
                  <>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                        {slots.filter(isBookableSlot).length} available
                      </span>
                      <span className="text-xs text-slate-400">
                        {selectedDateItem?.day}, {new Date(selectedDateItem?.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
                      {slots.map((slot) => {
                        const isSelected = selectedSlot?.start_time === slot.start_time;
                        const slotStatus = String(slot.status || "").toLowerCase();
                        const isBooked = slotStatus === "booked" || slotStatus === "confirmed" || slotStatus === "accepted" ||
                          slotStatus === "completed" || slotStatus === "pending_payment" || Boolean(slot.appointment_id);
                        const isBlocked = slotStatus === "blocked" || slotStatus === "pending_payment";
                        const isUnavailable = !isBooked && !isBlocked && (slotStatus === "unavailable" || slot.is_available === false);
                        const isDisabled = isBooked || isBlocked || isUnavailable;
                        const label = isBooked ? "Booked" : isBlocked ? "Blocked" : isUnavailable ? "Unavailable" : "";
                        return (
                          <div key={`${slot.start_time}-${slot.end_time}`} className="group relative" title={isDisabled ? label : "Available"}>
                            <button type="button" disabled={isDisabled}
                              onClick={() => { if (!isDisabled) dispatch(setSelectedSlot(slot)); }}
                              className={`relative cursor-pointer w-full rounded-xl border py-2.5 text-xs font-bold transition-all duration-200
                              ${isBooked ? "cursor-not-allowed border-red-200 bg-red-50 text-red-300 line-through"
                                  : isBlocked ? "cursor-not-allowed border-amber-200 bg-amber-50 text-amber-300"
                                    : isUnavailable ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                                      : isSelected ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-100"
                                        : "cursor-pointer border-gray-200 bg-gray-50 text-gray-800 hover:border-blue-400 hover:bg-blue-500 hover:text-white"}`}>
                              {formatTime(slot.start_time)}
                              {isDisabled && (
                                <span className="absolute -top-2 right-1 rounded-full bg-white px-1.5 py-px text-[9px] font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
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
                  <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
                    <InfoField label="Patient Name" value={authUser.name} />
                    <InfoField label="Email" value={authUser.email} />
                    {authUser.phone_number && <InfoField label="Phone" value={authUser.phone_number} />}
                    {authUser.gender && <InfoField label="Gender" value={authUser.gender} />}
                  </div>
                )}
                <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-white px-4 py-3 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-sky-100">
                  <FaRegFileAlt className="mt-1 shrink-0 text-sm text-slate-300" />
                  <textarea rows={4} value={consultationReason}
                    onChange={(e) => dispatch(setConsultationReason(e.target.value))}
                    placeholder="Describe your symptoms or reason for this consultation (optional)"
                    className="w-full resize-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300" />
                </div>
              </StepCard>
            </div>

            <div className="flex flex-col gap-5 lg:sticky lg:top-28 lg:h-fit">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">Summary</h2>
                <div className="space-y-2.5">
                  <SummaryRow label="Date" value={selectedDateItem ? `${selectedDateItem.day}, ${new Date(selectedDateItem.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}` : "—"} />
                  <SummaryRow label="Time" value={selectedSlot ? formatTime(selectedSlot.start_time) : "—"} />
                  <SummaryRow label="Doctor" value={doctorName ? `Dr. ${doctorName}` : "—"} />
                  <SummaryRow label="Patient" value={authUser?.name || "—"} />
                </div>
                {selectedSlot && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5">
                    <FaCheckCircle className="shrink-0 text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-700">
                      {formatTime(selectedSlot.start_time)} — {formatTime(selectedSlot.end_time)}
                    </span>
                  </div>
                )}
                <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4">
                  <PaymentRow label="Consultation Fee" amount={doctorFee} />
                  <PaymentRow label="Platform Fee" amount={platformFee} />
                  <PaymentRow label={`GST (${gstRate}%)`} amount={gstAmount} />
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-sm font-bold text-slate-700">Total</span>
                    <span className="text-xl font-extrabold text-blue-600">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                {paymentMethod === "clinic" && (
                  <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                    Platform fee ₹20 + GST 18% applies for clinic visits.
                  </p>
                )}
                {paymentMethod === "online" && (
                  <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                    No platform fee or GST for online payments.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-400">Consultation Type</h2>
                <div className="space-y-2">
                  <SelectOption active={consultationType === "Video Call"}
                    onClick={() => dispatch(setConsultationType("Video Call"))}
                    icon={<FaVideo className="text-sm" />} title="Video Call" subtitle="Online consultation" />
                  <SelectOption active={consultationType === "Clinic visit"}
                    onClick={() => dispatch(setConsultationType("Clinic visit"))}
                    icon={<FaHospital className="text-sm" />} title="Clinic Visit" subtitle="In-person at clinic" />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-400">Payment Method</h2>
                <div className="space-y-2">
                  <SelectOption active={paymentMethod === "online"}
                    onClick={() => dispatch(setPaymentMethod("online"))}
                    icon={<FaCreditCard className="text-sm" />} title="Online Payment" subtitle="Card / UPI / Net Banking" />
                  {consultationType === "Clinic visit" && (
                    <SelectOption active={paymentMethod === "clinic"}
                      onClick={() => dispatch(setPaymentMethod("clinic"))}
                      icon={<FaHospital className="text-sm" />} title="Pay at Clinic" subtitle="Pay during your visit" />
                  )}
                </div>
                {paymentMethod === "online" && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#072654] px-4 py-3">
                    <SiRazorpay className="text-xl text-white" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-white">Powered by Razorpay</p>
                      <p className="text-[10px] text-blue-300">Secure · Encrypted · Instant</p>
                    </div>
                    <FaLock className="text-xs text-blue-300" />
                  </div>
                )}
              </div>

              <button onClick={handleConfirm} disabled={!selectedSlot || isLoading}
                className="flex h-13 w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-blue-500 py-4 text-sm font-bold text-white shadow-lg shadow-sky-200 transition-all hover:bg-blue-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {bookingLoading ? "Booking…" : "Creating order…"}
                  </>
                ) : (
                  <>
                    {paymentMethod === "online" ? <SiRazorpay className="text-base" /> : <FaRupeeSign className="text-xs" />}
                    {paymentMethod === "online" ? `Pay ₹${totalAmount.toFixed(2)} via Razorpay` : `Book & Pay ₹${totalAmount.toFixed(2)} at Clinic`}
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5">
                <FaLock className="text-[10px] text-slate-300" />
                <p className="text-xs text-slate-400">Secured & encrypted payment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const StepCard = ({ step, icon, title, children }: { step: number; icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500 text-xs font-extrabold text-white shadow-md shadow-sky-100">
        {step}
      </div>
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
        <span className="text-slate-400">{icon}</span>
        {title}
      </h2>
    </div>
    {children}
  </div>
);

const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-0.5 text-sm font-semibold text-slate-700">{value}</p>
  </div>
);

const SummaryRow = ({ label, value }: SummaryRowProps) => (
  <div className="flex items-start justify-between gap-4">
    <span className="text-xs text-slate-400">{label}</span>
    <span className="text-right text-xs font-semibold text-slate-700">{value}</span>
  </div>
);

const PaymentRow = ({ label, amount }: PaymentRowProps) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-slate-400">{label}</span>
    <span className="text-xs font-semibold text-slate-700">₹{amount.toFixed(2)}</span>
  </div>
);

const SelectOption = ({ active, onClick, icon, title, subtitle }:
  { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string }) => (
  <button onClick={onClick}
    className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150
    ${active ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-blue-200"}`}>
    <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all
    ${active ? "border-blue-500 bg-blue-500" : "border-slate-300"}`}>
      {active && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
    </div>
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
    ${active ? "bg-blue-100 text-blue-600" : "bg-white text-slate-400 ring-1 ring-slate-200"}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className={`text-sm font-bold ${active ? "text-blue-700" : "text-slate-700"}`}>{title}</p>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </div>
  </button>
);