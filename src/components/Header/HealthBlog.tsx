import { useNavigate } from "react-router-dom";
import type { BlogPost } from "../../types/patient";

const blogPosts: BlogPost[] = [
  {
    id: 1,
    category: "Heart Health",
    categoryColor: "bg-red-50 text-red-600",
    title: "5 Simple Habits to Keep Your Heart Healthy Every Day",
    excerpt:
      "Small daily changes — like a 30-minute walk, cutting added sugar, and sleeping 7 hours — can significantly reduce your risk of heart disease over time.",
    readTime: "4 min read",
    date: "18 Jun 2025",
    emoji: "🫀",
    bgColor: "bg-red-50",
  },
  {
    id: 2,
    category: "Diabetes Care",
    categoryColor: "bg-amber-50 text-amber-600",
    title: "Understanding Blood Sugar: What Every Patient Should Know",
    excerpt:
      "Managing diabetes starts with understanding your numbers. Learn what fasting glucose, HbA1c, and post-meal readings mean for your long-term health.",
    readTime: "5 min read",
    date: "12 Jun 2025",
    emoji: "🩸",
    bgColor: "bg-amber-50",
  },
  {
    id: 3,
    category: "Mental Wellness",
    categoryColor: "bg-violet-50 text-violet-600",
    title: "How to Manage Stress Before It Manages You",
    excerpt:
      "Chronic stress affects your immune system, sleep, and heart. These evidence-based techniques help you build resilience without overhauling your lifestyle.",
    readTime: "3 min read",
    date: "5 Jun 2025",
    emoji: "🧠",
    bgColor: "bg-violet-50",
  },
];

const BlogCard = ({ post }: { post: BlogPost }) => {
  return (
    <div className="flex flex-col rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group">
      <div className={`${post.bgColor} h-40 flex items-center justify-center`}>
        <span className="text-6xl">{post.emoji}</span>
      </div>
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${post.categoryColor}`}>
            {post.category}
          </span>
          <span className="text-xs text-slate-400">{post.readTime}</span>
        </div>

        <h3 className="text-sm font-bold text-slate-800 leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {post.title}
        </h3>

        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex-1">
          {post.excerpt}
        </p>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">{post.date}</span>
        </div>
      </div>
    </div>
  );
};

export const HealthBlog = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-white px-6 py-14 md:px-16 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-2">
              Health Tips
            </p>
            <h2 className="text-3xl font-bold text-[#0d1b5e] leading-snug">
              Stay Informed, <span className="font-extrabold">Stay Healthy</span>
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Expert-written articles to help you and your family live better.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
        <div className="mt-10 rounded-2xl bg-[#f0f4fb] px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#0d1b5e]">
              Have a health concern?
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Our doctors are ready to help you today.
            </p>
          </div>
          <button onClick={() => navigate("/doctors")} className="shrink-0 bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
            Book Appointment
          </button>
        </div>

      </div>
    </section>
  );
};