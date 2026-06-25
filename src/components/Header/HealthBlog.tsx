import { useNavigate } from "react-router-dom";
import type { BlogPost } from "../../types/patient";

const blogPosts: BlogPost[] = [
  {
    id: 1,
    category: "Heart Health",
    categoryColor: "bg-red-50 text-red-600",
    title: "5 Simple Habit to Keep Your Heart Healthy Every Day",
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
      "Managing diabetes start with understanding your numbers. Learn what fasting glucose, HbA1c, and post-meal readings mean for your long-term health.",
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
      "Chronic stress affect your immune system, sleep, and heart. These evidence-based techniques help you build resilience without overhauling your lifestyle.",
    readTime: "3 min read",
    date: "5 Jun 2025",
    emoji: "🧠",
    bgColor: "bg-violet-50",
  },
];

const BlogCard = ({ post }: { post: BlogPost }) => {
  return (
    <div className="flex flex-col rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group">
      <div className={`${post.bgColor} h-28 flex items-center justify-center`}>
         <span className="text-5xl">{post.emoji}</span>
      </div>
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${post.categoryColor}`}>
            {post.category}
          </span>
          <span className="text-xs text-slate-400">{post.readTime}</span>
        </div>

        <h3 className="text-xs font-bold text-slate-800 leading-snug mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {post.title}
        </h3>

        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex-1">
          {post.excerpt}
        </p>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">{post.date}</span>
        </div>
      </div>
    </div>
  );
};

export const HealthBlog = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-white px-5 py-9 md:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-7">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1.5">
              Health Tips
            </p>
            <h2 className="text-xl font-bold text-[#0d1b5e] leading-snug sm:text-2xl">
              Stay Informed, <span className="font-extrabold">Stay Healthy</span>
            </h2>
            <p className="mt-1.5 text-xs text-slate-500">
              Expert-written articles to help you and your family live better.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {blogPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
        <div className="mt-7 rounded-2xl bg-[#f0f4fb] px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#0d1b5e] sm:text-sm">
              Have a health concern?
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Our doctors are ready to help you today.
            </p>
          </div>
          <button onClick={() => navigate("/doctors")} className="shrink-0 bg-blue-600 text-white text-xs font-semibold px-5 py-2 rounded-xl hover:bg-blue-700 transition-colors">
            Book Appointment
          </button>
        </div>

      </div>
    </section>
  );
};