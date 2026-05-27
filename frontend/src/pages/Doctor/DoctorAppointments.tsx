import React, { useMemo, useRef, useState } from "react";
import { DoctorSidebar } from "./DoctorSidebar";
import { FaCalendarAlt, FaCheckCircle, FaClock, FaTimesCircle, FaUserCheck, FaVideo } from "react-icons/fa";

type AppointmentStatus = "Pending" | "Accepted" | "Completed" | "Cancelled";
type AppointmentType = "Video Call" | "Clinic Visit";

type Appointment = {
  id: number;
  patientName: string;
  patientInfo: string;
  date: string;
  time: string;
  type: AppointmentType;
  problem: string;
  amount: number;
  status: AppointmentStatus;

}

export const DoctorAppointments = () => {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<"All" | AppointmentStatus>("All");
  const [search, setSearch] = useState("");

  const appointments: Appointment[] = [
    {
      id: 1,
      patientName: "Anjali Mehta",
      patientInfo: "Female, 29 Y",
      date: "14 May 2026",
      time: "09:30 AM",
      type: "Video Call",
      problem: "Chest Pain",
      amount: 500,
      status: "Pending",
    },
    {
      id: 2,
      patientName: "Rohit Verma",
      patientInfo: "Male, 35 Y",
      date: "14 May 2026",
      time: "10:30 AM",
      type: "Clinic Visit",
      problem: "Breathing Issue",
      amount: 500,
      status: "Accepted",
    },
    {
      id: 3,
      patientName: "Priya Nair",
      patientInfo: "Female, 42 Y",
      date: "14 May 2026",
      time: "11:30 AM",
      type: "Video Call",
      problem: "Regular Checkup",
      amount: 500,
      status: "Completed",
    },
  ];
  const stats = {
    total: appointments.length,
    pending: appointments.filter((item) => item.status === "Pending").length,
    accepted: appointments.filter((item) => item.status === "Accepted").length,
    completed: appointments.filter((item) => item.status === "Completed").length,
    cancelled: appointments.filter((item) => item.status === "Cancelled").length,
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const matchesTab = activeTab === "All" || item.status === activeTab;
      const matchesSearch = item.patientName.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch
    })
  }, [activeTab, search]);

  const handleTabClick = (tab: "All" | AppointmentStatus) => {
    setActiveTab(tab);
    setTimeout(() => {
      tableRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      })
    }, 100)
  };

  const statusClass = (status: AppointmentStatus) => {
    if (status === "Pending") return "bg-yellow-100 text-yellow-600";
    if (status === "Accepted") return "bg-blue-100 text-blue-600";
    if (status === "Completed") return "bg-green-100 text-green-600";
    return "bg-red-100 text-red-600"
  };

  const typeClass = (type: AppointmentType) => {
    return type === "Video Call" ? "bg-blue-100 text-blue-600" : "text-green-600 bg-green-100"
  }
  return (
    <div className="flex min-h-screen bg-gray-100 ">
      <DoctorSidebar />
      <main className=" min-w-0 flex-1 p-8 pt-28">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Appointments</h1>
            <p className="mt-2 text-gray-500">Manage Your Appointments</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<FaCalendarAlt />} title="Appointments" value={stats.total} />
          <StatCard icon={<FaClock className="text-yellow-600" />} title="Pending" value={stats.pending} />
          <StatCard icon={<FaUserCheck />} title="Accepted" value={stats.accepted} />
          <StatCard icon={<FaCheckCircle className="text-green-900" />} title="Completed" value={stats.completed} />
          <StatCard icon={<FaTimesCircle className="text-red-600" />} title="Cancelled" value={stats.cancelled} />
        </div>
        <div className="mt-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-8">
            {(["All", "Pending", "Accepted", "Completed", "Cancelled"] as const).map((tab) => (
              <button key={tab} onClick={() => handleTabClick(tab)}
                className={`pb-3 font-semibold transition ${activeTab === tab ? "border-b-4 border-blue-600 cursor-pointer text-blue-600" :
                  "text-gray-600 cursor-pointer hover:text-blue-600"
                  }`}>{tab === "All" ? "All Appointments" : tab}</button>
            ))}
          </div>
          <input type="text" placeholder="Search Patient..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-[300px] rounded-xl border border-gray-300 px-4 outline-none focus:border-blue-600" />
        </div>
        <div ref={tableRef} className="mt-4 max-w-full overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="w-full overflow-x-auto">
            <table className="w-max min-w-[1200px] text-left">
              <thead className="bg-gray-50 text-sm uppercase text-gray-600">
                <tr>
                  <th className="px-6 py-5">#</th>
                  <th className="px-6 py-5">Patient</th>
                  <th className="px-6 py-5">Date&Time</th>
                  <th className="px-6 py-5">Type</th>
                  <th className="px-6 py-5">Problem</th>
                  <th className="px-6 py-5">Amount</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((item, index) => (
                  <tr key={item.id} className="border-t border-gray-200">
                    <td className="px-6 py-5">{index + 1}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                          {item.patientName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{item.patientName}</h3>
                          <p className="text-sm text-gray-500">{item.patientInfo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-semibold text-gray-900">{item.date}</p>
                      <p className="ml-1 text-sm text-gray-500">{item.time}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold 
                                        ${typeClass(item.type)}`}>
                        {item.type === "Video Call" && <FaVideo />}
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-gray-600">{item.problem}</td>
                    <td className="px-6 py-5 font-semibold text-blue-600">$ {item.amount}</td>
                    <td className="px-6 py-5">
                      <span className={`rounded-lg px-3 py-1 text-sm font-semibold ${statusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-3">
                        {item.status === "Pending" ? (
                          <>
                            <button className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
                              Accept
                            </button>
                            <button className="rounded-lg border border-red-500 px-4 py-2 font-semibold text-red-600 hover:bg-red-50">
                              Reject
                            </button>
                          </>
                        ) : (
                          <button className="rounded-lg border border-blue-500 px-4 py-2 font-semibold text-blue-600 hover:bg-blue-50">
                            View Details
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
};

type StatCardProps = {
  icon: React.ReactNode;
  title: string;
  value: number;
}

const StatCard = ({ icon, title, value }: StatCardProps) => {
  return (
    <div className="rounded-2xl  p-6 shadow-sm">
      <div className="flex items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center text-3xl text-blue-600">
          {icon}
        </div>
        <div>
          <p className="text-gray-900 text-xl font-semibold">{title}</p>
          <h2 className="mt-2 text-3xl font-bold text-blue-900">{value}</h2>
          <p className="mt-2 text-sm text-gray-900 font-semibold">This Month</p>
        </div>
      </div>
    </div>
  )
}
