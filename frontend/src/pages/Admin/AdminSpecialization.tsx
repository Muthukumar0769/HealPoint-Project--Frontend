import { useEffect, useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import {FaEdit,FaPlus,FaSearch,FaTrash,FaTimes,FaSave,} from "react-icons/fa";
import { MdGridView } from "react-icons/md";
import API from "../../api/axios";
import toast from "react-hot-toast";

type Specialization = {
  id: number;
  name: string;
  description: string;
  doctors: number;
};

export const AdminSpecialization = () => {
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDepartments, setTotalDepartments] = useState(0);

  const normalizeDepartment = (item: any): Specialization => ({
    id: Number(item.id || item.department_id || item._id),
    name: item.name || item.specialization || item.department_name || "",
    description: item.description || item.sdescription || "",
    doctors: 0,
  });

  const getDoctorCounts = async () => {
    const res = await API.get("/doctors", {
      params: { page: 1, limit: 1000 },
    });

    const doctors =
      res.data?.data?.doctors ||
      res.data?.doctors ||
      res.data?.data ||
      [];

    const counts: Record<string, number> = {};

    if (Array.isArray(doctors)) {
      doctors.forEach((doctor: any) => {
        const specialization = doctor.specialization?.trim().toLowerCase();

        if (specialization) {
          counts[specialization] = (counts[specialization] || 0) + 1;
        }
      });
    }

    return counts;
  };

  const fetchSpecializations = async () => {
    try {
      setLoading(true);

      const [deptRes, doctorCounts] = await Promise.all([
        API.get("/departments", {
          params: {
            page,
            limit,
            search: search.trim() || undefined,
          },
        }),
        getDoctorCounts(),
      ]);

      const rawDepartments =
        deptRes.data?.data?.departments ||
        deptRes.data?.data?.specializations ||
        deptRes.data?.departments ||
        deptRes.data?.specializations ||
        deptRes.data?.data ||
        [];

      const departments = Array.isArray(rawDepartments)
        ? rawDepartments.map((item: any) => {
            const dept = normalizeDepartment(item);

            return {
              ...dept,
              doctors: doctorCounts[dept.name.trim().toLowerCase()] || 0,
            };
          })
        : [];

      setSpecializations(departments);
      setTotalPages(
        deptRes.data?.data?.totalPages || deptRes.data?.totalPages || 1
      );
      setTotalDepartments(
        deptRes.data?.data?.total ||
          deptRes.data?.total ||
          departments.length ||
          0
      );
    } catch (error: any) {
      console.log("Fetch departments error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch departments");
      setSpecializations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchSpecializations, 400);
    return () => clearTimeout(timer);
  }, [page, search]);

  const openAddForm = () => {
    setIsFormOpen(true);
    setEditingId(null);
    setForm({ name: "", description: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEditForm = async (item: Specialization) => {
    try {
      setLoading(true);

      const res = await API.get(`/departments/${item.id}`);

      const rawDepartment =
        res.data?.data?.department ||
        res.data?.data?.specialization ||
        res.data?.department ||
        res.data?.specialization ||
        res.data?.data ||
        res.data;

      const department = normalizeDepartment(rawDepartment);

      setEditingId(item.id);
      setForm({
        name: department.name || item.name,
        description: department.description || item.description,
      });

      setIsFormOpen(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to open edit form");
    } finally {
      setLoading(false);
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm({ name: "", description: "" });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error("Specialization name is required");
    if (!form.description.trim()) return toast.error("Description is required");

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
      };

      if (editingId) {
        await API.put(`/departments/${editingId}`, payload);
        toast.success("Specialization updated successfully");
      } else {
        await API.post("/departments", payload);

        await API.post("/notifications/department", {
          departmentName: payload.name,
        });

        window.dispatchEvent(new Event("notificationCreated"));
        toast.success("Specialization added successfully");
        setPage(1);
      }

      closeForm();
      fetchSpecializations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this specialization?"))
      return;

    try {
      setLoading(true);
      await API.delete(`/departments/${id}`);
      toast.success("Specialization deleted successfully");
      fetchSpecializations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-20 lg:flex">
      <AdminSidebar />

      <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
              Specializations
            </h1>
            <p className="mt-1 text-sm text-gray-500 sm:text-base">
              Manage all the Medical Specializations
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow hover:bg-blue-700 sm:w-auto"
          >
            <FaPlus /> Add Specialization
          </button>
        </div>

        {isFormOpen && (
          <div className="mb-6 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {editingId ? "Edit Specialization" : "Add Specialization"}
              </h2>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl bg-gray-100 p-3 hover:bg-gray-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Specialization"
                className="h-12 rounded-xl border border-gray-300 px-4 outline-none focus:border-blue-600"
              />

              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Description"
                className="h-12 rounded-xl border border-gray-300 px-4 outline-none focus:border-blue-600"
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeForm}
                className="flex items-center justify-center gap-2 rounded-xl border px-6 py-3 font-semibold"
              >
                <FaTimes /> Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-60"
              >
                {editingId ? <FaSave /> : <FaPlus />}
                {editingId ? "Save Changes" : "Add"}
              </button>
            </div>
          </div>
        )}

        <div className="mb-6 w-full rounded-2xl bg-white p-5 shadow-sm sm:max-w-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white">
              <MdGridView />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-600 sm:text-base">
                Total Specializations
              </p>
              <h2 className="mt-1 text-2xl font-bold text-black">
                {totalDepartments}
              </h2>
              <p className="text-sm text-gray-500">All Specializations</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm">
          <div className="p-4 sm:p-5">
            <div className="flex h-12 w-full items-center gap-3 rounded-xl border border-gray-300 px-4 hover:border-blue-400 sm:max-w-md">
              <FaSearch className="text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search Specialization"
                className="h-full w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-gray-50 text-sm uppercase text-gray-600">
                <tr>
                  <th className="px-6 py-5">#</th>
                  <th className="px-6 py-5">Specialization</th>
                  <th className="px-6 py-5">Description</th>
                  <th className="px-6 py-5">Doctors</th>
                  <th className="px-6 py-5">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading && !isFormOpen ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center font-semibold text-blue-600"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : specializations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center font-semibold text-gray-500"
                    >
                      No specializations found
                    </td>
                  </tr>
                ) : (
                  specializations.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-t border-gray-200 text-gray-700"
                    >
                      <td className="px-6 py-5">
                        {(page - 1) * limit + index + 1}
                      </td>
                      <td className="px-6 py-5 font-bold">{item.name}</td>
                      <td className="px-6 py-5">{item.description}</td>
                      <td className="px-6 py-5 font-bold">{item.doctors}</td>
                      <td className="px-6 py-5">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => openEditForm(item)}
                            className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-blue-600 hover:bg-blue-100"
                          >
                            <FaEdit /> Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-600 hover:bg-red-100"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 p-4 lg:hidden">
            {loading && !isFormOpen ? (
              <p className="py-8 text-center font-semibold text-blue-600">
                Loading...
              </p>
            ) : specializations.length === 0 ? (
              <p className="py-8 text-center font-semibold text-gray-500">
                No specializations found
              </p>
            ) : (
              specializations.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-400">
                        #{(page - 1) * limit + index + 1}
                      </p>
                      <h3 className="text-lg font-bold text-gray-900">
                        {item.name}
                      </h3>
                    </div>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
                      {item.doctors} Doctors
                    </span>
                  </div>

                  <p className="mb-4 text-sm leading-6 text-gray-600">
                    {item.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => openEditForm(item)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-3 font-semibold text-blue-600"
                    >
                      <FaEdit /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-600"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-200 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-center text-sm text-gray-600 sm:text-left">
              Showing {totalDepartments === 0 ? 0 : (page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, totalDepartments)} of {totalDepartments}{" "}
              results
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="h-10 w-10 rounded-lg border disabled:opacity-40"
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setPage(index + 1)}
                  className={`h-10 w-10 rounded-lg border ${
                    page === index + 1
                      ? "bg-blue-600 text-white"
                      : "bg-white"
                  }`}
                >
                  {index + 1}
                </button>
              ))}

              <button
                disabled={page === totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="h-10 w-10 rounded-lg border disabled:opacity-40"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};