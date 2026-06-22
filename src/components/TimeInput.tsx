import { FaClock } from "react-icons/fa";

type Props = {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
};

export const TimeInput = ({
  label,
  value,
  onChange,
}: Props) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <FaClock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="time" value={value} onChange={(e) =>
            onChange(e.target.value)}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"/>
      </div>
    </div>
  );
};