import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaCopy, FaDownload, FaVideo, FaHospital, } from "react-icons/fa";
import { SiRazorpay } from "react-icons/si";
import { MdReceipt } from "react-icons/md";
import toast from "react-hot-toast";
import API from "../../api/axios";
import type { AppointmentDetail } from "../../types/patient";
import type { PaymentDetail, TimelineStep } from "../../types/patient";
import type {InfoRowProps} from '../../types/common';
import usePageTitle from "../../hooks/usePageTitle";

export const TransactionDetails = () => {
  usePageTitle("Transaction Details");
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const location = useLocation();

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navState = location.state as {
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    amount?: number;
  } | null;

  const authUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
      return;
    }
    fetchDetails();
  }, [appointmentId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const apptRes = await API.get(`/appointments/${appointmentId}`);
      const apptData = apptRes.data?.appointment || apptRes.data?.data || apptRes.data;
      setAppointment(apptData);
      const payRes = await API.get(`/payments/appointment/${appointmentId}`);
      const payData = payRes.data?.payment || payRes.data?.data || payRes.data;
      setPayment(payData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load transaction details");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied!`);
    });
  };

  const formatTime = (time: string) =>
    new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const isSuccess =
    payment?.status === "paid" || navState?.razorpay_payment_id !== undefined;

  const paymentId = navState?.razorpay_payment_id || payment?.razorpay_payment_id || "—";
  const orderId = navState?.razorpay_order_id || payment?.razorpay_order_id || "—";
  const amountPaid = navState?.amount || (payment ? Number(payment.amount) : 0);
  const appointmentFee = Number(appointment?.doctor?.consultation_fee || amountPaid);
  const platformFee = 0;
  const tax = 0;
  const totalAmount = appointmentFee + platformFee + tax;
  const createdAt = payment?.created_at ? formatDateTime(payment.created_at) : formatDateTime(new Date().toISOString());
  const updatedAt = payment?.updated_at ? formatDateTime(payment.updated_at) : formatDateTime(new Date().toISOString());

  const timeline: TimelineStep[] = [
    { label: "Payment Initiated", time: createdAt, done: true },
    { label: "Payment Processing", time: createdAt, done: true },
    { label: "Payment Successful", time: updatedAt, done: isSuccess },
    { label: "Receipt Generated", time: updatedAt, done: isSuccess },
  ];

  const handleDownloadReceipt = async() => {
    const { default: jsPDF } = await import("jspdf"); 
    const doc = new jsPDF();
    const receiptNo = paymentId !== "—" ? paymentId : `HP-${Date.now()}`;

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
    doc.setFontSize(18);
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
    row("Payment Status", isSuccess ? "Successful" : "Pending");
    row("Payment ID", paymentId);
    row("Order ID", orderId);
    row("Payment Method", "Razorpay");
    row("Amount Paid", `Rs. ${amountPaid.toFixed(2)}`);
    row("Transaction Date", createdAt);

    y += 6;
    sectionTitle("Appointment Details");
    row("Patient Name", authUser?.name || "—");
    row("Doctor Name", `Dr. ${appointment?.doctor?.user?.name || "—"}`);
    row("Appointment Date", appointment ? formatDate(appointment.appointment_date) : "—");
    row("Appointment Time", appointment ? formatTime(appointment.start_time) : "—");
    row("Consultation Type", appointment?.consultation_type || "—");
    row("Reason", appointment?.reason || "Not specified");

    y += 6;
    sectionTitle("Fee Summary");
    row("Appointment Fee", `Rs. ${appointmentFee.toFixed(2)}`);
    row("Platform Fee", `Rs. ${platformFee.toFixed(2)}`);
    row("Tax", `Rs. ${tax.toFixed(2)}`);

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
    doc.text(
      isSuccess ? "Payment completed successfully. Thank you for using HealPoint." : "Payment is pending.",
      20,
      y + 10
    );

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.save(`HealPoint_Receipt_${receiptNo}.pdf`);
    toast.success("PDF receipt downloaded!");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4fb]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl shadow-sky-100">
          <FaTimesCircle className="mx-auto mb-4 text-5xl text-red-400" />
          <h2 className="text-lg font-extrabold text-slate-800">Failed to load details</h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <div className="mt-6 flex gap-3">
            <button onClick={() => navigate(-1)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
              Go Back
            </button>
            <button onClick={fetchDetails} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pt-28">
      <div className="mx-auto max-w-5xl">
        <button onClick={() => navigate("/my-appointments")} className="mb-5 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50">
          <FaArrowLeft /> Back to Appointments
        </button>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <MdReceipt className="text-xl text-blue-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Transaction Details</h1>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-md shadow-sky-100">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${isSuccess ? "bg-emerald-100" : "bg-red-100"}`}>
              {isSuccess ? (
                <FaCheckCircle className="text-3xl text-emerald-500" />
              ) : (
                <FaTimesCircle className="text-3xl text-red-400" />
              )}
            </div>
            <div>
              <h2 className={`text-xl font-extrabold ${isSuccess ? "text-emerald-600" : "text-red-500"}`}>
                {isSuccess ? "Payment Successful!" : "Payment Pending"}
              </h2>
              <p className="mt-0.5 text-sm text-slate-400">
                {isSuccess ? "Your payment has been processed successfully" : "Payment is being processed"}
              </p>
              <p className="text-sm text-slate-400">Thank you for your payment</p>
            </div>
          </div>
          <button onClick={handleDownloadReceipt} className="flex items-center cursor-pointer gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-600 transition hover:bg-blue-100">
            <FaDownload />
            Download Receipt
          </button>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-6 shadow-md shadow-sky-100">
          <h3 className="mb-6 flex items-center gap-2 text-base font-extrabold text-slate-800">
            <MdReceipt className="text-blue-500" />
            Payment Timeline
          </h3>
          <div className="relative">
            <div className="absolute top-5 hidden h-0.5 bg-emerald-200 sm:block" style={{ left: "40px", right: "40px" }}/>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {timeline.map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-2 text-center">
                  <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${step.done ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-white"}`}>
                    {step.done ? (
                      <FaCheckCircle className="text-base text-white" />
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-slate-300" />
                    )}
                  </div>
                  <p className={`text-xs font-bold ${step.done ? "text-emerald-600" : "text-slate-400"}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-slate-400">{step.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-md shadow-sky-100">
            <h3 className="mb-5 flex items-center gap-2 text-base font-extrabold text-slate-800">
              <MdReceipt className="text-blue-500" />
              Transaction Information
            </h3>
            <div className="space-y-4">
              <InfoRow label="Transaction ID" value={paymentId} canCopy onCopy={() => copyToClipboard(paymentId, "Transaction ID")} />
              <InfoRow label="Payment ID" value={paymentId} canCopy onCopy={() => copyToClipboard(paymentId, "Payment ID")} />
              <InfoRow label="Order ID" value={orderId} canCopy onCopy={() => copyToClipboard(orderId, "Order ID")} />
              <InfoRow label="Payment Status" value="" badge={
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${isSuccess ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {isSuccess ? "Successful" : "Pending"}
                  </span>
                }
              />
              <InfoRow label="Payment Method" value="Razorpay (UPI)" />
              <InfoRow label="Amount Paid" value={`₹${amountPaid.toFixed(2)}`} highlight />
              <InfoRow label="Transaction Date" value={payment?.created_at ? formatDateTime(payment.created_at) : formatDateTime(new Date().toISOString())} />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl bg-white p-6 shadow-md shadow-sky-100">
              <h3 className="mb-5 flex items-center gap-2 text-base font-extrabold text-slate-800">
                <MdReceipt className="text-blue-500" />
                Payment Summary
              </h3>
              <div className="space-y-3">
                <SummaryFeeRow label="Appointment Fee" amount={appointmentFee} />
                <SummaryFeeRow label="Platform Fee" amount={platformFee} />
                <SummaryFeeRow label="Tax (0%)" amount={tax} />
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-900">Total Amount</span>
                    <span className="text-xl font-extrabold text-emerald-600">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md shadow-sky-100">
              <h3 className="mb-5 flex items-center gap-2 text-base font-extrabold text-slate-800">
                <FaHospital className="text-blue-500" />
                Appointment Details
              </h3>
              <div className="space-y-4">
                <InfoRow label="Patient Name" value={authUser?.name || "—"} />
                <InfoRow label="Doctor" value={appointment?.doctor?.user?.name ? `Dr. ${appointment.doctor.user.name}` : "—"} />
                <InfoRow label="Date & Time" value={appointment ? `${formatDate(appointment.appointment_date)}, ${formatTime(appointment.start_time)}` : "—"} />
                <InfoRow label="Type" value=""
                  badge={
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${appointment?.consultation_type === "Video Call" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {appointment?.consultation_type === "Video Call" ? (
                        <FaVideo className="text-xs" />
                      ) : (
                        <FaHospital className="text-xs" />
                      )}
                      {appointment?.consultation_type || "—"}
                    </span>
                  }
                />
                <InfoRow label="Problem" value={appointment?.reason || "Not specified"} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#072654]">
              <SiRazorpay className="text-base text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">This is a secure transaction processed by Razorpay</p>
              <p className="text-xs text-slate-400">If you have any questions, please contact our support team.</p>
            </div>
          </div>
          <SiRazorpay className="text-2xl text-[#072654]" />
        </div>

      </div>
    </div>
  );
};

const InfoRow = ({ label, value, canCopy, onCopy, highlight, badge }: InfoRowProps) => (
  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
    <span className="shrink-0 text-sm text-slate-400">{label}</span>
    <div className="flex items-center gap-2">
      {badge ? (
        badge
      ) : (
        <span className={`text-right text-sm font-semibold ${highlight ? "text-emerald-600" : "text-slate-700"}`}>
          {value}
        </span>
      )}
      {canCopy && value !== "—" && (
        <button onClick={onCopy} className="text-slate-300 transition hover:text-blue-500" title="Copy">
          <FaCopy className="text-xs" />
        </button>
      )}
    </div>
  </div>
);

const SummaryFeeRow = ({ label, amount }: { label: string; amount: number }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="font-semibold text-slate-700">₹{amount.toFixed(2)}</span>
  </div>
);