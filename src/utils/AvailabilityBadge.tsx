
import { FaCircle } from "react-icons/fa";

interface AvailabilityBadgeProps {
  isAvailable: boolean | null;
  isChecking?: boolean;
}

export const AvailabilityBadge = ({ isAvailable, isChecking = false }: AvailabilityBadgeProps) => {
  if (isChecking) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-400">
        <FaCircle className="animate-pulse text-[8px]" />
        Checking...
      </span>
    );
  }

  if (isAvailable === null) return null;
  return isAvailable ? (
    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
      <FaCircle className="text-[8px]" />
      Available
    </span>
  ) : (
    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-500">
      <FaCircle className="text-[8px]" />
      Unavailable
    </span>
  );
};