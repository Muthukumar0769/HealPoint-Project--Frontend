import { useEffect, useRef, useState } from "react";
import { FaCalendarAlt, FaRegFileAlt, FaLock, FaArrowLeft, FaCheckCircle, FaCopy, FaDownload, FaUserMd, FaUserCircle } from "react-icons/fa";
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
import { setAppointmentNotification, setEarningNotification, setVideoNotification } from "../../store/slices/NotificationSlice.ts";
import usePageTitle from "../../hooks/usePageTitle";

//--------In global Object we can razorpay type with any to avoid typescript error-------

declare global {
  interface Window { Razorpay: any; }
}

//------Separate Component for Transaction details----------

const TransactionPanel = ({ paymentId, orderId, amountPaid, doctorName, date, time,
  consultationType, patientName, reason, onBack, onDownload }: {
    paymentId: string; orderId: string; amountPaid: number; doctorName: string;
    date: string; time: string; consultationType: string; patientName: string;
    reason: string; onBack: () => void; onDownload: () => void;
  }) => (
  <div className="w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
    <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3">
      <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30 transition">
        <FaArrowLeft className="text-xs" />
      </button>
      <MdReceipt className="text-lg text-white" />
      <h2 className="text-sm font-extrabold text-white">Transaction Details</h2>
    </div>
    <div className="max-h-[65vh] overflow-y-auto p-4 space-y-3">
      <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50 px-3 py-3">
        <FaCheckCircle className="shrink-0 text-xl text-emerald-500" />
        <div className="flex-1">
          <p className="text-sm font-extrabold text-emerald-700">Payment Successful</p>
          <p className="text-xs text-emerald-500">Your appointment is confirmed</p>
        </div>
        <span className="text-lg font-extrabold text-emerald-600">₹{amountPaid.toFixed(2)}</span>
      </div>

      {[
        {
          title: "Payment Info", rows: [
            { label: "Payment ID", value: paymentId, canCopy: true },
            { label: "Order ID", value: orderId, canCopy: true },
            { label: "Method", value: "Razorpay" },
            { label: "Status", value: "Successful", green: true },
            { label: "Amount", value: `₹${amountPaid.toFixed(2)}`, green: true },
            { label: "Date", value: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
          ]
        },
        {
          title: "Appointment Info", rows: [
            { label: "Patient", value: patientName },
            { label: "Doctor", value: `Dr. ${doctorName}` },
            { label: "Date & Time", value: `${date} · ${time}` },
            { label: "Type", value: consultationType },
            ...(reason ? [{ label: "Reason", value: reason }] : []),
          ]
        },
      ].map(({ title, rows }) => (
        <div key={title} className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
          <div className="px-4 py-2 bg-slate-100/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
          </div>
          {rows.map((r) => (
            <TxRow key={r.label} label={r.label} value={r.value} canCopy={r.canCopy} green={r.green} />
          ))}
        </div>
      ))}

      <div className="flex items-center gap-3 rounded-xl bg-[#072654] px-4 py-3">
        <SiRazorpay className="text-xl text-white" />
        <div className="flex-1">
          <p className="text-xs font-bold text-white">Secured by Razorpay</p>
          <p className="text-[10px] text-blue-300">Encrypted · Safe · Instant</p>
        </div>
        <FaLock className="text-xs text-blue-300" />
      </div>

      <button onClick={onDownload} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-2.5 text-xs font-bold text-white shadow-lg transition hover:opacity-90">
        <FaDownload className="text-xs" /> Download PDF Receipt
      </button>
    </div>
  </div>
);

const TxRow = ({ label, value, canCopy, green }: { label: string; value: string; canCopy?: boolean; green?: boolean }) => (
  <div className="flex items-center justify-between gap-3 px-4 py-2.5">
    <span className="text-xs text-slate-400 shrink-0">{label}</span>
    <div className="flex min-w-0 items-center gap-1.5">
      <span className={`max-w-[160px] truncate text-xs font-semibold ${green ? "text-emerald-600" : "text-slate-700"}`}>{value}</span>
      {canCopy && value !== "—" && (
        <button onClick={() => { navigator.clipboard.writeText(value); toast.success("Copied!"); }} className="shrink-0 text-slate-300 hover:text-blue-500 transition">
          <FaCopy className="text-[10px]" />
        </button>
      )}
    </div>
  </div>
);

//------After Appointment Booking this success modal popup show--------

interface SuccessModalProps {
  doctorName: string; date: string; time: string; consultationType: string;
  totalAmount: number; paymentId?: string; orderId?: string; appointmentId: number;
  paymentMethod: "online" | "clinic"; patientName: string; reason: string;
  onGoToAppointments: () => void;
}

const SuccessModal = ({ doctorName, date, time, consultationType, totalAmount,
  paymentId, orderId, patientName, reason, onGoToAppointments }: SuccessModalProps) => {
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
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => { if (e.target === e.currentTarget) onGoToAppointments(); }}>
      <div style={{ width: "100%", maxWidth: "22rem", overflow: "hidden", borderRadius: "1.25rem" }}>
        <div style={{ display: "flex", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)", transform: showTx ? "translateX(-50%)" : "translateX(0%)", width: "200%" }}>
          <div style={{ width: "50%" }}>
            <div className="rounded-2xl bg-white shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 text-center">
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                  <FaCheckCircle className="text-3xl text-white" />
                </div>
                <h2 className="text-lg font-extrabold text-white">Appointment Booked!</h2>
                <p className="text-xs text-blue-100 mt-0.5">Payment confirmed successfully</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                  <DetailRow label="Doctor" value={`Dr. ${doctorName}`} />
                  <DetailRow label="Date & Time" value={`${date} · ${time}`} />
                  <DetailRow label="Type" value={consultationType} />
                  {paymentId && <DetailRow label="Payment ID" value={paymentId} small />}
                </div>
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-600">Total paid</span>
                  <span className="text-lg font-extrabold text-emerald-600">₹{totalAmount.toFixed(2)}</span>
                </div>
                <button onClick={() => setShowTx(true)} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90">
                  <MdReceipt className="text-sm" /> View Transaction Details
                </button>
                <button onClick={onGoToAppointments} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                  Back to Appointments
                </button>
              </div>
            </div>
          </div>
          <div style={{ width: "50%" }}>
            <TransactionPanel
              paymentId={paymentId || "—"} orderId={orderId || "—"} amountPaid={totalAmount}
              doctorName={doctorName} date={date} time={time} consultationType={consultationType}
              patientName={patientName} reason={reason} onBack={() => setShowTx(false)} onDownload={handleDownload}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, small }: { label: string; value: string; small?: boolean }) => (
  <div className="flex items-center justify-between px-4 py-2.5">
    <span className="text-xs text-slate-400 shrink-0">{label}</span>
    <span className={`text-right font-semibold text-slate-700 ${small ? "max-w-[150px] truncate text-[11px]" : "text-xs"}`}>{value}</span>
  </div>
);

