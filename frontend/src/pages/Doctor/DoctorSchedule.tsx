import { useState } from "react";
import {FaCalendarAlt,FaSave,FaUmbrellaBeach,} from "react-icons/fa";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { DoctorSidebar } from "../Doctor/DoctorSidebar";

type LeaveType = "full_day" | "half_day";

export const DoctorSchedule = () => {
  const [scheduleFrom, setScheduleFrom] = useState("");
  const [scheduleTo, setScheduleTo] = useState("");
  const [scheduleStartTime, setScheduleStartTime] = useState("");
  const [scheduleEndTime, setScheduleEndTime] = useState("");
  const [leaveFrom, setLeaveFrom] = useState("");
  const [leaveTo, setLeaveTo] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveType>("full_day");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [loading, setLoading] = useState(false);

  const saveSchedule = async () => {
    if (!scheduleFrom || !scheduleTo) {
      return toast.error("Select schedule from and to date");
    }

    if (new Date(scheduleFrom) > new Date(scheduleTo)) {
      return toast.error("Schedule from date cannot be greater than to date");
    }

    if (!scheduleStartTime || !scheduleEndTime) {
      return toast.error("Select schedule start time and end time");
    }

    if (scheduleStartTime >= scheduleEndTime) {
      return toast.error("Start time must be before end time");
    }

    try {
      setLoading(true);
      await API.post("/doctor-schedules", {
        date_from: scheduleFrom,
        date_to: scheduleTo,
        start_time: scheduleStartTime,
        end_time: scheduleEndTime,
      });

      toast.success("Schedule saved successfully");
      setScheduleFrom("");
      setScheduleTo("");
      setScheduleStartTime("");
      setScheduleEndTime("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Schedule save failed");
    } finally {
      setLoading(false);
    }
  };

  const applyLeave = async () => {
    if (!leaveFrom || !leaveTo) {
      return toast.error("Select leave from and to date");
    }

    if (new Date(leaveFrom) > new Date(leaveTo)) {
      return toast.error("Leave from date cannot be greater than to date");
    }

    if (leaveType === "half_day" && (!leaveStart || !leaveEnd)) {
      return toast.error("Select leave start time and end time");
    }

    if (leaveType === "half_day" && leaveStart >= leaveEnd) {
      return toast.error("Leave start time must be before end time");
    }

    try {
      setLoading(true);
      await API.post("/doctor-leaves", {
        date_from: leaveFrom,
        date_to: leaveTo,
        leave_type: leaveType,
        start_time: leaveType === "half_day" ? leaveStart : null,
        end_time: leaveType === "half_day" ? leaveEnd : null,
      });
      toast.success("Leave applied successfully");
      setLeaveFrom("");
      setLeaveTo("");
      setLeaveType("full_day");
      setLeaveStart("");
      setLeaveEnd("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Leave apply failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DoctorSidebar />
      <main className="flex-1 px-8 py-28">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900">
            Doctor Scheduling
          </h1>
          <p className="mt-2 text-slate-500">
            Add date range with start and end time, and apply leave.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <section className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <FaCalendarAlt />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Available Schedule
                </h2>
                <p className="text-slate-500">
                  Doctor will be available between this date and time.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <DateInput label="Schedule From" value={scheduleFrom} onChange={setScheduleFrom} color="blue"/>
                <DateInput label="Schedule To" value={scheduleTo} onChange={setScheduleTo} color="blue"/>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <TimeInput label="Schedule Start Time" value={scheduleStartTime} onChange={setScheduleStartTime} color="blue"/>
                <TimeInput label="Schedule End Time" value={scheduleEndTime} onChange={setScheduleEndTime} color="blue"/>
              </div>
              <div className="rounded-2xl bg-blue-50 p-5 text-sm font-medium text-blue-700">
                Example: May 20 to May 30, 10:00 AM to 06:00 PM means the
                doctor is available every day in that date range during this time.
              </div>
              <button type="button" onClick={saveSchedule} disabled={loading}
                className="flex h-14 w-full items-center justify-center cursor-pointer gap-2 rounded-2xl bg-green-600 font-bold text-white disabled:opacity-60">
                <FaSave />
                {loading ? "Saving..." : "Save Schedule"}
              </button>
            </div>
          </section>
          <section className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <FaUmbrellaBeach />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Apply Leave
                </h2>
                <p className="text-slate-500">
                  Leave will override schedule availability.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <DateInput label="Leave From" value={leaveFrom} onChange={setLeaveFrom} color="red"/>
                <DateInput label="Leave To" value={leaveTo} onChange={setLeaveTo} color="red"/>
              </div>
              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Leave Type
                </label>
                <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="h-14 w-full rounded-2xl border border-slate-300 px-4 outline-none focus:border-red-500">
                  <option value="full_day">Full Day</option>
                  <option value="half_day">Half Day</option>
                </select>
              </div>

              {leaveType === "half_day" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <TimeInput label="Leave Start Time" value={leaveStart} onChange={setLeaveStart} color="red"/>
                  <TimeInput label="Leave End Time" value={leaveEnd} onChange={setLeaveEnd} color="red"/>
                </div>
              )}

              <div className="rounded-2xl bg-red-50 p-5 text-sm font-medium text-red-700">
                If the selected patient booking date is inside this leave date
                range, doctor will show as unavailable.
              </div>

              <button type="button" onClick={applyLeave} disabled={loading}
                className="flex h-14 w-full items-center cursor-pointer justify-center gap-2 rounded-2xl bg-red-600 font-bold text-white disabled:opacity-60">
                <FaUmbrellaBeach />
                {loading ? "Applying..." : "Apply Leave"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const DateInput = ({label,value,onChange,color,}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  color: "blue" | "red";
}) => (
  <div>
    <label className="mb-2 block font-semibold text-slate-700">{label}</label>
    <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={`h-14 w-full rounded-2xl border cursor-pointer border-slate-300 px-4 outline-none ${
        color === "blue" ? "focus:border-blue-600" : "focus:border-red-500"
      }`}/>
  </div>
);
const TimeInput = ({label,value,onChange,color,}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  color: "blue" | "red";
}) => (
  <div>
    <label className="mb-2 block font-semibold text-slate-700">{label}</label>
    <input type="time" value={value} onChange={(e) => onChange(e.target.value)}
      className={`h-14 w-full rounded-2xl border cursor-pointer border-slate-300 px-4 outline-none ${
        color === "blue" ? "focus:border-blue-600" : "focus:border-red-500"
      }`}/>
  </div>
);