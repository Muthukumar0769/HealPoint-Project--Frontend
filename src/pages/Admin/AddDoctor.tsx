import { useEffect, useState } from "react";
import { FaUserMd, FaBriefcase, FaMoneyBillWave, FaImage, FaEnvelope, FaUser, FaPlus, } from "react-icons/fa";
import { MdMedicalServices } from "react-icons/md";
import { AdminSidebar } from "../../pages/Admin/AdminSidebar";
import API, { IMAGE_BASE_URL } from "../../api/axios";
import toast from "react-hot-toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { Department, InputBoxProps, SelectBoxProps } from "../../types/admin.ts";
import type { DoctorData } from "../../types/doctor.ts";
import usePageTitle from "../../hooks/usePageTitle";


//-------Main Component---------

export const AddDoctor = () => {
  const { id } = useParams();
  usePageTitle(id ? "Update Doctor" : "Add Doctor");
  const navigate = useNavigate();
  const location = useLocation();
  const doctorFromState = location.state?.doctor as DoctorData | undefined;
  const isEditMode = Boolean(id);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Controls the dropdown list of existing specializations
  const [showSpecializationList, setShowSpecializationList] = useState(false);
  // Controls the "Add New Specialization" form
  const [showAddDepartment, setShowAddDepartment] = useState(false);

  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: "",
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    gender: "",
    role: "doctor",
    specialization: "",
    experience_years: "",
    consultation_fee: "",
    bio: "",
  });

  //----Get a image from doctors page or upload new image---------------

  const getImageUrl = (image?: string | null) => {
    if (!image) return "";

    const cleanImage = image.trim();

    if (cleanImage.startsWith("http")) {
      return cleanImage.replace(/^http:\/\//, "https://");
    }

    if (cleanImage.startsWith("/uploads/")) {
      return `${IMAGE_BASE_URL}${cleanImage}`;
    }

    return `${IMAGE_BASE_URL}/uploads/${cleanImage}`;
  };

  const normalizeDepartment = (item: any): Department => {
    const name =
      typeof item?.name === "string" && item.name.trim()
        ? item.name
        : typeof item?.specialization === "string" && item.specialization.trim()
          ? item.specialization
          : typeof item?.department_name === "string"
            ? item.department_name
            : "";

    return {
      id: Number(item?.id || item?.department_id || item?._id),
      name,
      description: item?.description || item?.sdescription || "",
      doctors: item?.doctors || item?.doctor_count || 0,
    };
  };

  //-------Fetch the departments logic with pagination-----------

  const fetchDepartments = async () => {
    try {
      const res = await API.get("/departments", {
        params: {
          page: 1,
          limit: 100,
        },
      });

      const rawDepartments = res.data?.data?.departments ||
        res.data?.data?.specializations ||
        res.data?.departments ||
        res.data?.specializations ||
        res.data?.data ||
        [];

      const departmentList = Array.isArray(rawDepartments) ? rawDepartments.map(normalizeDepartment) : [];
      setDepartments(departmentList);
    } catch (error) {
      console.log("Fetch departments error:", error);
      toast.error("Failed to load specializations");
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  //---------update the doctor details logic in same add doctor page used the location -------------

  useEffect(() => {
    const loadDoctorForEdit = async () => {
      if (!isEditMode || !id) return;
      try {
        let doctorData = doctorFromState;
        if (!doctorData) {
          const res = await API.get(`/doctors/${id}`);
          doctorData = res.data?.data?.doctor || res.data?.doctor ||
            res.data?.data || res.data;
        }

        if (!doctorData) {
          toast.error("Doctor details not found");
          return;
        }

        setForm({
          name: doctorData.user?.name || "",
          email: doctorData.user?.email || "",
          gender: doctorData.user?.gender || "",
          role: doctorData.user?.role || "doctor",
          specialization: doctorData.specialization || "",
          experience_years: String(doctorData.experience_years || ""),
          consultation_fee: String(doctorData.consultation_fee || ""),
          bio: doctorData.bio || "",
        });

        const existingImage = doctorData.user?.profile_picture || doctorData.image;
        if (existingImage) {
          setPhotoPreview(getImageUrl(existingImage));
        }
      } catch (error) {
        console.log("Fetch doctor edit error:", error);
        toast.error("Failed to load doctor details");
      }
    };
    loadDoctorForEdit();
  }, [isEditMode, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleNewDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewDepartment({
      ...newDepartment,
      [e.target.name]: e.target.value,
    });
  };

  //------Add the new specilaization logic,the specilaization get from specialization page---------

  const handleAddNewSpecialization = async () => {
    if (!newDepartment.name.trim()) {
      toast.error("Specialization name is required");
      return;
    }

    if (!newDepartment.description.trim()) {
      toast.error("Specialization description is required");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/departments", {
        name: newDepartment.name.trim(),
        description: newDepartment.description.trim(),
      });

      // API actually returns: { success, message, specialization: {...} }
      const createdDepartment =
        res.data?.data?.department ||
        res.data?.department ||
        res.data?.specialization ||
        res.data?.data?.specialization ||
        res.data?.data ||
        res.data;

      const department = normalizeDepartment(createdDepartment);

      await fetchDepartments();

      setForm((prev) => ({
        ...prev,
        specialization: department.name || newDepartment.name.trim(),
      }));

      setNewDepartment({ name: "", description: "" });
      setShowAddDepartment(false);
      toast.success("Specialization added successfully");
    } catch (error: any) {
      console.log("Add specialization error:", error);
      toast.error(error.response?.data?.message || "Failed to add specialization");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  //---------Form submit logic-------------

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.specialization) {
      toast.error("Please select specialization");
      return;
    }

    try {
      setLoading(true);
      if (isEditMode) {
        const updateData: any = {
          name: form.name,
          email: form.email,
          gender: form.gender,
          specialization: form.specialization,
          experience_years: Number(form.experience_years),
          consultation_fee: Number(form.consultation_fee),
          bio: form.bio,
        };
        await API.put(`/doctors/${id}`, updateData, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (photo) {
          const photoData = new FormData();
          photoData.append("profile_picture", photo);
          await API.put(`/doctors/${id}/photo`, photoData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        }

        toast.success("Doctor updated successfully");
        navigate("/admin/doctors");
        return;
      }

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("gender", form.gender);
      formData.append("role", form.role);
      formData.append("specialization", form.specialization);
      formData.append("experience_years", form.experience_years);
      formData.append("consultation_fee", form.consultation_fee);
      formData.append("bio", form.bio);

      if (photo) {
        formData.append("profile_picture", photo);
      }

      await API.post("/doctors", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      await API.post("/notifications/doctor", {
        doctorName: form.name,
        specialization: form.specialization
      });

      window.dispatchEvent(new Event("notificationCreated"));
      toast.success("Doctor added successfully");
      navigate("/admin/doctors");
    } catch (error: any) {
      console.log("Doctor submit error:", error);

      toast.error(
        error.response?.data?.message ||
        (isEditMode ? "Failed to update doctor" : "Failed to add doctor")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f4fb] pt-16">
      <AdminSidebar />
      <main className="flex-1 p-4 lg:p-4 xl:px-4">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-5 lg:p-6 shadow-lg">
          <h1 className="text-xl font-bold text-gray-900">
            {isEditMode ? "Update Doctor" : "Add Doctor"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEditMode ? "Update doctor details." : "Fill the doctor details and upload a photo."}
          </p>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="flex justify-center">
              <label className="relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-white bg-blue-50 shadow-xl ring-4 ring-blue-100">
                {photoPreview ? (
                  <img src={photoPreview} alt="doctor" className="h-full w-full rounded-full object-cover object-top"
                    onError={(e) => {
                      console.log("Image failed:", photoPreview);
                      e.currentTarget.src = "";
                      setPhotoPreview(null);}}/>
                ) : (
                  <div className="text-center text-blue-600">
                    <FaImage className="mx-auto text-3xl" />
                    <p className="mt-2 text-sm font-medium">Add Photo</p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>
            <InputBox icon={<FaUserMd />} label="Doctor Name" name="name" value={form.name} onChange={handleChange}
              placeholder="Enter doctor name" />
            <InputBox icon={<FaEnvelope />} label="Email" name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="Enter email" />
            <div>
              <label className="mb-2 block font-semibold text-gray-700">Gender</label>
              <div className="flex flex-wrap items-center gap-8 px-5 py-4">
                {["Male", "Female", "Others"].map((gender) => (
                  <label key={gender} className="flex cursor-pointer items-center gap-2 text-gray-700" >
                    <input type="radio" name="gender" value={gender} checked={form.gender === gender}
                      onChange={handleChange} required className="accent-blue-600" />{gender}</label>
                ))}
              </div>
            </div>
            <SelectBox icon={<FaUser />} label="Role" name="role" value={form.role} onChange={handleChange} options={["doctor"]} />

            {/* -------- Specialization Section -------- */}
            <div className="relative">
              <label className="mb-2 block font-semibold text-gray-700">Specialization</label>
              <div className="rounded-2xl border border-gray-300 bg-white shadow-sm">
                <button type="button" onClick={() => {
                  setShowSpecializationList(!showSpecializationList);
                  setShowAddDepartment(false);
                }}
                  className="flex w-full items-center justify-between px-5 py-4" >
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-blue-100 p-3 text-blue-600">
                      <MdMedicalServices className="text-lg" />
                    </span>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">
                        {form.specialization || "Select Specialization"}
                      </h3>
                      <p className="text-sm text-gray-500"> Choose doctor department</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={(e) => {
                      e.stopPropagation();
                      setShowSpecializationList(false);
                      setShowAddDepartment(true);
                    }}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                      <FaPlus />
                    </button>
                    <span className={`transition-transform duration-300 ${showSpecializationList ? "rotate-180" : ""}`}>▼</span>
                  </div>
                </button>

                {showSpecializationList && (
                  <div className="border-t border-gray-200 bg-gray-50 p-3">
                    <div className="max-h-64 overflow-y-auto rounded-2xl">
                      <div className="space-y-2">
                        {departments.map((dept) => {
                          const isSelected = form.specialization === dept.name;
                          return (
                            <button key={dept.id} type="button"
                              onClick={() => {
                                setForm((prev) => ({
                                  ...prev,
                                  specialization: dept.name,
                                }));
                                setShowSpecializationList(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all duration-300 ${isSelected
                                ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50"}`}>
                              <div>
                                <h4 className="font-bold">{dept.name}</h4>
                              </div>
                            </button>
                          );
                        })}
                        {departments.length === 0 && (
                          <p className="p-3 text-sm text-gray-500">No specializations found. Use the + button to add one.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {form.specialization && (
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3 text-green-700">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="font-semibold">Selected: {form.specialization}</span>
                </div>
              )}
            </div>

            {/* -------- Add New Specialization Form -------- */}
            {showAddDepartment && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Add New Specialization</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <input type="text" name="name" value={newDepartment.name} onChange={handleNewDepartmentChange} placeholder="Specialization name"
                    className="h-12 rounded-xl border border-gray-300 px-4 outline-none focus:border-blue-600" />
                  <input type="text" name="description" value={newDepartment.description} onChange={handleNewDepartmentChange} placeholder="Description"
                    className="h-12 rounded-xl border border-gray-300 px-4 outline-none focus:border-blue-600" />
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  <button type="button"
                    onClick={() => {
                      setShowAddDepartment(false);
                      setNewDepartment({ name: "", description: "" });
                    }}
                    className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-100">
                    Cancel
                  </button>
                  <button type="button" onClick={handleAddNewSpecialization} disabled={loading}
                    className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-60">
                    {loading ? "Adding..." : "Add Specialization"}
                  </button>
                </div>
              </div>
            )}

            <InputBox icon={<FaBriefcase />} label="Experience Years" name="experience_years" type="number" value={form.experience_years}
              onChange={handleChange} placeholder="Example: 10" />
            <InputBox icon={<FaMoneyBillWave />} label="Consultation Fee" name="consultation_fee" type="number" value={form.consultation_fee}
              onChange={handleChange} placeholder="Enter consultation fee" />
            <div>
              <label className="mb-2 block font-semibold text-gray-700">Bio</label>
              <textarea name="bio" value={form.bio} onChange={handleChange} rows={5} placeholder="Write about doctor..."
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500" />
            </div>
            <button type="submit" disabled={loading} className={`w-full cursor-pointer rounded-xl py-3 text-base font-semibold text-white transition disabled:opacity-60 ${isEditMode
              ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`} >
              {loading ? isEditMode ? "Updating Doctor..." : "Adding Doctor..." : isEditMode ? "Update Doctor" : "Add Doctor"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

const InputBox = ({ label, name, value, placeholder, type = "text", icon, onChange }: InputBoxProps) => {
  return (
    <div>
      <label className="mb-2 block font-semibold text-gray-700">{label}</label>
      <div className="flex items-center gap-3 rounded-xl border border-gray-300 px-4 py-3 focus-within:border-blue-500">
        <span className="text-blue-600">{icon}</span>
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
          className="w-full bg-transparent outline-none" />
      </div>
    </div>
  );
};

const SelectBox = ({ label, name, value, icon, options, onChange }: SelectBoxProps) => {
  return (
    <div>
      <label className="mb-2 block font-semibold text-gray-700">{label}</label>
      <div className="flex items-center gap-3 rounded-xl border border-gray-300 px-4 py-3 focus-within:border-blue-500">
        <span className="text-blue-600">{icon}</span>
        <select name={name} value={value} onChange={onChange} className="w-full bg-transparent outline-none">
          <option value="">Select {label}</option>
          {options.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>
    </div>
  );
};