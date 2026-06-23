import { useEffect, useState } from "react";
import { FaStar, FaStarHalf, FaRegStar } from "react-icons/fa6";
import { FaQuoteLeft } from "react-icons/fa";
import API from "../../api/axios";
import type { Review } from "../../types/patient";

const avatarColors = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-pink-500",
  "bg-amber-500",
  "bg-cyan-500",
];

const getAvatarColor = (name: string) =>
  avatarColors[name.charCodeAt(0) % avatarColors.length];

const StarDisplay = ({ rating, max = 5 }: { rating: number; max?: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: max }).map((_, i) => {
      const filled = i < Math.floor(rating);
      const half = !filled && i < rating;
      return filled ? (
        <FaStar key={i} className="text-yellow-400 text-sm" />
      ) : half ? (
        <FaStarHalf key={i} className="text-yellow-400 text-sm" />
      ) : (
        <FaRegStar key={i} className="text-slate-300 text-sm" />
      );
    })}
  </div>
);

const TestimonialCard = ({ review }: { review: Review }) => {
  const name = review.patientName || `Patient #${review.patient_id}`;
  const initial = name.charAt(0).toUpperCase();
  const avatarBg = getAvatarColor(name);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="flex flex-col justify-between rounded-2xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div>
        <FaQuoteLeft className="text-blue-100 text-3xl mb-4" />
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
          {review.review}
        </p>
      </div>
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full ${avatarBg} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
            {initial}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{name}</p>
            <p className="text-xs text-slate-400">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StarDisplay rating={review.rating} />
          <span className="text-xs font-bold text-yellow-500">{review.rating}/5</span>
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="rounded-2xl bg-white border border-slate-100 p-6 h-52 animate-pulse">
    <div className="h-4 bg-slate-100 rounded w-8 mb-4" />
    <div className="space-y-2 mb-6">
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-5/6" />
      <div className="h-3 bg-slate-100 rounded w-4/6" />
    </div>
    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
      <div className="h-10 w-10 rounded-full bg-slate-100" />
      <div className="flex-1">
        <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
        <div className="h-2 bg-slate-100 rounded w-1/3" />
      </div>
    </div>
  </div>
);

export const Testimonials = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await API.get("/reviews");
        if (res.data.success) {
          setReviews(res.data.data.rows);
        }
      } catch {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const displayReviews = reviews.filter((r) => r.review && r.review.trim() !== "").slice(0, 6);
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  if (!loading && displayReviews.length === 0) return null;

  return (
    <section className="bg-[#f0f4fb] px-6 py-14 md:px-16 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-2">
              Patient Reviews
            </p>
            <h2 className="text-3xl font-bold text-[#0d1b5e] leading-snug">
              What Our <span className="font-extrabold">Patients Say</span>
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Real experiences from people who trusted HealPoint for their care.
            </p>
          </div>

          {!loading && reviews.length > 0 && (
            <div className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100 w-fit shrink-0">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-[#0d1b5e] leading-none">
                  {avgRating.toFixed(1)}
                </p>
                <p className="text-xs text-slate-400 mt-1">out of 5</p>
              </div>
              <div className="border-l border-slate-100 pl-4">
                <StarDisplay rating={avgRating} />
                <p className="text-xs text-slate-500 mt-1">
                  {reviews.length} verified review{reviews.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? [1, 2, 3].map((i) => <SkeletonCard key={i} />)
            : displayReviews.map((review) => (
                <TestimonialCard key={review.id} review={review} />
              ))}
        </div>
      </div>
    </section>
  );
};