//----Main Component-----------

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
  const {
    dateItems, slots, slotsLoading, slotsError, selectedDateIndex, selectedSlot,
    consultationReason, bookingLoading, orderLoading,
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
    dispatch(setConsultationType("Video Call"));
    dispatch(setPaymentMethod("online"));
  }, [dispatch]);

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

  //---------Open the Razorpay popup--------------

  const openRazorpay = (orderId: string, amount: number, apptId: number) => {
    if (!window.Razorpay) { toast.error("Payment gateway not loaded. Please refresh."); return; }
    const scrollY = window.scrollY;
    document.body.dataset.scrollY = String(scrollY);
    document.body.style.overflow = "hidden";
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID, amount, currency: "INR", name: "HealPoint",
      description: `Appointment with Dr. ${doctor?.user?.name || "Doctor"}`,
      order_id: orderId,
      prefill: { name: authUser?.name || "Test User", email: authUser?.email || "test@example.com", contact: "9999999999" },
      method: { card: true, netbanking: true, upi: true, wallet: true },
      theme: { color: "#2563EB" },
      handler: async (response: any) => {
        document.body.style.overflow = "";
        window.scrollTo(0, Number(document.body.dataset.scrollY || 0));
        delete document.body.dataset.scrollY;
        try {
          const verifyResult = await dispatch(verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }));
          if (verifyRazorpayPayment.fulfilled.match(verifyResult)) {
            dispatch(setAppointmentNotification()); dispatch(setEarningNotification());
            dispatch(setVideoNotification());
            fireAppointmentBooked();
            setSuccessModal({ open: true, appointmentId: apptId, paymentId: response.razorpay_payment_id, razorpayOrderId: response.razorpay_order_id, amountPaid: amount / 100 });
          } else { toast.error("Payment verification failed"); }
        } catch { toast.error("Payment verification error"); }
      },
      modal: {
        ondismiss: () => {
          document.body.style.overflow = "";
          window.scrollTo(0, Number(document.body.dataset.scrollY || 0));
          delete document.body.dataset.scrollY;
          toast.error("Payment cancelled");
        }
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response: any) => {
      document.body.style.overflow = "";
      window.scrollTo(0, Number(document.body.dataset.scrollY || 0));
      delete document.body.dataset.scrollY;
      toast.error(response.error.description || "Payment failed");
    });
    rzp.open();
  };

  //-------Click the Pay Button the function becomes true only the razorpay opens-------

  const handleConfirm = async () => {
    if (!authUser) { toast.error("Please login to book an appointment"); navigate("/login"); return; }
    if (!selectedSlot) { toast.error("Please select a time slot"); return; }
    const bookResult = await dispatch(submitBooking({
      doctorId: doctorId!, date: dateItems[selectedDateIndex].date,
      start_time: selectedSlot.start_time, end_time: selectedSlot.end_time,
      consultation_type: "Video Call", reason: consultationReason,
    }));
    if (!submitBooking.fulfilled.match(bookResult)) { toast.error((bookResult.payload as string) || "Booking failed"); return; }
    const newAppointmentId = bookResult.payload as number;
    const orderResult = await dispatch(createRazorpayOrder(newAppointmentId));
    if (!createRazorpayOrder.fulfilled.match(orderResult)) { toast.error((orderResult.payload as string) || "Failed to create order"); return; }
    const payload = orderResult.payload as { orderId: string; amount: number };
    openRazorpay(payload.orderId, payload.amount, newAppointmentId);
  };

  const formatTime = (time: string) =>
    new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  const capitalize = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

  const doctorFee = Number(doctor?.consultation_fee || 0);
  const rawName = doctor?.user?.name || "";
  const doctorName = capitalize(rawName);
  const selectedDateItem = dateItems[selectedDateIndex];
  const isLoading = bookingLoading || orderLoading;
  const totalAmount = parseFloat(doctorFee.toFixed(2));

  return (
    <>
      {successModal?.open && (
        <SuccessModal
          doctorName={doctorName}
          date={selectedDateItem ? `${selectedDateItem.day}, ${new Date(selectedDateItem.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}` : "—"}
          time={selectedSlot ? formatTime(selectedSlot.start_time) : "—"}
          consultationType="Video Call" totalAmount={successModal.amountPaid}
          paymentId={successModal.paymentId} orderId={successModal.razorpayOrderId}
          appointmentId={successModal.appointmentId} paymentMethod="online"
          patientName={authUser?.name || "—"} reason={consultationReason}
          onGoToAppointments={() => navigate("/my-appointments")} />
      )}

      <div className="min-h-screen bg-[#eef2fb]">
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 pt-16 pb-8 px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="mx-auto max-w-6xl">
            <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-blue-100 hover:text-white transition">
              <FaArrowLeft className="text-[10px]" /> Back
            </button>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white">
                  <FaUserMd className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Appointment Booking</p>
                  <h1 className="text-xl font-extrabold text-white sm:text-2xl lg:text-3xl">
                    {doctorName ? `Dr. ${doctorName}` : "Select a Doctor"}
                  </h1>
                </div>
              </div>
              {authUser && (
                <div className="flex items-center gap-2.5 rounded-2xl bg-white/15 backdrop-blur px-3 py-2 border border-white/20">
                  <FaUserCircle className="text-2xl text-white/80" />
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">{authUser.name}</p>
                    <p className="text-[11px] text-blue-200">{authUser.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl xl:max-w-screen-2xl px-4 pb-12 sm:px-6 lg:px-8 xl:px-10 mt-4">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
            <div className="flex flex-col gap-4 lg:col-span-2">
              <StepCard step={1} icon={<FaCalendarAlt />} title="Select Date">
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {dateItems.map((item, index) => (
                    <button key={item.date} onClick={() => handleDateSelect(index)} className={`rounded-xl border py-2.5 text-center transition-all duration-200 cursor-pointer
                        ${selectedDateIndex === index ? "border-blue-500 bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"}`}>
                      <p className={`text-[9px] font-bold uppercase tracking-wider ${selectedDateIndex === index ? "text-blue-100" : "text-slate-400"}`}>
                        {item.day.slice(0, 3)}
                      </p>
                      <p className={`mt-0.5 text-[11px] font-extrabold ${selectedDateIndex === index ? "text-white" : "text-slate-800"}`}>
                        {new Date(item.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}
                      </p>
                    </button>
                  ))}
                </div>
              </StepCard>
              <StepCard step={2} icon={<MdOutlineAccessTime />} title="Select Time Slot">
                {slotsLoading && (
                  <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sky-200 bg-sky-50">
                    <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-sky-500 border-t-transparent" />
                    <p className="text-xs font-semibold text-blue-500">Fetching available slots…</p>
                  </div>
                )}
                {!slotsLoading && slotsError && (
                  <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-red-200 bg-red-50">
                    <p className="text-sm font-semibold text-red-500">Failed to load slots.</p>
                    <button
                      onClick={() => dispatch(fetchSlotsForDate({ doctorId: doctorId!, date: dateItems[selectedDateIndex].date }))}
                      className="rounded-lg bg-red-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-600"
                    >Retry</button>
                  </div>
                )}
                {!slotsLoading && !slotsError && slots.length === 0 && (
                  <div className="flex h-28 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50">
                    <p className="text-sm font-semibold text-slate-500">No slots on <span className="text-slate-700">{selectedDateItem?.day}</span></p>
                    <p className="text-xs text-slate-400">Doctor may be on leave or has no schedule.</p>
                  </div>
                )}
                {!slotsLoading && !slotsError && slots.length > 0 && (
                  <>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
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
                        const isBooked = slotStatus === "booked" || slotStatus === "confirmed" || slotStatus === "accepted" || slotStatus === "completed" || Boolean(slot.appointment_id);
                        const isBlocked = slotStatus === "blocked" || slotStatus === "pending_payment";
                        const isUnavailable = !isBooked && !isBlocked && (slotStatus === "unavailable" || slot.is_available === false);
                        const isDisabled = isBooked || isBlocked || isUnavailable;
                        const label = isBooked ? "Booked" : isBlocked ? "Blocked" : isUnavailable ? "Unavailable" : "";
                        return (
                          <div key={`${slot.start_time}-${slot.end_time}`} className="relative">
                            <button type="button" disabled={isDisabled} onClick={() => { if (!isDisabled) dispatch(setSelectedSlot(slot)); }}
                              className={`relative w-full cursor-pointer rounded-xl border py-2 text-xs font-bold transition-all duration-200
                                ${isBooked ? "cursor-not-allowed border-red-200 bg-red-50 text-red-300 line-through"
                                  : isBlocked ? "cursor-not-allowed border-amber-200 bg-amber-50 text-amber-300"
                                    : isUnavailable ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                                      : isSelected ? "border-blue-500 bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200"
                                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-500 hover:text-white hover:shadow-sm"}`}>
                              {formatTime(slot.start_time)}
                              {isDisabled && (
                                <span className="absolute -top-1.5 right-0.5 rounded-full bg-white px-1 py-px text-[8px] font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
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
                  <div className="mb-3 flex gap-3 overflow-x-auto rounded-xl bg-slate-50 border border-slate-100 p-3 scrollbar-hide">
                    <InfoField label="Patient Name" value={authUser.name} />
                    <InfoField label="Email" value={authUser.email} />
                    {authUser.phone_number && <InfoField label="Phone" value={authUser.phone_number} />}
                    {authUser.gender && <InfoField label="Gender" value={authUser.gender} />}
                  </div>
                )}
                <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-white px-4 py-3 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                  <FaRegFileAlt className="mt-1 shrink-0 text-sm text-slate-300" />
                  <textarea rows={3} value={consultationReason} onChange={(e) => dispatch(setConsultationReason(e.target.value))}
                    placeholder="Describe your symptoms or reason (optional)" className="w-full resize-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300" />
                </div>
              </StepCard>
            </div>
            <div className="lg:sticky lg:top-20 lg:h-fit">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-100 mb-0.5">Booking Summary</p>
                  <p className="text-2xl font-extrabold text-white">₹{totalAmount.toFixed(2)}</p>
                  <p className="text-xs text-blue-200 mt-0.5">Video Consultation</p>
                </div>

                <div className="p-4 space-y-4">
                  <div className="space-y-2.5">
                    <SummaryRow label="Date" value={selectedDateItem ? `${selectedDateItem.day}, ${new Date(selectedDateItem.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}` : "—"} />
                    <SummaryRow label="Time" value={selectedSlot ? `${formatTime(selectedSlot.start_time)} — ${formatTime(selectedSlot.end_time)}` : "—"} />
                    <SummaryRow label="Doctor" value={doctorName ? `Dr. ${doctorName}` : "—"} />
                    <SummaryRow label="Patient" value={authUser?.name || "—"} />
                    <SummaryRow label="Type" value="Video Call" />
                  </div>
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <PaymentRow label="Consultation Fee" amount={doctorFee} />
                    <PaymentRow label="Platform Fee" amount={0} />
                    <PaymentRow label="GST (0%)" amount={0} />
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-1">
                      <span className="text-sm font-extrabold text-slate-800">Total</span>
                      <span className="text-xl font-extrabold text-blue-600">₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <p className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs font-medium text-emerald-700">
                    ✓ No platform fee or GST for online payments.
                  </p>
                  <div className="border-t border-slate-100" />
                  <button onClick={handleConfirm} disabled={!selectedSlot || isLoading} className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        {bookingLoading ? "Booking…" : "Creating order…"}
                      </>
                    ) : (
                      <>
                        <SiRazorpay className="text-base" />
                        Pay ₹{totalAmount.toFixed(2)} via Razorpay
                      </>
                    )}
                  </button>
                  <div className="flex items-center justify-center gap-1.5">
                    <FaLock className="text-[9px] text-slate-300" />
                    <p className="text-[11px] text-slate-400">256-bit SSL secured & encrypted</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

const StepCard = ({ step, icon, title, children }: {
  step: number; icon: React.ReactNode; title: string; children: React.ReactNode
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-extrabold text-white shadow-md shadow-blue-200">
        {step}
      </div>
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <span className="text-blue-400">{icon}</span>{title}
      </h2>
    </div>
    {children}
  </div>
);

const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-[120px] shrink-0">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-0.5 text-xs font-semibold text-slate-700 truncate">{value}</p>
  </div>
);

const SummaryRow = ({ label, value }: SummaryRowProps) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-xs text-slate-400 shrink-0">{label}</span>
    <span className="text-right text-xs font-semibold text-slate-700">{value}</span>
  </div>
);

const PaymentRow = ({ label, amount }: PaymentRowProps) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-slate-400">{label}</span>
    <span className="text-xs font-semibold text-slate-700">₹{amount.toFixed(2)}</span>
  </div>
);