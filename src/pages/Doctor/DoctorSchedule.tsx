import { useState, useRef, useEffect } from "react";
import { FaCalendarAlt, FaSave, FaUmbrellaBeach, FaClock, FaCheckCircle,
  FaChevronDown, FaRegCalendarAlt, FaStar, FaTrash, FaEdit,
  FaExclamationTriangle, FaChevronLeft, FaChevronRight, FaTimes} from "react-icons/fa";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {createAvailability, createSpecialAvailability, createUnavailability,
  fetchAllSchedules, deleteNormalSchedule, deleteSpecialSchedule, deleteLeave} from "../../store/slices/DoctorScheduleSlice";
import { DoctorSidebar } from "../Doctor/DoctorSidebar";
import usePageTitle from "../../hooks/usePageTitle";
import API from "../../api/axios";

type LeaveType = "full_day" | "half_day";
type MainTab = "Weekly" | "Special" | "Leave";

type OptionType = { label: string; value: string };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DURATIONS = ["15", "30", "45", "60"];
const LEAVE_TYPES: OptionType[] = [
  { label: "Full Day", value: "full_day" },
  { label: "Half Day", value: "half_day" },
];

const PAGE_SIZE = 5;

export const DoctorSchedule = () => {
  usePageTitle("My Schedule");
  const dispatch = useAppDispatch();
  const { loading, normalSchedules, specialSchedules, leaves, fetchLoading } =
    useAppSelector((state) => state.doctorSchedule);

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
  const [normalPage, setNormalPage] = useState(1);
  const [specialPage, setSpecialPage] = useState(1);
  const [leavePage, setLeavePage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean; type: "normal" | "special" | "leave" | null; id: number | null; label: string;
  }>({ open: false, type: null, id: null, label: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit modal
  const [editModal, setEditModal] = useState<{
    open: boolean; type: "normal" | "special" | "leave" | null; data: any;
  }>({ open: false, type: null, data: null });
  const [editLoading, setEditLoading] = useState(false);
  const [editDay, setEditDay] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editBreakStart, setEditBreakStart] = useState("");
  const [editBreakEnd, setEditBreakEnd] = useState("");
  const [editDuration, setEditDuration] = useState("15");
  const [editDate, setEditDate] = useState("");
  const [editLeaveFrom, setEditLeaveFrom] = useState("");
  const [, setEditLeaveTo] = useState("");
  const [editLeaveType, setEditLeaveType] = useState<LeaveType>("full_day");
  const [editLeaveStart, setEditLeaveStart] = useState("");
  const [editLeaveEnd, setEditLeaveEnd] = useState("");
  const [editReason, setEditReason] = useState("");

  const dayOptions: OptionType[] = DAYS.map((d) => ({ label: d, value: d }));
  const durationOptions: OptionType[] = DURATIONS.map((t) => ({ label: `${t} Minutes`, value: t }));

  useEffect(() => {
    dispatch(fetchAllSchedules());
  }, [dispatch]);

  const saveSchedule = async () => {
    if (!day) return toast.error("Please select day");
    if (!scheduleStartTime || !scheduleEndTime) return toast.error("Select start and end time");
    if (scheduleStartTime >= scheduleEndTime) return toast.error("Start time must be before end time");
    if (breakStart && breakEnd && breakStart >= breakEnd) return toast.error("Break start must be before break end");
    try {
      await dispatch(createAvailability({
        day_of_week: day, start_time: scheduleStartTime, end_time: scheduleEndTime,
        slot_duration: Number(duration), break_start: breakStart || null, break_end: breakEnd || null,
      })).unwrap();
      toast.success("Schedule saved successfully");
      setDay(""); setScheduleStartTime(""); setScheduleEndTime(""); setDuration("15"); setBreakStart(""); setBreakEnd("");
    } catch (error: any) { toast.error(error || "Schedule save failed"); }
  };

  const saveSpecialSchedule = async () => {
    if (!specialDate) return toast.error("Please select date");
    if (!specialStartTime || !specialEndTime) return toast.error("Select start and end time");
    if (specialStartTime >= specialEndTime) return toast.error("Start time must be before end time");
    try {
      await dispatch(createSpecialAvailability({
        date: specialDate, start_time: specialStartTime, end_time: specialEndTime, slot_duration: Number(specialDuration),
      })).unwrap();
      toast.success("Special schedule saved");
      setSpecialDate(""); setSpecialStartTime(""); setSpecialEndTime(""); setSpecialDuration("15");
    } catch (error: any) { toast.error(error || "Failed to save special schedule"); }
  };

  const applyLeave = async () => {
    if (!leaveFrom || !leaveTo) return toast.error("Select leave dates");
    if (new Date(leaveFrom) > new Date(leaveTo)) return toast.error("From date cannot be after To date");
    if (!reason.trim()) return toast.error("Please enter leave reason");
    if (leaveType === "half_day" && (!leaveStart || !leaveEnd)) return toast.error("Select leave start and end time");
    if (leaveType === "half_day" && leaveStart >= leaveEnd) return toast.error("Start time must be before end time");
    try {
      const requests = [];
      for (let date = new Date(leaveFrom); date <= new Date(leaveTo); date.setDate(date.getDate() + 1)) {
        requests.push({
          unavailable_date: date.toISOString().split("T")[0], reason,
          is_full_day: leaveType === "full_day",
          start_time: leaveType === "half_day" ? leaveStart : null,
          end_time: leaveType === "half_day" ? leaveEnd : null,
        });
      }
      await dispatch(createUnavailability(requests)).unwrap();
      toast.success("Leave applied successfully");
      setLeaveFrom(""); setLeaveTo(""); setLeaveType("full_day"); setLeaveStart(""); setLeaveEnd(""); setReason("");
    } catch (error: any) { toast.error(error || "Leave apply failed"); }
  };

  const confirmDelete = async () => {
    if (!deleteModal.type || !deleteModal.id) return;
    setDeleteLoading(true);
    try {
      if (deleteModal.type === "normal") await dispatch(deleteNormalSchedule(deleteModal.id)).unwrap();
      else if (deleteModal.type === "special") await dispatch(deleteSpecialSchedule(deleteModal.id)).unwrap();
      else await dispatch(deleteLeave(deleteModal.id)).unwrap();
      toast.success("Deleted successfully");
      setDeleteModal({ open: false, type: null, id: null, label: "" });
    } catch (e: any) { toast.error(e || "Delete failed"); }
    setDeleteLoading(false);
  };

  const openEdit = (type: "normal" | "special" | "leave", row: any) => {
    if (type === "normal") {
      setEditDay(row.day_of_week || ""); setEditStart(row.start_time || ""); setEditEnd(row.end_time || "");
      setEditBreakStart(row.break_start || ""); setEditBreakEnd(row.break_end || "");
      setEditDuration(String(row.slot_duration || "15"));
    } else if (type === "special") {
      setEditDate(row.date || ""); setEditStart(row.start_time || ""); setEditEnd(row.end_time || "");
      setEditDuration(String(row.slot_duration || "15"));
    } else {
      setEditLeaveFrom(row.unavailable_date || ""); setEditLeaveTo(row.unavailable_date || "");
      setEditLeaveType(row.is_full_day ? "full_day" : "half_day");
      setEditLeaveStart(row.start_time || ""); setEditLeaveEnd(row.end_time || "");
      setEditReason(row.reason || "");
    }
    setEditModal({ open: true, type, data: row });
  };

  const saveEdit = async () => {
    if (!editModal.type || !editModal.data) return;
    setEditLoading(true);
    try {
      if (editModal.type === "normal") {
        if (!editDay) throw "Please select day";
        if (!editStart || !editEnd) throw "Select start and end time";
        if (editStart >= editEnd) throw "Start time must be before end time";
        await API.put(`/availability/${editModal.data.id}`, {
          day_of_week: editDay, start_time: editStart, end_time: editEnd,
          slot_duration: Number(editDuration), break_start: editBreakStart || null, break_end: editBreakEnd || null,
        });
      } else if (editModal.type === "special") {
        if (!editDate) throw "Please select date";
        if (!editStart || !editEnd) throw "Select start and end time";
        if (editStart >= editEnd) throw "Start time must be before end time";
        await API.put(`/special-availability/${editModal.data.id}`, {
          date: editDate, start_time: editStart, end_time: editEnd, slot_duration: Number(editDuration),
        });
      } else {
        if (!editLeaveFrom) throw "Select leave date";
        if (!editReason.trim()) throw "Enter leave reason";
        if (editLeaveType === "half_day" && (!editLeaveStart || !editLeaveEnd)) throw "Select leave times";
        await API.put(`/unavailability/${editModal.data.id}`, {
          unavailable_date: editLeaveFrom, reason: editReason,
          is_full_day: editLeaveType === "full_day",
          start_time: editLeaveType === "half_day" ? editLeaveStart : null,
          end_time: editLeaveType === "half_day" ? editLeaveEnd : null,
        });
      }
      toast.success("Updated successfully");
      dispatch(fetchAllSchedules());
      setEditModal({ open: false, type: null, data: null });
    } catch (e: any) { toast.error(typeof e === "string" ? e : e?.response?.data?.message || "Update failed"); }
    setEditLoading(false);
  };

  const paginate = (arr: any[], page: number) => arr.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = (arr: any[]) => Math.max(1, Math.ceil(arr.length / PAGE_SIZE));

  const fmtTime = (t: string) => {
    if (!t) return "-";
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour < 12 ? "AM" : "PM"}`;
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
                  {activeTab === "Leave" ? <FaUmbrellaBeach /> : <FaCalendarAlt />}
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
                    className={`flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200 ${activeTab === tab.key
                      ? tab.key === "Leave" ? "bg-white text-red-500 shadow-lg" : "bg-white text-blue-600 shadow-lg"
                      : "text-white hover:bg-white/10"
                      }`}>
                    {tab.icon}{tab.label}
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
                    Weekly recurring schedule will repeat every week. Saving a new schedule for the same day will replace the existing one.
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <CustomDropdown label="Select Day" value={day} onChange={setDay} color="blue" placeholder="Choose Day" options={dayOptions} />
                  <TimeInput label="Start Time" value={scheduleStartTime} onChange={setScheduleStartTime} color="blue" />
                  <TimeInput label="End Time" value={scheduleEndTime} onChange={setScheduleEndTime} color="blue" />
                  <CustomDropdown label="Slot Duration" value={duration} onChange={setDuration} color="blue" placeholder="Select Duration" options={durationOptions} />
                </div>
                <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-5">
                  <p className="mb-4 text-sm font-bold text-amber-700">Break Time (Optional) — slots will not be generated during this period</p>
                  <div className="grid gap-6 md:grid-cols-2">
                    <TimeInput label="Break Start" value={breakStart} onChange={setBreakStart} color="blue" />
                    <TimeInput label="Break End" value={breakEnd} onChange={setBreakEnd} color="blue" />
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <button type="button" onClick={saveSchedule} disabled={loading}
                    className="flex h-12 cursor-pointer items-center gap-3 rounded-2xl bg-blue-600 px-8 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:scale-[1.02] hover:bg-blue-700 disabled:opacity-60">
                    <FaSave />{loading ? "Saving..." : "Save Schedule"}
                  </button>
                </div>
                <ScheduleTable
                  title="Saved Weekly Schedules"
                  color="blue"
                  loading={fetchLoading}
                  empty={normalSchedules.length === 0}
                  headers={["Day", "Start Time", "End Time", "Slot Duration", "Break Start", "Break End", "Actions"]}
                  page={normalPage}
                  total={totalPages(normalSchedules)}
                  onPage={setNormalPage}
                  rows={paginate(normalSchedules, normalPage).map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{s.day_of_week}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{fmtTime(s.start_time)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{fmtTime(s.end_time)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{s.slot_duration} min</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{s.break_start ? fmtTime(s.break_start) : "-"}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{s.break_end ? fmtTime(s.break_end) : "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ActionBtn color="blue" icon={<FaEdit />} label="Edit" onClick={() => openEdit("normal", s)} />
                          <ActionBtn color="red" icon={<FaTrash />} label="Delete"
                            onClick={() => setDeleteModal({ open: true, type: "normal", id: s.id, label: `${s.day_of_week} schedule` })} />
                        </div>
                      </td>
                    </tr>
                  ))}
                />
              </div>
            )}
            {activeTab === "Special" && (
              <div>
                <div className="mb-8 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
                  <p className="text-sm font-semibold text-amber-700">
                    Special schedule overrides normal schedule for the selected date. Use this for extended or reduced hours on a specific day.
                  </p>
                </div>
                <div className="mb-8 rounded-3xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white shadow-lg shadow-blue-200">
                      <FaRegCalendarAlt />
                    </div>
                    <div className="flex-1">
                      <label className="mb-2 block text-sm font-bold text-slate-700">Select Date</label>
                      <input type="date" value={specialDate} onChange={(e) => setSpecialDate(e.target.value)}
                        className="h-12 w-full max-w-sm rounded-2xl border border-blue-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                    </div>
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  <TimeInput label="Start Time" value={specialStartTime} onChange={setSpecialStartTime} color="blue" />
                  <TimeInput label="End Time" value={specialEndTime} onChange={setSpecialEndTime} color="blue" />
                  <CustomDropdown label="Slot Duration" value={specialDuration} onChange={setSpecialDuration} color="blue" placeholder="Select Duration" options={durationOptions} />
                </div>
                <div className="mt-8 flex justify-end">
                  <button type="button" onClick={saveSpecialSchedule} disabled={loading}
                    className="flex h-12 cursor-pointer items-center gap-3 rounded-2xl bg-blue-600 px-8 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:scale-[1.02] hover:bg-blue-700 disabled:opacity-60">
                    <FaSave />{loading ? "Saving..." : "Save Special Schedule"}
                  </button>
                </div>

                <ScheduleTable
                  title="Saved Special Schedules"
                  color="amber"
                  loading={fetchLoading}
                  empty={specialSchedules.length === 0}
                  headers={["Date", "Start Time", "End Time", "Slot Duration", "Actions"]}
                  page={specialPage}
                  total={totalPages(specialSchedules)}
                  onPage={setSpecialPage}
                  rows={paginate(specialSchedules, specialPage).map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{s.date}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{fmtTime(s.start_time)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{fmtTime(s.end_time)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{s.slot_duration} min</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ActionBtn color="blue" icon={<FaEdit />} label="Edit" onClick={() => openEdit("special", s)} />
                          <ActionBtn color="red" icon={<FaTrash />} label="Delete"
                            onClick={() => setDeleteModal({ open: true, type: "special", id: s.id, label: `special schedule on ${s.date}` })} />
                        </div>
                      </td>
                    </tr>
                  ))}
                />
              </div>
            )}
            {activeTab === "Leave" && (
              <div>
                <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
                  <p className="text-sm font-semibold text-red-700">
                    Leave schedule will override doctor availability. All slots on leave dates will be marked unavailable for patients.
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <DateInput label="Leave From" value={leaveFrom} onChange={setLeaveFrom} color="red" />
                  <DateInput label="Leave To" value={leaveTo} onChange={setLeaveTo} color="red" />
                  <CustomDropdown label="Leave Type" value={leaveType} onChange={(v) => setLeaveType(v as LeaveType)} color="red" placeholder="Select Type" options={LEAVE_TYPES} />
                  {leaveType === "half_day" ? (
                    <TimeInput label="Start Time" value={leaveStart} onChange={setLeaveStart} color="red" />
                  ) : <div />}
                </div>
                {leaveType === "half_day" && (
                  <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <TimeInput label="End Time" value={leaveEnd} onChange={setLeaveEnd} color="red" />
                  </div>
                )}
                <div className="mt-6">
                  <label className="mb-2 block text-sm font-bold text-slate-700">Leave Reason</label>
                  <textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter leave reason..."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100" />
                </div>
                <div className="mt-8 flex justify-end">
                  <button type="button" onClick={applyLeave} disabled={loading}
                    className="flex h-12 cursor-pointer items-center gap-3 rounded-2xl bg-red-500 px-8 text-sm font-bold text-white shadow-lg shadow-red-200 transition-all duration-200 hover:scale-[1.02] hover:bg-red-600 disabled:opacity-60">
                    <FaUmbrellaBeach />{loading ? "Applying..." : "Apply Leave"}
                  </button>
                </div>

                <ScheduleTable
                  title="Applied Leaves"
                  color="red"
                  loading={fetchLoading}
                  empty={leaves.length === 0}
                  headers={["Date", "Leave Type", "Start Time", "End Time", "Reason", "Actions"]}
                  page={leavePage}
                  total={totalPages(leaves)}
                  onPage={setLeavePage}
                  rows={paginate(leaves, leavePage).map((l) => (
                    <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{l.unavailable_date}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${l.is_full_day ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                          {l.is_full_day ? "Full Day" : "Half Day"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{l.start_time ? fmtTime(l.start_time) : "-"}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{l.end_time ? fmtTime(l.end_time) : "-"}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-[180px] truncate" title={l.reason}>{l.reason}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ActionBtn color="blue" icon={<FaEdit />} label="Edit" onClick={() => openEdit("leave", l)} />
                          <ActionBtn color="red" icon={<FaTrash />} label="Delete"
                            onClick={() => setDeleteModal({ open: true, type: "leave", id: l.id, label: `leave on ${l.unavailable_date}` })} />
                        </div>
                      </td>
                    </tr>
                  ))}
                />
              </div>
            )}
          </div>
        </section>
      </main>
      {deleteModal.open && (
        <Modal onClose={() => !deleteLoading && setDeleteModal({ open: false, type: null, id: null, label: "" })}>
          <div className="flex flex-col items-center gap-5 p-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-500">
              <FaExclamationTriangle />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-800">Delete Confirmation</h3>
              <p className="mt-2 text-sm text-slate-500">
                Are you sure you want to delete <span className="font-semibold text-slate-700">{deleteModal.label}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 mt-2 w-full">
              <button type="button" onClick={() => setDeleteModal({ open: false, type: null, id: null, label: "" })} disabled={deleteLoading}
                className="flex-1 h-11 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-60">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} disabled={deleteLoading}
                className="flex-1 h-11 rounded-2xl bg-red-500 text-sm font-bold text-white shadow-lg shadow-red-200 hover:bg-red-600 transition-all disabled:opacity-60">
                {deleteLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── EDIT MODAL ── */}
      {editModal.open && (
        <Modal onClose={() => !editLoading && setEditModal({ open: false, type: null, data: null })} wide>
          <div className="p-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-slate-800">
                Edit {editModal.type === "normal" ? "Weekly Schedule" : editModal.type === "special" ? "Special Schedule" : "Leave"}
              </h3>
              <button type="button" onClick={() => !editLoading && setEditModal({ open: false, type: null, data: null })}
                className="text-slate-400 hover:text-slate-600 transition-colors text-lg"><FaTimes /></button>
            </div>

            {editModal.type === "normal" && (
              <div className="grid gap-5 md:grid-cols-2">
                <CustomDropdown label="Select Day" value={editDay} onChange={setEditDay} color="blue" placeholder="Choose Day" options={dayOptions} />
                <CustomDropdown label="Slot Duration" value={editDuration} onChange={setEditDuration} color="blue" placeholder="Select Duration" options={durationOptions} />
                <TimeInput label="Start Time" value={editStart} onChange={setEditStart} color="blue" />
                <TimeInput label="End Time" value={editEnd} onChange={setEditEnd} color="blue" />
                <TimeInput label="Break Start (Optional)" value={editBreakStart} onChange={setEditBreakStart} color="blue" />
                <TimeInput label="Break End (Optional)" value={editBreakEnd} onChange={setEditBreakEnd} color="blue" />
              </div>
            )}

            {editModal.type === "special" && (
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700">Date</label>
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" />
                </div>
                <TimeInput label="Start Time" value={editStart} onChange={setEditStart} color="blue" />
                <TimeInput label="End Time" value={editEnd} onChange={setEditEnd} color="blue" />
                <div className="md:col-span-2">
                  <CustomDropdown label="Slot Duration" value={editDuration} onChange={setEditDuration} color="blue" placeholder="Select Duration" options={durationOptions} />
                </div>
              </div>
            )}

            {editModal.type === "leave" && (
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Leave Date</label>
                  <input type="date" value={editLeaveFrom} onChange={(e) => setEditLeaveFrom(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100" />
                </div>
                <CustomDropdown label="Leave Type" value={editLeaveType} onChange={(v) => setEditLeaveType(v as LeaveType)} color="red" placeholder="Select Type" options={LEAVE_TYPES} />
                {editLeaveType === "half_day" && (
                  <>
                    <TimeInput label="Start Time" value={editLeaveStart} onChange={setEditLeaveStart} color="red" />
                    <TimeInput label="End Time" value={editLeaveEnd} onChange={setEditLeaveEnd} color="red" />
                  </>
                )}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700">Reason</label>
                  <textarea rows={3} value={editReason} onChange={(e) => setEditReason(e.target.value)} placeholder="Enter reason..."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100" />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-7">
              <button type="button" onClick={() => setEditModal({ open: false, type: null, data: null })} disabled={editLoading}
                className="flex-1 h-11 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-60">
                Cancel
              </button>
              <button type="button" onClick={saveEdit} disabled={editLoading}
                className="flex-1 h-11 rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-60">
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const Modal = ({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className={`bg-white rounded-3xl shadow-2xl w-full p-6 ${wide ? "max-w-xl" : "max-w-sm"} animate-[fadeIn_0.15s_ease]`}>
      {children}
    </div>
  </div>
);

const ScheduleTable = ({ title, color, loading, empty, headers, rows, page, total, onPage }: {
  title: string; color: "blue" | "amber" | "red"; loading: boolean;
  empty: boolean; headers: string[]; rows: React.ReactNode[];
  page: number; total: number; onPage: (p: number) => void;
}) => {
  const accent = color === "blue" ? "bg-blue-600" : color === "amber" ? "bg-amber-500" : "bg-red-500";
  const textAccent = color === "blue" ? "text-blue-600" : color === "amber" ? "text-amber-600" : "text-red-500";
  const borderAccent = color === "blue" ? "border-blue-200" : color === "amber" ? "border-amber-200" : "border-red-200";

  return (
    <div className={`mt-10 rounded-2xl border ${borderAccent} overflow-hidden`}>
      <div className={`${accent} px-5 py-3`}>
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-sm text-slate-400">Loading...</td></tr>
            ) : empty ? (
              <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-sm text-slate-400">No records found.</td></tr>
            ) : rows}
          </tbody>
        </table>
      </div>
      {!empty && !loading && total > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
          <span className="text-xs text-slate-400">Page {page} of {total}</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs transition-all ${page === 1 ? "border-slate-200 text-slate-300 cursor-not-allowed" : `border-slate-200 ${textAccent} hover:bg-white cursor-pointer`}`}>
              <FaChevronLeft />
            </button>
            {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
              <button key={p} type="button" onClick={() => onPage(p)}
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-all ${p === page ? `${accent} text-white shadow` : "border border-slate-200 text-slate-500 hover:bg-white"}`}>
                {p}
              </button>
            ))}
            <button type="button" onClick={() => onPage(Math.min(total, page + 1))} disabled={page === total}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs transition-all ${page === total ? "border-slate-200 text-slate-300 cursor-not-allowed" : `border-slate-200 ${textAccent} hover:bg-white cursor-pointer`}`}>
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ActionBtn = ({ color, icon, label, onClick }: { color: "blue" | "red"; icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} title={label}
    className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs transition-all cursor-pointer ${color === "blue"
      ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
      : "bg-red-50 text-red-500 hover:bg-red-100"
      }`}>
    {icon}
  </button>
);

const CustomDropdown = ({ label, value, onChange, color, options, placeholder }: {
  label: string; value: string; onChange: (value: string) => void;
  color: "blue" | "red"; options: OptionType[]; placeholder: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const selectedLabel = options.find((item) => item.value === value)?.label || "";
  return (
    <div ref={ref} className="relative z-50 overflow-visible">
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <button type="button" onClick={() => setOpen(!open)}
        className={`flex h-12 w-full items-center justify-between rounded-2xl border bg-slate-50 px-4 text-sm font-semibold shadow-sm transition-all duration-200 ${open
          ? color === "blue" ? "border-blue-400 bg-white ring-4 ring-blue-100" : "border-red-400 bg-white ring-4 ring-red-100"
          : "border-slate-200 hover:border-slate-300 hover:bg-white"}`}>
        <span className={value ? "text-slate-800" : "text-slate-400"}>{value ? selectedLabel : placeholder}</span>
        <FaChevronDown className={`text-xs transition-all duration-300 ${open ? "rotate-180 text-slate-700" : "text-slate-400"}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 z-[9999] w-full rounded-2xl border border-slate-100 bg-white shadow-2xl">
          <div className={`h-1 ${color === "blue" ? "bg-blue-500" : "bg-red-500"}`} />
          <div className="max-h-60 overflow-y-auto p-2">
            {options.map((item) => {
              const isSelected = value === item.value;
              return (
                <button key={item.value} type="button" onClick={() => { onChange(item.value); setOpen(false); }}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${isSelected
                    ? color === "blue" ? "bg-blue-600 text-white" : "bg-red-500 text-white"
                    : "text-slate-700 hover:bg-slate-100"}`}>
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

const DateInput = ({ label, value, onChange, color }: { label: string; value: string; onChange: (v: string) => void; color: "blue" | "red" }) => (
  <div>
    <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
    <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
      className={`h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all duration-200 ${color === "blue" ? "focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" : "focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"}`} />
  </div>
);

const TimeInput = ({ label, value, onChange, color }: { label: string; value: string; onChange: (v: string) => void; color: "blue" | "red" }) => (
  <div>
    <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
    <div className="relative">
      <FaClock className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
      <input type="time" value={value} onChange={(e) => onChange(e.target.value)}
        className={`h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all duration-200 ${color === "blue" ? "focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" : "focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"}`} />
    </div>
  </div>
);