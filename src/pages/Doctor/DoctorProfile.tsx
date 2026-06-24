import { useEffect, useState } from "react";
import {
  FaCamera, FaCalendarAlt, FaEnvelope, FaSave, FaStar, FaStethoscope, FaTimes,
  FaUserMd, FaUsers, FaGraduationCap,
} from "react-icons/fa";
import { MdWorkspacePremium, MdMedicalServices } from "react-icons/md";
import toast from "react-hot-toast";
import API, { IMAGE_BASE_URL } from "../../api/axios";
import { DoctorSidebar } from "../Doctor/DoctorSidebar";
import type { Department } from "../../types/doctor.ts";
import usePageTitle from "../../hooks/usePageTitle";

const useProfileImage = (raw: string) => {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    if (!raw) { setSrc(""); return; }
    if (raw.startsWith("blob:")) { setSrc(raw); return; }

    const fullUrl = raw.startsWith("http")
      ? raw.replace(/^http:\/\//, "https://")
      : `${IMAGE_BASE_URL}/uploads/${raw}`;

    fetch(fullUrl, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.blob();
      })
      .then((blob) => setSrc(URL.createObjectURL(blob)))
      .catch(() => setSrc(""));
  }, [raw]);

  return src;
};

type ProfileStats = {
  appointments: number;
  patients: number;
};

