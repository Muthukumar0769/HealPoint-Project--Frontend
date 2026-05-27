import { useEffect, useState } from "react";
import { FaEye, FaSearch, FaUserInjured, FaCalendarCheck } from "react-icons/fa";
import API from "../../api/axios";
import { DoctorSidebar } from "../Doctor/DoctorSidebar";

type Patient = {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: string;
  age: number;
  lastAppointment: string;
  status: "Completed" | "Upcoming" | "Cancelled";
};

export const DoctorPatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await API.get("/appointments/doctor/patients", {
        params: {
          search: search || undefined,
          status: statusFilter !== "All" ? statusFilter : undefined,
        },
      });

      const data =
        res.data?.data?.patients ||
        res.data?.patients ||
        res.data?.data ||
        [];

      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Fetch patients error:", error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchPatients, 400);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const statusClass = (status: string) => {
    if (status === "Completed") return "bg-green-100 text-green-700";
    if (status === "Upcoming") return "bg-blue-100 text-blue-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DoctorSidebar />
      <main className="flex-1 px-8 py-28">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Patients</h1>
          <p className="mt-2 text-slate-500">Manage and view your patients</p>
        </div>
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <StatCard icon={<FaUserInjured />} title="Total Patients" value={patients.length} desc="All your patients"/>
          <StatCard icon={<FaCalendarCheck />} title="Appointments" value={patients.length} desc="Total patient appointments"/>
        </div>
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Recent Patients</h2>
              <p className="mt-1 text-slate-500">View patient appointment details</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex h-12 w-full items-center gap-3 rounded-xl border border-slate-300 px-4 sm:w-80">
                <FaSearch className="text-slate-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patients..."
                  className="h-full w-full bg-transparent outline-none"/>
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 rounded-xl border border-slate-300 px-4 font-medium outline-none focus:border-blue-600">
                <option value="All">All Patients</option>
                <option value="Completed">Completed</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead className="bg-slate-50 text-sm uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-5">#</th>
                  <th className="px-6 py-5">Patient</th>
                  <th className="px-6 py-5">Gender</th>
                  <th className="px-6 py-5">Contact</th>
                  <th className="px-6 py-5">Last Appointment</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      Loading patients...
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      No patients found
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr key={patient.id} className="border-t border-slate-200 text-slate-700">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                            {patient.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">
                              {patient.name}
                            </h3>
                            <p className="text-sm text-slate-500">
                              ID: PT{patient.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        {patient.age} / {patient.gender}
                      </td>

                      <td className="px-6 py-5">
                        <p>{patient.phone}</p>
                        <p className="text-sm text-slate-500">{patient.email}</p>
                      </td>

                      <td className="px-6 py-5">{patient.lastAppointment}</td>
                      <td className="px-6 py-5">
                        <span className={`rounded-full px-4 py-2 text-sm font-bold ${statusClass(
                            patient.status)}`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <button className="rounded-xl bg-slate-100 p-3 text-slate-600 hover:bg-blue-100 hover:text-blue-700">
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

const StatCard = ({icon,title,value,desc}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  desc: string;
}) => {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl text-blue-600">
          {icon}
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{value}</h2>
          <p className="font-bold text-slate-700">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{desc}</p>
        </div>
      </div>
    </div>
  );
};