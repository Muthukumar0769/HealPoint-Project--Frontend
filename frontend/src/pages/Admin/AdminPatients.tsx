import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { FaSearch, FaUserPlus, FaUsers } from "react-icons/fa";
import API from "../../api/axios";
import { motion, AnimatePresence } from "framer-motion";

type ApiPatient = {
    id: number;
    name?: string;
    email?: string;
    phone?: string | number | null;
    phone_number?: string | number | null;
    gender?: string;
    blood_group?: string;
    dob?: string;
    created_at?: string;
    createdAt?: string;
    is_active?: boolean;
    user?: {
        name?: string;
        email?: string;
        phone?: string | number | null;
        phone_number?: string | number | null;
        gender?: string;
        blood_group?: string;
        dob?: string;
        created_at?: string;
        createdAt?: string;
        is_active?: boolean;
    };
};

type Patient = {
    id: number;
    name: string;
    email: string;
    phone: string;
    gender: string;
    blood_group: string;
    dob: string;
    registeredOn: string;
    status: "Active" | "Inactive";
};

export const AdminPatients = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [genderFilter, setGenderFilter] = useState("All");
    const [bloodGroupFilter, setBloodGroupFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [openFilter, setOpenFilter] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPatients, setTotalPatients] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [direction, setDirection] = useState(1);

    const limit = 10;

    const formatDateOnly = (date?: string) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const normalizePatient = (patient: ApiPatient): Patient => {
        const isActive = patient.is_active || patient.user?.is_active;

        return {
            id: patient.id,
            name: patient.name || patient.user?.name || "Unknown",
            email: patient.email || patient.user?.email || "N/A",
            phone: String(
                patient.phone_number ||
                patient.phone ||
                patient.user?.phone_number ||
                patient.user?.phone || "N/A"),
            gender: patient.gender || patient.user?.gender || "N/A",
            blood_group: patient.blood_group || patient.user?.blood_group || "N/A",
            dob: patient.dob || patient.user?.dob || "N/A",
            registeredOn: formatDateOnly(
                patient.created_at ||
                patient.createdAt ||
                patient.user?.created_at ||
                patient.user?.createdAt
            ),
            status: isActive ? "Active" : "Inactive",
        };
    };

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const params: any = {
                page: currentPage,
                limit,
            };
            if (search.trim()) {
                params.search = search.trim()
            }
            if (genderFilter !== "All") {
                params.gender = genderFilter;
            }
            if (bloodGroupFilter !== "All") {
                params.blood_group = bloodGroupFilter;
            }
            if (statusFilter !== "All") {
                params.is_active = statusFilter === "Active";
            }

            const res = await API.get("/patients", { params });
            const patientsData = res.data?.data?.patients ||
                res.data?.patients ||
                res.data?.data ||
                [];

            const patientsArray = Array.isArray(patientsData) ? patientsData : [];
            setPatients(patientsArray.map(normalizePatient));
            setTotalPatients( res.data?.data?.total || res.data?.total ||patientsArray.length);
            setTotalPages(res.data?.data?.totalPages ||res.data?.totalPages ||1);
        } catch (error) {
            console.log("Fetch patients error:", error);
            setPatients([]);
            setTotalPatients(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPatients();
        }, 400);
        return () => clearTimeout(timer);
    }, [currentPage,search,genderFilter,bloodGroupFilter,statusFilter,]);
    const resetPage = () => {
        setCurrentPage(1);
        setDirection(1);
    };
    const changePage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setDirection(page > currentPage ? 1 : -1);
        setCurrentPage(page);
        window.scrollTo({ top: 200, behavior: "smooth" });
    };

    const clearFilters = () => {
        setSearch("");
        setGenderFilter("All");
        setBloodGroupFilter("All");
        setStatusFilter("All");
        setCurrentPage(1);
    };

    const newThisMonth = useMemo(() => {
        return patients.filter((patient) => {
            if (patient.registeredOn === "N/A") return false;
            const createdDate = new Date(patient.registeredOn);
            const now = new Date();
            return (
                createdDate.getMonth() === now.getMonth() &&
                createdDate.getFullYear() === now.getFullYear()
            );
        }).length;
    }, [patients]);

    const statusClass = (status: string) =>
        status === "Active"
            ? "bg-green-100 text-green-600"
            : "bg-red-100 text-red-600";

    return (
        <div className=" flex min-h-screen bg-gray-100 pt-20">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto p-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">Patients</h1>
                        <p className="mt-2 text-gray-500">Manage all registered patients</p>
                    </div>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <StatCard icon={<FaUsers />} title="Total Patients" value={String(totalPatients)} description="All registered patients" />
                    <StatCard icon={<FaUserPlus />} title="Showing" value={String(newThisMonth)} description="Patients in this page" />
                </div>
                <button onClick={clearFilters} className="rounded-xl bg-blue-500 mb-5 ml-[780px] cursor-pointer px-5 py-3 font-semibold text-white hover:bg-blue-700">
                    Clear Filters
                </button>

                <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="grid gap-4 border-b border-gray-200 bg-white p-5 md:grid-cols-4">
                        <div className="flex h-12 items-center gap-3 rounded-xl border border-gray-300 px-4">
                            <FaSearch className="text-gray-400" />
                            <input type="text" placeholder="Search name or email..." value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    resetPage();
                                }}
                                className="h-full w-full bg-transparent text-sm outline-none" />
                        </div>
                        <FilterDropdown label="Gender" value={genderFilter} options={["All", "Male", "Female", "Others"]}
                            isOpen={openFilter === "gender"}
                            onToggle={() =>
                                setOpenFilter(openFilter === "gender" ? null : "gender")
                            }
                            onSelect={(value) => {
                                setGenderFilter(value);
                                resetPage();
                                setOpenFilter(null);
                            }} />
                        <FilterDropdown label="Blood Group" value={bloodGroupFilter}
                            options={["All", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]}
                            isOpen={openFilter === "blood"}
                            onToggle={() =>
                                setOpenFilter(openFilter === "blood" ? null : "blood")
                            }
                            onSelect={(value) => {
                                setBloodGroupFilter(value);
                                resetPage();
                                setOpenFilter(null);
                            }} />
                        <FilterDropdown label="Status" value={statusFilter} options={["All", "Active", "Inactive"]}
                            isOpen={openFilter === "status"}
                            onToggle={() =>
                                setOpenFilter(openFilter === "status" ? null : "status")
                            }
                            onSelect={(value) => {
                                setStatusFilter(value);
                                resetPage();
                                setOpenFilter(null);
                            }} />
                    </div>
                    <div className="w-full overflow-hidden">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={currentPage}
                                custom={direction}
                                initial={{ x: direction === 1 ? 120 : -120, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: direction === 1 ? -120 : 120, opacity: 0 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className={loading ? "opacity-60" : ""}>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1200px] text-left">
                                        <thead className="bg-gray-50 text-sm uppercase text-gray-600">
                                            <tr>
                                                <th className="px-5 py-4">#</th>
                                                <th className="px-5 py-4">Patient</th>
                                                <th className="px-5 py-4">Email</th>
                                                <th className="px-5 py-4">Phone</th>
                                                <th className="px-5 py-4">Gender</th>
                                                <th className="px-3 py-4">Blood Group</th>
                                                <th className="px-5 py-4">Date Of Birth</th>
                                                <th className="px-5 py-4">Registered On</th>
                                                <th className="px-5 py-4">Status</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={8} className="px-5 py-10 text-center">
                                                        Loading patients...</td>
                                                </tr>
                                            ) : patients.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="px-5 py-10 text-center">
                                                        No patients found
                                                    </td>
                                                </tr>
                                            ) : (
                                                patients.map((patient, index) => (
                                                    <tr key={patient.id} className="border-t border-gray-200">
                                                        <td className="px-5 py-5 font-semibold">
                                                            PT{(currentPage - 1) * limit + index + 1}
                                                        </td>
                                                        <td className="px-5 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                                                                    {patient.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <h3 className="font-bold text-gray-900">{patient.name}</h3>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-5 text-gray-600">{patient.email}</td>
                                                        <td className="px-5 py-5 text-gray-700">{patient.phone}</td>
                                                        <td className="px-5 py-5 text-gray-700">{patient.gender}</td>
                                                        <td className="px-5 py-5 text-gray-700">{patient.blood_group}</td>
                                                        <td className="px-5 py-5 text-gray-700">{patient.dob}</td>
                                                        <td className="px-5 py-5 text-gray-700">{patient.registeredOn}</td>
                                                        <td className="px-5 py-5">
                                                            <span className={`rounded-lg px-3 py-1 text-sm font-semibold ${statusClass(patient.status)}`}>
                                                                {patient.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-5">
                        <p className="text-gray-600">
                            {totalPatients === 0 ? (
                                "Showing 0 results"
                            ) : (
                                <>
                                    Showing {currentPage} to {patients.length} of{" "}
                                    {totalPatients} results
                                </>
                            )}
                        </p>

                        <div className="flex gap-2">
                            <button disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}
                                className="h-10 w-10 rounded-lg border cursor-pointer text-gray-500 disabled:opacity-40">
                                &lt;
                            </button>
                            {Array.from({ length: totalPages }, (_, index) => (
                                <button key={index} onClick={() => changePage(index + 1)} className={`h-10 w-10 rounded-lg cursor-pointer border ${currentPage === index + 1
                                    ? "bg-blue-600 text-white" : "text-gray-600"}`}>
                                    {index + 1}
                                </button>
                            ))}
                            <button disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}
                                className="h-10 w-10 rounded-lg cursor-pointer border text-gray-500 disabled:opacity-40">
                                &gt;
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

type StatCardProps = {
    icon: React.ReactNode;
    title: string;
    value: string;
    description: string;
};
const StatCard = ({ icon, title, value, description }: StatCardProps) => {
    return (
        <div className="rounded-2xl bg-gray-50 p-6 shadow-lg">
            <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 bg-blue-500 items-center justify-center rounded-2xl text-3xl text-white">
                    {icon}
                </div>
                <div>
                    <p className="font-semibold text-xl text-gray-600">{title}</p>
                    <h2 className="mt-2 text-3xl font-bold text-black">{value}</h2>
                    <p className="mt-2 text-gray-600">{description}</p>
                </div>
            </div>
        </div>
    );
};
type FilterDropdownProps = {
    label: string;
    value: string;
    options: string[];
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (value: string) => void;
};

const FilterDropdown = ({
    label,
    value,
    options,
    isOpen,
    onToggle,
    onSelect,
}: FilterDropdownProps) => {
    return (
        <div className="relative">
            <button type="button" onClick={onToggle} className="flex h-12 w-full items-center justify-between rounded-xl border border-gray-300 bg-gray-50 px-4 text-left font-semibold text-gray-700 transition focus:border-blue-600">
                <span>{label}: <span className="text-blue-600">{value}</span></span>
                <span className={`text-sm transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                    ▼
                </span>
            </button>
            {isOpen && (
                <div className="absolute left-0 top-14 z-50 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                    <div className="max-h-56 overflow-y-auto p-2">
                        {options.map((option) => (
                            <button key={option} type="button" onClick={() => onSelect(option)}
                                className={`mb-1 w-full rounded-lg px-4 py-3 text-left font-medium transition ${value === option ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"}`}>
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};