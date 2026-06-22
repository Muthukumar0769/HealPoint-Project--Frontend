import { useState, useRef, useEffect } from "react";
import { FaCalendarAlt, FaSave, FaUmbrellaBeach, FaClock, FaCheckCircle, FaChevronDown,
  FaRegCalendarAlt, FaStar,} from "react-icons/fa";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { createAvailability, createSpecialAvailability, createUnavailability, } from "../../store/slices/DoctorScheduleSlice";
import { DoctorSidebar } from "../Doctor/DoctorSidebar";
import usePageTitle from "../../hooks/usePageTitle";

type LeaveType = "full_day" | "half_day";
type MainTab = "Weekly" | "Special" | "Leave";

type OptionType = {
  label: string;
  value: string;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",];
const DURATIONS = ["15", "30", "45", "60"];
const LEAVE_TYPES: OptionType[] = [
  { label: "Full Day", value: "full_day" },
  { label: "Half Day", value: "half_day" },
];

export const DoctorSchedule = () => {
  usePageTitle("My Schedule");
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.doctorSchedule);
  const [activeTab, setActiveTab] = useState<MainTab>("Weekly");
  const [day, setDay] = useState("");
  const [scheduleStartTime, setScheduleStartTime] = useState("");
  const [scheduleEndTime, setScheduleEndTime] = useState("");
  const [breakStart, setBreakStart] = useState("");
  const [breakEnd, setBreakEnd] = useState("");
  const [duration, setDuration] = useState("15");
  const [specialDate, setSpecialDate] = useState("");
  const [specialStartTime, setSpecialStartTime] = useState("");
  const [specialEndTime, setSpecialEndTime] = useState("");
  const [specialDuration, setSpecialDuration] = useState("15");
  const [leaveFrom, setLeaveFrom] = useState("");
  const [leaveTo, setLeaveTo] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveType>("full_day");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [reason, setReason] = useState("");

  const dayOptions: OptionType[] = DAYS.map((d) => ({ label: d, value: d }));
  const durationOptions: OptionType[] = DURATIONS.map((t) => ({
    label: `${t} Minutes`,
    value: t,
  }));

  const saveSchedule = async () => {
    if (!day) return toast.error("Please select day");
    if (!scheduleStartTime || !scheduleEndTime)
      return toast.error("Select start and end time");
    if (scheduleStartTime >= scheduleEndTime)
      return toast.error("Start time must be before end time");
    if (breakStart && breakEnd && breakStart >= breakEnd)
      return toast.error("Break start must be before break end");

    try {
      await dispatch(
        createAvailability({
          day_of_week: day,
          start_time: scheduleStartTime,
          end_time: scheduleEndTime,
          slot_duration: Number(duration),
          break_start: breakStart || null,
          break_end: breakEnd || null,
        })
      ).unwrap();
      toast.success("Schedule saved successfully");
      setDay("");
      setScheduleStartTime("");
      setScheduleEndTime("");
      setDuration("15");
      setBreakStart("");
      setBreakEnd("");
    } catch (error: any) {
      toast.error(error || "Schedule save failed");
    }
  };

  const saveSpecialSchedule = async () => {
    if (!specialDate) return toast.error("Please select date");
    if (!specialStartTime || !specialEndTime)
      return toast.error("Select start and end time");
    if (specialStartTime >= specialEndTime)
      return toast.error("Start time must be before end time");

    try {
      await dispatch(createSpecialAvailability({
        date: specialDate,
        start_time: specialStartTime,
        end_time: specialEndTime,
        slot_duration: Number(specialDuration),
      })
      ).unwrap();
      toast.success("Special schedule saved");
      setSpecialDate("");
      setSpecialStartTime("");
      setSpecialEndTime("");
      setSpecialDuration("15");
    } catch (error: any) {
      toast.error(error || "Failed to save special schedule");
    }
  };

  const applyLeave = async () => {
    if (!leaveFrom || !leaveTo) return toast.error("Select leave dates");
    if (new Date(leaveFrom) > new Date(leaveTo))
      return toast.error("From date cannot be after To date");
    if (!reason.trim()) return toast.error("Please enter leave reason");
    if (leaveType === "half_day" && (!leaveStart || !leaveEnd))
      return toast.error("Select leave start and end time");
    if (leaveType === "half_day" && leaveStart >= leaveEnd)
      return toast.error("Start time must be before end time");

    try {
      const start = new Date(leaveFrom);
      const end = new Date(leaveTo);
      const requests = [];

      for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
      ) {
        const formattedDate = date.toISOString().split("T")[0];
        requests.push({
          unavailable_date: formattedDate,
          reason,
          is_full_day: leaveType === "full_day",
          start_time: leaveType === "half_day" ? leaveStart : null,
          end_time: leaveType === "half_day" ? leaveEnd : null,
        });
      }
      await dispatch(createUnavailability(requests)).unwrap();
      toast.success("Leave applied successfully");
      setLeaveFrom("");
      setLeaveTo("");
      setLeaveType("full_day");
      setLeaveStart("");
      setLeaveEnd("");
      setReason("");
    } catch (error: any) {
      toast.error(error || "Leave apply failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <DoctorSidebar />
      <main className="flex-1 px-6 py-20 lg:px-10">
        <div className="mb-10">
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            Schedule <span className="text-blue-600">Management</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage consultation timings, special schedules and leave.
          </p>
        </div>

        <section className="overflow-visible rounded-[30px] bg-white shadow-xl shadow-slate-200/60">
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 px-8 py-7 rounded-t-[30px]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl text-white backdrop-blur-md">
                  {activeTab === "Leave" ? (
                    <FaUmbrellaBeach />
                  ) : (
                    <FaCalendarAlt />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {activeTab === "Weekly" && "Weekly Schedule"}
                    {activeTab === "Special" && "Special Schedule"}
                    {activeTab === "Leave" && "Apply Leave"}
                  </h2>
                  <p className="mt-1 text-sm text-blue-100">
                    {activeTab === "Weekly" && "Set recurring weekly consultation timings"}
                    {activeTab === "Special" && "Set one-time special availability"}
                    {activeTab === "Leave" && "Manage doctor leave availability"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/10 p-2 backdrop-blur-md">
                {[
                  { key: "Weekly", label: "Weekly", icon: <FaCalendarAlt /> },
                  { key: "Special", label: "Special", icon: <FaStar /> },
                  { key: "Leave", label: "Leave", icon: <FaUmbrellaBeach /> },
                ].map((tab) => (
                  <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key as MainTab)}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200 ${activeTab === tab.key ? tab.key === "Leave"
                      ? "bg-white text-red-500 shadow-lg" : "bg-white text-blue-600 shadow-lg"
                      : "text-white hover:bg-white/10"}`}>
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-visible p-8">
            {activeTab === "Weekly" && (
              <div>
                <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
                  <p className="text-sm font-semibold text-blue-700">
                    Weekly recurring schedule will repeat every week. Saving a
                    new schedule for the same day will replace the existing one.
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <CustomDropdown label="Select Day" value={day} onChange={setDay} color="blue"
                    placeholder="Choose Day" options={dayOptions} />
                  <TimeInput label="Start Time" value={scheduleStartTime} onChange={setScheduleStartTime} color="blue" />
                  <TimeInput label="End Time" value={scheduleEndTime} onChange={setScheduleEndTime} color="blue" />
                  <CustomDropdown label="Slot Duration" value={duration} onChange={setDuration} color="blue"
                    placeholder="Select Duration" options={durationOptions} />
                </div>
                <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-5">
                  <p className="mb-4 text-sm font-bold text-amber-700">
                    Break Time (Optional) — slots will not be generated during this period
                  </p>
                  <div className="grid gap-6 md:grid-cols-2">
                    <TimeInput label="Break Start" value={breakStart} onChange={setBreakStart} color="blue" />
                    <TimeInput label="Break End" value={breakEnd} onChange={setBreakEnd} color="blue" />
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button type="button" onClick={saveSchedule} disabled={loading}
                    className="flex h-12 cursor-pointer items-center gap-3 rounded-2xl bg-blue-600 px-8 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:scale-[1.02] hover:bg-blue-700 disabled:opacity-60">
                    <FaSave />
                    {loading ? "Saving..." : "Save Schedule"}
                  </button>
                </div>
              </div>
            )}
            {activeTab === "Special" && (
              <div>
                <div className="mb-8 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
                  <p className="text-sm font-semibold text-amber-700">
                    Special schedule overrides normal schedule for the selected
                    date. Use this for extended or reduced hours on a specific
                    day.
                  </p>
                </div>
                <div className="mb-8 rounded-3xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white shadow-lg shadow-blue-200">
                      <FaRegCalendarAlt />
                    </div>
                    <div className="flex-1">
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Select Date
                      </label>
                      <input type="date" value={specialDate} onChange={(e) => setSpecialDate(e.target.value)}
                        className="h-12 w-full max-w-sm rounded-2xl border border-blue-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                    </div>
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  <TimeInput label="Start Time" value={specialStartTime} onChange={setSpecialStartTime} color="blue" />
                  <TimeInput label="End Time" value={specialEndTime} onChange={setSpecialEndTime} color="blue" />
                  <CustomDropdown label="Slot Duration" value={specialDuration} onChange={setSpecialDuration} color="blue"
                    placeholder="Select Duration"
                    options={durationOptions} />
                </div>
                <div className="mt-8 flex justify-end">
                  <button type="button" onClick={saveSpecialSchedule} disabled={loading}
                    className="flex h-12 cursor-pointer items-center gap-3 rounded-2xl bg-blue-600 px-8 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:scale-[1.02] hover:bg-blue-700 disabled:opacity-60">
                    <FaSave />
                    {loading ? "Saving..." : "Save Special Schedule"}
                  </button>
                </div>
              </div>
            )}
            {activeTab === "Leave" && (
              <div>
                <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
                  <p className="text-sm font-semibold text-red-700">
                    Leave schedule will override doctor availability. All slots
                    on leave dates will be marked unavailable for patients.
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <DateInput label="Leave From" value={leaveFrom} onChange={setLeaveFrom}
                    color="red" />
                  <DateInput label="Leave To" value={leaveTo} onChange={setLeaveTo}
                    color="red" />
                  <CustomDropdown label="Leave Type" value={leaveType} onChange={(value) => setLeaveType(value as LeaveType)}
                    color="red"
                    placeholder="Select Type"
                    options={LEAVE_TYPES} />
                  {leaveType === "half_day" ? (
                    <TimeInput label="Start Time" value={leaveStart} onChange={setLeaveStart} color="red" />
                  ) : (
                    <div />
                  )}
                </div>

                {leaveType === "half_day" && (
                  <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <TimeInput label="End Time" value={leaveEnd} onChange={setLeaveEnd} color="red" />
                  </div>
                )}

                <div className="mt-6">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Leave Reason
                  </label>
                  <textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter leave reason..."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100" />
                </div>

                <div className="mt-8 flex justify-end">
                  <button type="button" onClick={applyLeave} disabled={loading}
                    className="flex h-12 cursor-pointer items-center gap-3 rounded-2xl bg-red-500 px-8 text-sm font-bold text-white shadow-lg shadow-red-200 transition-all duration-200 hover:scale-[1.02] hover:bg-red-600 disabled:opacity-60">
                    <FaUmbrellaBeach />
                    {loading ? "Applying..." : "Apply Leave"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

const CustomDropdown = ({ label, value, onChange, color, options, placeholder, }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  color: "blue" | "red";
  options: OptionType[];
  placeholder: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedLabel = options.find((item) => item.value === value)?.label || "";

  return (
    <div ref={ref} className="relative z-50 overflow-visible">
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>
      <button type="button" onClick={() => setOpen(!open)} className={`flex h-12 w-full items-center justify-between rounded-2xl border bg-slate-50 px-4 text-sm font-semibold shadow-sm transition-all duration-200 ${open ? color === "blue" ? "border-blue-400 bg-white ring-4 ring-blue-100"
        : "border-red-400 bg-white ring-4 ring-red-100"
        : "border-slate-200 hover:border-slate-300 hover:bg-white"
        }`}>
        <span className={value ? "text-slate-800" : "text-slate-400"}>
          {value ? selectedLabel : placeholder}
        </span>
        <FaChevronDown className={`text-xs transition-all duration-300 ${open ? "rotate-180 text-slate-700" : "text-slate-400"
          }`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 z-[9999] w-full rounded-2xl border border-slate-100 bg-white shadow-2xl">
          <div className={`h-1 ${color === "blue" ? "bg-blue-500" : "bg-red-500"}`} />
          <div className="max-h-60 overflow-y-auto p-2">
            {options.map((item) => {
              const isSelected = value === item.value;
              return (
                <button key={item.value} type="button" onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${isSelected ? color === "blue" ? "bg-blue-600 text-white" : "bg-red-500 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                    }`}>
                  <span>{item.label}</span>
                  {isSelected && <FaCheckCircle className="text-xs" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const DateInput = ({ label, value, onChange, color, }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  color: "blue" | "red";
}) => (
  <div>
    <label className="mb-2 block text-sm font-bold text-slate-700">
      {label}
    </label>
    <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
      className={`h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all duration-200 ${color === "blue" ? "focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
        : "focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
        }`} />
  </div>
);

const TimeInput = ({ label, value, onChange, color, }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  color: "blue" | "red";
}) => (
  <div>
    <label className="mb-2 block text-sm font-bold text-slate-700">
      {label}
    </label>
    <div className="relative">
      <FaClock className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
      <input type="time" value={value} onChange={(e) => onChange(e.target.value)}
        className={`h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all duration-200 ${color === "blue" ? "focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
          : "focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
          }`} />
    </div>
  </div>
);