type Props = {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  options: string[];
};

export const SelectBox = ({
  label,
  value,
  onChange,
  options,
}: Props) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <select value={value} onChange={(e) =>
          onChange(e.target.value)
        }
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100">
        <option value="">
          Select {label}
        </option>

        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
};