export const DoctorProfile = () => {
  usePageTitle("My Profile");
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [specializationOpen, setSpecializationOpen] = useState(false);
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    appointments: 0,
    patients: 0,
  });

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    gender: "",
    specialization: "",
    experience_years: "",
    consultation_fee: "",
    education: "",
    bio: "",
    profile_picture: "",
  });

  const fetchDepartments = async () => {
    try {
      const res = await API.get("/departments", {
        params: { page: 1, limit: 100 },
      });

      const rawDepartments =
        res.data?.data?.departments ||
        res.data?.data?.specializations ||
        res.data?.data?.rows ||
        res.data?.departments ||
        res.data?.specializations ||
        res.data?.rows ||
        res.data?.data ||
        [];

      const list = Array.isArray(rawDepartments)
        ? rawDepartments.map((item: any) => ({
          id: Number(item.id || item.department_id || item._id),
          name:
            item.name ||
            item.specialization ||
            item.department_name ||
            item.title ||
            "",
        }))
        : [];

      setDepartments(list);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load specializations");
    }
  };

  const fetchDoctor = async () => {
    try {
      setLoading(true);

      const storedUser = localStorage.getItem("user");
      const loginUser = storedUser ? JSON.parse(storedUser) : null;
      const res = await API.get("/doctors/me");
      const doctor = res.data?.data?.doctor || res.data?.doctor || res.data?.data || res.data;

      if (!doctor?.id) {
        toast.error("Doctor profile not found");
        return;
      }

      const id = Number(doctor.id);
      setDoctorId(id);
      localStorage.setItem("user",
        JSON.stringify({
          ...loginUser,
          doctorId: id,
        })
      );

      setProfile({
        name: doctor.user?.name || loginUser?.name || "",
        email: doctor.user?.email || loginUser?.email || "",
        gender: doctor.user?.gender || "",
        specialization: doctor.specialization || "",
        experience_years: String(doctor.experience_years || ""),
        consultation_fee: String(doctor.consultation_fee || ""),
        education: doctor.education || "",
        bio: doctor.bio || "",
        profile_picture: doctor.user?.profile_picture || doctor.image || "",
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileStats = async () => {
    try {
      const res = await API.get("/doctor/my-appointments", {
        params: {
          page: 1,
          limit: 10000,
        },
      });

      const rawAppointments =
        res.data?.data?.appointments ||
        res.data?.appointments ||
        res.data?.data?.rows ||
        res.data?.rows ||
        res.data?.data ||
        [];

      const appointments = Array.isArray(rawAppointments)
        ? rawAppointments
        : [];

      const totalAppointments =
        res.data?.data?.totalCount ||
        res.data?.data?.total ||
        res.data?.totalCount ||
        res.data?.total ||
        appointments.length;

      const uniquePatients = new Set<string>();
      appointments.forEach((item: any) => {
        const patientKey =
          item.patientId ||
          item.patient_id ||
          item.Patient?.id ||
          item.patient?.id ||
          item.userId ||
          item.patientName ||
          item.Patient?.email ||
          item.patient?.email;

        if (patientKey) {
          uniquePatients.add(String(patientKey));
        }
      });

      setProfileStats({
        appointments: Number(totalAppointments) || appointments.length,
        patients: uniquePatients.size,
      });
    } catch (error) {
      console.log(error);
      setProfileStats({
        appointments: 0,
        patients: 0,
      });
    }
  };

  useEffect(() => {
    fetchDoctor();
    fetchDepartments();
    fetchProfileStats();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setProfile((prev) => ({
      ...prev,
      profile_picture: URL.createObjectURL(file),
    }));
  };

  const handleCancel = () => {
    setIsEdit(false);
    setSelectedImage(null);
    setSpecializationOpen(false);
    fetchDoctor();
  };

  const handleSave = async () => {
    if (!doctorId) {
      toast.error("Doctor id missing");
      return;
    }

    try {
      setLoading(true);
      const detailsForm = new FormData();
      detailsForm.append("specialization", profile.specialization);
      detailsForm.append("experience_years", profile.experience_years);
      detailsForm.append("consultation_fee", profile.consultation_fee);
      detailsForm.append("education", profile.education);
      detailsForm.append("bio", profile.bio);
      await API.put(`/doctors/${doctorId}`, detailsForm);

      if (selectedImage) {
        const imageForm = new FormData();
        imageForm.append("profile_picture", selectedImage);

        await API.put(`/doctors/${doctorId}/photo`, imageForm, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      toast.success("Profile updated successfully");
      setIsEdit(false);
      setSelectedImage(null);
      setSpecializationOpen(false);
      fetchDoctor();
      fetchProfileStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = useProfileImage(profile.profile_picture);

  return (
    <div className="min-h-screen bg-[#f0f4fb] lg:flex pt-20">
      <DoctorSidebar />
      <main className="w-full flex-1 px-3 pt-6 pb-6 sm:px-4 lg:px-6 lg:py-6">
        <div className="mb-5 flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-lg shadow-blue-100 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl lg:text-3xl">
              Doctor <span className="text-blue-600">Profile</span>
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              View and update your professional information
            </p>
          </div>

          {!isEdit && (
            <button onClick={() => setIsEdit(true)} className="w-full cursor-pointer rounded-2xl bg-blue-600 px-6 py-4 font-semibold text-white shadow-lg transition hover:bg-blue-700 sm:w-fit">
              Update Profile
            </button>
          )}
        </div>

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 p-4 shadow-2xl sm:p-6 lg:p-7">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="relative z-10 flex flex-col items-center gap-8 text-center lg:flex-row lg:text-left">
            <div className="relative h-36 w-36 shrink-0 sm:h-44 sm:w-44">
              {imageUrl ? (
                <img src={imageUrl} alt="Doctor" className="h-full w-full rounded-full border-[6px] border-white object-cover object-top shadow-2xl" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white shadow-2xl">
                  <FaUserMd className="text-6xl text-blue-500" />
                </div>
              )}

              {isEdit && (
                <label className="absolute bottom-2 right-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white shadow-lg">
                  <FaCamera className="text-blue-600" />
                  <input type="file" hidden accept="image/*" onChange={handleImage} />
                </label>
              )}
            </div>
            <div className="w-full flex-1 text-white">
              <h2 className="text-2xl font-extrabold sm:text-3xl">
                Dr. {profile.name || "Doctor"}
              </h2>
              <p className="mt-3 flex justify-center gap-2 text-lg font-semibold text-blue-100 sm:text-2xl lg:justify-start">
                <MdMedicalServices />
                {profile.specialization || "Specialist"}
              </p>
              <div className="mt-5 flex justify-center gap-1 text-xl text-yellow-300 sm:text-2xl lg:justify-start">
                {[...Array(5)].map((_, index) => (
                  <FaStar key={index} />
                ))}
              </div>
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <InfoCard icon={<FaCalendarAlt />} title="Appointments" value={String(profileStats.appointments)} />
                <InfoCard icon={<MdWorkspacePremium />} title="Experience" value={`${profile.experience_years || 0}+ Years`} />
                <InfoCard icon={<FaUsers />} title="Patients" value={String(profileStats.patients)} />
              </div>
            </div>
          </div>
        </section>
        <section className="mt-5 rounded-3xl bg-white shadow-xl shadow-blue-100">
          <div className="border-b border-blue-100 bg-blue-50 px-4 py-4 sm:px-6">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Personal Information
            </h2>
          </div>
          <div className="space-y-5 p-4 sm:p-6">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <InputField label="Full Name" value={profile.name} icon={<FaUserMd />} readOnly />
              <InputField label="Email Address" value={profile.email} icon={<FaEnvelope />} readOnly />
              <InputField label="Gender" value={profile.gender} readOnly />
              <InputField label="Experience Years" name="experience_years" value={profile.experience_years} onChange={handleChange}
                icon={<FaCalendarAlt />} readOnly={!isEdit} />
              <SpecializationDropdown value={profile.specialization} departments={departments} disabled={!isEdit}
                isOpen={specializationOpen} setIsOpen={setSpecializationOpen}
                onSelect={(value) =>
                  setProfile((prev) => ({
                    ...prev,
                    specialization: value,
                  }))
                } />
              <InputField label="Consultation Fee" name="consultation_fee" value={profile.consultation_fee}
                onChange={handleChange} icon={<FaStethoscope />} readOnly={!isEdit} />
              <InputField label="Education" name="education" value={profile.education} onChange={handleChange}
                icon={<FaGraduationCap />} readOnly={!isEdit} />
            </div>
            <div>
              <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-slate-500">
                Bio
              </label>
              <textarea rows={5} name="bio" value={profile.bio} onChange={handleChange} readOnly={!isEdit}
                className={`w-full resize-none rounded-2xl border p-4 text-base font-medium text-slate-800 outline-none transition sm:p-5 sm:text-lg ${isEdit ? "border-slate-300 bg-white focus:border-blue-600" : "border-blue-100 bg-blue-50"}`} />
            </div>
            {isEdit && (
              <div className="flex flex-col gap-3 border-t border-blue-100 pt-6 sm:flex-row sm:justify-end">
                <button type="button" onClick={handleCancel} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 px-8 py-3 font-semibold text-slate-700 hover:bg-slate-50">
                  <FaTimes /> Cancel
                </button>
                <button type="button" onClick={handleSave} disabled={loading} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg disabled:opacity-60">
                  <FaSave /> {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

const SpecializationDropdown = ({ value, departments, disabled, isOpen, setIsOpen, onSelect, }: {
  value: string;
  departments: Department[];
  disabled: boolean;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  onSelect: (value: string) => void;
}) => (
  <div className="relative">
    <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-slate-500">
      Specialization
    </label>
    <button type="button" disabled={disabled} onClick={() => setIsOpen(!isOpen)}
      className={`flex h-14 w-full items-center justify-between rounded-2xl border px-4 text-left transition sm:h-16 ${disabled ? "cursor-not-allowed border-blue-100 bg-blue-50" : "border-slate-300 bg-white focus:border-blue-600"}`}>
      <span className="flex min-w-0 items-center gap-3">
        <MdMedicalServices className="shrink-0 text-lg text-blue-500" />
        <span className="truncate text-base font-semibold text-slate-800">
          {value || "Select Specialization"}
        </span>
      </span>
      {!disabled && <span className={isOpen ? "rotate-180" : ""}>▼</span>}
    </button>
    {isOpen && !disabled && (
      <div className="absolute left-0 top-[86px] z-50 w-full rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="max-h-60 overflow-y-auto p-2">
          {departments.map((dept) => (
            <button key={dept.id} type="button" onClick={() => {
              onSelect(dept.name);
              setIsOpen(false);
            }}
              className="w-full rounded-xl px-4 py-3 text-left font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700" >
              {dept.name}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
);

const InfoCard = ({ icon, title, value, }: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) => (
  <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
    <div className="flex items-center justify-center gap-4 lg:justify-start">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white">
        {icon}
      </div>

      <div>
        <p className="text-sm font-medium text-blue-100">{title}</p>
        <h3 className="text-base font-extrabold text-white">{value}</h3>
      </div>
    </div>
  </div>
);

const InputField = ({ label, icon, readOnly, ...props }: any) => (
  <div>
    <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-slate-500">
      {label}
    </label>
    <div className={`flex h-14 items-center rounded-2xl border px-4 transition sm:h-16 ${readOnly ? "border-blue-100 bg-blue-50" : "border-slate-300 bg-white focus-within:border-blue-600"}`}>
      {icon && <span className="shrink-0 text-lg text-blue-500">{icon}</span>}
      <input {...props} readOnly={readOnly} className="h-full min-w-0 flex-1 bg-transparent px-3 text-base font-semibold text-slate-800 outline-none" />
    </div>
  </div>
);