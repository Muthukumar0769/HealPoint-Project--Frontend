import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { FaArrowLeft, FaUserMd } from "react-icons/fa";

type DoctorAppointment={
    id:number;
    doctorName:string;
    specialization:string;
    totalAppointments:number;
    completed:number;
    pending:number;
    cancelled:number;
}
export const DoctorAppointmentSummary = () => {
    const navigate=useNavigate();
    const doctors: DoctorAppointment[] = [
    {
      id: 1,
      doctorName: "Dr. Sarah Johnson",
      specialization: "Cardiologist",
      totalAppointments: 234,
      completed: 190,
      pending: 34,
      cancelled: 10,
    },
    {
      id: 2,
      doctorName: "Dr. Michael Brown",
      specialization: "Dermatologist",
      totalAppointments: 189,
      completed: 150,
      pending: 30,
      cancelled: 9,
    },
    {
      id: 3,
      doctorName: "Dr. Emily Davis",
      specialization: "Neurologist",
      totalAppointments: 176,
      completed: 140,
      pending: 28,
      cancelled: 8,
    },
  ];
  return (
    <div className="flex min-h-screen bg-gray-100 pt-20">
        <AdminSidebar/>
        <main className="flex-1 p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                <button onClick={()=>navigate("/admin/appointments")}
                        className="mb-4 flex items-center gap-2 text-blue-600 cursor-pointer font-semibold">
                            <FaArrowLeft/> Back To Appointments
                        </button>
                        <h1 className="text-4xl font-bold text-gray-900">Doctor's Appointments Summary</h1>
                        <p className="mt-2 text-gray-500">Total Appointments Count for each Doctor</p>
            </div>
            </div>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-[900px] w-full text-left">
                        <thead className="bg-gray-50 text-sm uppercase text-gray-600">
                            <tr>
                                <th className="px-6 py-5">#</th>
                                <th className="px-6 py-5">Doctors</th>
                                <th className="px-6 py-5">Specializations</th>
                                <th className="px-6 py-5">Total Appointments</th>
                                <th className="px-6 py-5">Pending</th>
                                <th className="px-6 py-5">Completed</th>
                                <th className="px-6 py-5">Cancelled</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctors.map((doctor,index)=>(
                                <tr key={doctor.id} className="border-t border-gray-200 text-gray-700">
                                    <td className="px-6 py-5 font-semibold">{index+1}</td>
                                    <td className="px-3 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                                <FaUserMd/>
                                            </div>
                                            <h3 className="font-bold text-gray-900">{doctor.doctorName}</h3>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-bold text-blue-600">{doctor.specialization}</td>
                                    <td className="px-20 font-bold text-green-800 py-5">{doctor.totalAppointments}</td>
                                    <td className="px-12 py-5 font-bold text-yellow-600">{doctor.pending}</td>
                                    <td className="px-12 py-5 font-bold text-green-600">{doctor.completed}</td>
                                    <td className="px-12 py-5 font-bold text-red-600">{doctor.cancelled}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
  )
}
