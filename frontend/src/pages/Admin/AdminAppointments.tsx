import type React from "react";
import { AdminSidebar } from "./AdminSidebar";
import { FaCalendarAlt, FaCheckCircle, FaClock, FaEdit, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";


type Appointment = {
    id: number,
    patientName: string,
    patientEmail: string,
    doctorName: string,
    specialization: string,
    date: string,
    time: string,
    reason: string,
    status: "Confirmed" | "Pending" | "Cancelled",
    payment: "Paid" | "Pending" | "Refunded"
}

export const AdminAppointments = () => {
    const navigate=useNavigate();
    const appointments: Appointment[] = [
        {
            id: 1,
            patientName: "Ravi Kumar",
            patientEmail: "ravi.kumar@gmail.com",
            doctorName: "Dr. Sarah Johnson",
            specialization: "Cardiologist",
            date: "24 May 2025",
            time: "10:30 AM",
            reason: "Chest pain and breathing problem",
            status: "Confirmed",
            payment: "Paid",
        },
        {
            id: 2,
            patientName: "Priya Sharma",
            patientEmail: "priya.sharma@gmail.com",
            doctorName: "Dr. Michael Brown",
            specialization: "Dermatologist",
            date: "24 May 2025",
            time: "11:00 AM",
            reason: "Skin allergy and rashes",
            status: "Pending",
            payment: "Pending",
        },
    ];

    const doctorStats = [
        {
            name: "Dr. Sarah Johnson",
            specialization: "Cardiologist",
            count: 234,
        },
        {
            name: "Dr. Michael Brown",
            specialization: "Dermatologist",
            count: 189,
        },
        {
            name: "Dr. Emily Davis",
            specialization: "Neurologist",
            count: 176,
        },
    ];

    const statusClass = (status: string) => {
        if (status === "Confirmed") return "bg-green-100 text-green-600";
        if (status === "Pending") return "bg-yellow-100 text-yellow-600";
        return "bg-red-100 text-red-600"
    };
    const paymentClass = (payment: string) => {
        if (payment === "Paid") return "bg-green-100 text-green-600";
        if (payment === "Pending") return "bg-yellow-100 text-yellow-600";
        return "bg-gray-100 text-gray-600"
    };


    return (
        <div className="flex min-h-screen bg-gray-100 to-white pt-20">
            <AdminSidebar />
            <main className="flex-1 p-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">Appointments</h1>
                        <p className="mt-2 text-gray-500">Manage all Doctor Appointments</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard icon={<FaCalendarAlt />} title="Total Appointments" value="1048" />
                    <StatCard icon={<FaCheckCircle />} title="Today's Appointments" value="28" />
                    <StatCard icon={<FaClock />} title="Upcoming Appointments" value="158" />
                    <StatCard icon={<FaCalendarAlt />} title="Completed Appointments" value="1001" />
                </div>
                <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
                    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                        <div className="grid gap-4 border-b border-gray-200 p-5 md:grid-cols-3">
                            <input type="text" placeholder="Search by patient name,email or phone..."
                                className=" rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500" />
                            <select className=" rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500">
                                <option>All doctors</option>
                            </select>
                            <select className=" rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500">
                                <option>All Status</option>
                                <option>Completed</option>
                                <option>Pending</option>
                                <option>Rejected</option>
                            </select>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-[1500px] w-full text-left">
                                <thead className="bg-gray-50 text-sm uppercase text-gray-600">
                                    <tr>
                                        <th className="px-5 py-4">#</th>
                                        <th className="px-5 py-4">Patient</th>
                                        <th className="px-5 py-4">Doctor</th>
                                        <th className="px-5 py-4">Date & Time</th>
                                        <th className="px-5 py-4">Reason</th>
                                        <th className="px-5 py-4">Status</th>
                                        <th className="px-5 py-4">Payment</th>
                                        <th className="px-5 py-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.map((item, index) => (
                                        <tr key={item.id} className="border-t border-gray-200">
                                            <td className="px-5 py-5 font-semibold">{index + 1}</td>
                                            <td className="px-5 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex w-11 h-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                                                        {item.patientName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">{item.patientName}</h3>
                                                        <p className="text-sm text-gray-500">{item.patientEmail}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-5">
                                                <h3 className="font-bold text-gray-900">{item.doctorName}</h3>
                                                <p className="text-sm text-gray-500">{item.specialization}</p>
                                            </td>
                                            <td className="px-5 py-5">
                                                <h3 className="font-bold text-gray-900">{item.date}</h3>
                                                <p className="text-sm text-gray-500">{item.time}</p>
                                            </td>
                                            <td className="px-5 py-5 text-gray-600">{item.reason}</td>
                                            <td className="px-5 py-5">
                                                <span className={`rounded-lg px-3 py-1 text-sm font-semibold ${statusClass(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-5">
                                                <span className={`rounded-lg px-3 py-1 text-sm font-semibold ${paymentClass(item.payment)}`}>
                                                    {item.payment}
                                                </span>
                                            </td>
                                            <td className="px-5 py-5">
                                                <div className="flex items-center gap-3">
                                                    <button className="rounded-lg bg-blue-50 p-3 text-blue-600"><FaEdit /></button>
                                                    <button className="rounded-lg bg-red-50 p-3 text-red-600"><FaTimes /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-5">
                            <p className="text-gray-600">Showing 1 to {appointments.length} of{" "}{appointments.length} results </p>
                            <div className="flex gap-2">
                                <button className="h-10 w-10 rounded-lg border text-black cursor-pointer">&lt;</button>
                                <button className="h-10 w-10 rounded-lg border text-white cursor-pointer bg-blue-600 ">1</button>
                                <button className="h-10 w-10 rounded-lg border text-black cursor-pointer">&gt;</button>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900">Appointments by doctor</h2>
                        <div className="mt-5 space-y-5">
                            {doctorStats.map((doctor) => (
                                <div key={doctor.name} className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{doctor.name}</h3>
                                        <p className="text-sm text-gray-600">{doctor.specialization}</p>
                                    </div>
                                    <span className="rounded-lg bg-blue-50 px-3 py-2 font-bold text-blue-600">
                                        {doctor.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button onClick={()=>navigate("/admin/appointments/doctor-summary")}
                        className="mt-6 w-full rounded-xl cursor-pointer bg-blue-50 py-3 font-semibold text-blue-600 hover:bg-blue-600 hover:text-white hover:scale-105 transition-all duration-300">
                        View All Doctors</button>
                    </div>
                </div>
            </main>
        </div>
    )
}

type StatCardProps = {
    icon: React.ReactNode;
    title: string;
    value: string
};

const StatCard = ({ icon, title, value }: StatCardProps) => {
    return (
        <div className="rounded-2xl bg-gray-50 p-6 shadow-lg">
            <div className="flex items-center gap-5">
                <div className="flex h-12 w-16 items-center justify-center text-2xl bg-blue-500 text-white rounded-lg">
                    {icon}
                </div>
                <div>
                    <p className="text-gray-600 text-sm font-semibold ">{title}</p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-800">{value}</h2>
                </div>
            </div>

        </div>
    );

};
