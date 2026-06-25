import { useState } from "react";
import API from "../../api/axios";
import type { ReviewModalProps } from "../../types/common";

//----Stars Generation logic----------

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => onChange(star)}
                    onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
                    className="text-3xl transition-transform duration-100 hover:scale-110 cursor-pointer bg-transparent border-none outline-none"
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}>
                    <span className={(hovered || value) >= star ? "text-blue-500" : "text-slate-200"}>★</span>
                </button>
            ))}
        </div>
    );
};

const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

//----Main Component-------------

export const ReviewModal = ({ appointmentId, doctorName, onClose, onSubmitted }: ReviewModalProps) => {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

//------Review submit logic----------

    const handleSubmit = async () => {
        if (rating === 0) {
            showToast("error", "Please select a star rating before submitting.");
            return;
        }
        setLoading(true);
        try {
            await API.post("/reviews/add", {
                appointmentId: appointmentId,   
                rating,
                ...(review.trim() && { review: review.trim() }),
            });
            showToast("success", "Review submitted successfully!");
            setTimeout(() => {
                onSubmitted?.();
                onClose();
            }, 1800);
        } catch (err: any) {
            showToast("error", err?.response?.data?.message ?? "Failed to submit review.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
            {toast && (
                <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-bold shadow-lg transition-all duration-300 ${toast.type === "success" ? "bg-blue-600 text-white" : "bg-red-500 text-white"}`}>
                    <span>{toast.type === "success" ? "✓" : "✕"}</span>
                    {toast.msg}
                </div>
            )}

            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
                <div className="bg-blue-600 px-6 py-5 flex items-center justify-between">
                    <div>
                        <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest mb-0.5">Consultation Completed</p>
                        <h2 className="text-white text-lg font-extrabold leading-tight">Rate Dr. {doctorName}</h2>
                    </div>
                    <button onClick={onClose}
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-400 transition cursor-pointer border-none"
                        aria-label="Close">✕</button>
                </div>

                <div className="px-6 py-6 flex flex-col gap-5">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <p className="text-sm text-slate-500 font-medium">How was your experience?</p>
                        <StarRating value={rating} onChange={setRating} />
                        <p className={`text-sm font-bold transition-colors duration-200 ${rating > 0 ? "text-blue-600" : "text-transparent"}`}>
                            {LABELS[rating] || "·"}
                        </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Your feedback <span className="text-slate-300 font-normal normal-case">(optional)</span>
                        </label>
                        <textarea rows={4} value={review} onChange={(e) => setReview(e.target.value)}
                            placeholder="Share your experience with Dr. and help others make better decisions..."
                            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                            maxLength={500} />
                        <p className="text-right text-xs text-slate-300">{review.length}/500</p>
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button onClick={onClose} disabled={loading}
                            className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50">
                            Skip
                        </button>
                        <button onClick={handleSubmit} disabled={loading || rating === 0}
                            className="h-11 flex-1 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 active:scale-[0.98] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {loading ? (
                                <>
                                    <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                                    Submitting…
                                </>
                            ) : "Submit Review"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};