import { useEffect, useState } from "react";
import {FaCamera, FaCalendarAlt, FaEnvelope, FaSave, FaStar, FaStethoscope, FaTimes,
  FaUserMd, FaUsers, FaGraduationCap} from "react-icons/fa";
import { MdWorkspacePremium, MdMedicalServices } from "react-icons/md";
import toast from "react-hot-toast";
import API, { IMAGE_BASE_URL } from "../../api/axios";
import { DoctorSidebar } from "../Doctor/DoctorSidebar";
import type { Department } from "../../types/doctor.ts";
import usePageTitle from "../../hooks/usePageTitle";

//------Get a image---------

const useProfileImage = (raw: string) => {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    if (!raw) { setSrc(""); return; }
    if (raw.startsWith("blob:")) { setSrc(raw); return; }
    const fullUrl = raw.startsWith("http") ? raw.replace(/^http:\/\//, "https://") : `${IMAGE_BASE_URL}/uploads/${raw}`;
    fetch(fullUrl, { headers: { "ngrok-skip-browser-warning": "true" } })
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.blob(); })
      .then((blob) => setSrc(URL.createObjectURL(blob)))
      .catch(() => setSrc(""));
  }, [raw]);
  return src;
};

type ProfileStats = { appointments: number; patients: number };

//-------Main Component------------

export const DoctorProfile = () => {
  usePageTitle("My Profile");
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [specializationOpen, setSpecializationOpen] = useState(false);
  const [profileStats, setProfileStats] = useState<ProfileStats>({ appointments: 0, patients: 0 });
  const [profile, setProfile] = useState({
    name: "", email: "", gender: "", specialization: "", experience_years: "",
    consultation_fee: "", education: "", bio: "", profile_picture: "",
  });

//----------Fetch the specilization from this API-----------------

  const fetchDepartments = async () => {
    try {
      const res = await API.get("/departments", { params: { page: 1, limit: 100 } });
      const rawDepartments = res.data?.data?.departments || res.data?.data?.specializations || res.data?.data?.rows || res.data?.departments || res.data?.specializations || res.data?.rows || res.data?.data || [];
      const list = Array.isArray(rawDepartments) ? rawDepartments.map((item: any) => ({
        id: Number(item.id || item.department_id || item._id),
        name: item.name || item.specialization || item.department_name || item.title || "",
      })) : [];
      setDepartments(list);
    } catch { toast.error("Failed to load specializations"); }
  };

  //--------Fetch the Doctor Profile details-----------

  const fetchDoctor = async () => {
    try {
      setLoading(true);
      const storedUser = localStorage.getItem("user");
      const loginUser = storedUser ? JSON.parse(storedUser) : null;
      const res = await API.get("/doctors/me");
      const doctor = res.data?.data?.doctor || res.data?.doctor || res.data?.data || res.data;
      if (!doctor?.id) { toast.error("Doctor profile not found"); return; }
      const id = Number(doctor.id);
      setDoctorId(id);
      localStorage.setItem("user", JSON.stringify({ ...loginUser, doctorId: id }));
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
    } finally { setLoading(false); }
  };

  const fetchProfileStats = async () => {
    try {
      const res = await API.get("/doctor/my-appointments", { params: { page: 1, limit: 10000 } });
      const rawAppointments = res.data?.data?.appointments || res.data?.appointments || res.data?.data?.rows || res.data?.rows || res.data?.data || [];
      const appointments = Array.isArray(rawAppointments) ? rawAppointments : [];
      const totalAppointments = res.data?.data?.totalCount || res.data?.data?.total || res.data?.totalCount || res.data?.total || appointments.length;
      const uniquePatients = new Set<string>();
      appointments.forEach((item: any) => {
        const patientKey = item.patientId || item.patient_id || item.Patient?.id || item.patient?.id || item.userId || item.patientName || item.Patient?.email || item.patient?.email;
        if (patientKey) uniquePatients.add(String(patientKey));
      });
      setProfileStats({ appointments: Number(totalAppointments) || appointments.length, patients: uniquePatients.size });
    } catch { setProfileStats({ appointments: 0, patients: 0 }); }
  };

  useEffect(() => { fetchDoctor(); fetchDepartments(); fetchProfileStats(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setProfile((prev) => ({ ...prev, profile_picture: URL.createObjectURL(file) }));
  };

  const handleCancel = () => {
    setIsEdit(false); setSelectedImage(null); setSpecializationOpen(false); fetchDoctor();
  };

  const handleSave = async () => {
    if (!doctorId) { toast.error("Doctor id missing"); return; }
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
        await API.put(`/doctors/${doctorId}/photo`, imageForm, { headers: { "Content-Type": "multipart/form-data" } });
      }
      toast.success("Profile updated successfully");
      setIsEdit(false); setSelectedImage(null); setSpecializationOpen(false);
      fetchDoctor(); fetchProfileStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally { setLoading(false); }
  };

  const imageUrl = useProfileImage(profile.profile_picture);

  return (
    <div className="flex min-h-screen bg-[#f0f4fb]">
      <DoctorSidebar />
      <main className="min-w-0 flex-1 px-3 pb-8 pt-16 sm:px-4 sm:pt-20 lg:px-6 lg:pt-22 xl:px-7">

        {/* Header */}
        <div className="mb-4 flex flex-col gap-2 rounded-xl bg-white p-3 shadow-lg shadow-blue-100 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:p-4">
          <div className="min-w-0">
            <h1 className="text-base font-extrabold text-slate-900 sm:text-xl lg:text-2xl">
              Doctor <span className="text-blue-600">Profile</span>
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              View and update your professional information
            </p>
          </div>
          {!isEdit && (
            <button onClick={() => setIsEdit(true)}
              className="self-start rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-blue-700 sm:self-auto sm:px-5 sm:py-2.5 sm:text-sm cursor-pointer">
              Update Profile
            </button>
          )}
        </div>
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 p-4 shadow-xl sm:rounded-2xl sm:p-5 lg:p-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 sm:-right-16 sm:-top-16 sm:h-56 sm:w-56" />
          <div className="relative z-10 flex flex-col items-center gap-4 text-center sm:gap-5 lg:flex-row lg:text-left">
            {/* Avatar */}
            <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28 md:h-32 md:w-32">
              {imageUrl ? (
                <img src={imageUrl} alt="Doctor" className="h-full w-full rounded-full border-4 border-white object-cover object-top shadow-xl" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white shadow-xl">
                  <FaUserMd className="text-3xl text-blue-500 sm:text-4xl" />
                </div>
              )}
              {isEdit && (
                <label className="absolute bottom-1 right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white shadow-lg sm:h-9 sm:w-9">
                  <FaCamera className="text-xs text-blue-600 sm:text-sm" />
                  <input type="file" hidden accept="image/*" onChange={handleImage} />
                </label>
              )}
            </div>
            <div className="w-full min-w-0 flex-1 text-white">
              <h2 className="break-words text-lg font-extrabold sm:text-xl md:text-2xl">
                Dr. {profile.name || "Doctor"}
              </h2>
              <p className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-sm font-semibold text-blue-100 sm:text-base lg:justify-start">
                <MdMedicalServices />
                {profile.specialization || "Specialist"}
              </p>
              <div className="mt-2 flex justify-center gap-1 text-base text-yellow-300 sm:text-lg lg:justify-start">
                {[...Array(5)].map((_, i) => <FaStar key={i} />)}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                <InfoCard icon={<FaCalendarAlt />} title="Appointments" value={String(profileStats.appointments)} />
                <InfoCard icon={<MdWorkspacePremium />} title="Experience" value={`${profile.experience_years || 0}+ Yrs`} />
                <InfoCard icon={<FaUsers />} title="Patients" value={String(profileStats.patients)} />
              </div>
            </div>
          </div>
        </section>
        <section className="mt-4 rounded-xl bg-white shadow-xl shadow-blue-100 sm:rounded-2xl">
          <div className="border-b border-blue-100 bg-blue-50 px-4 py-3 sm:px-5 sm:py-3.5">
            <h2 className="text-sm font-bold text-slate-900 sm:text-base lg:text-lg">Personal Information</h2>
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              <InputField label="Full Name" value={profile.name} icon={<FaUserMd />} readOnly />
              <InputField label="Email Address" value={profile.email} icon={<FaEnvelope />} readOnly />
              <InputField label="Gender" value={profile.gender} readOnly />
              <InputField label="Experience Years" name="experience_years" value={profile.experience_years}
                onChange={handleChange} icon={<FaCalendarAlt />} readOnly={!isEdit} />
              <SpecializationDropdown value={profile.specialization} departments={departments} disabled={!isEdit}
                isOpen={specializationOpen} setIsOpen={setSpecializationOpen}
                onSelect={(value) => setProfile((prev) => ({ ...prev, specialization: value }))} />
              <InputField label="Consultation Fee" name="consultation_fee" value={profile.consultation_fee}
                onChange={handleChange} icon={<FaStethoscope />} readOnly={!isEdit} />
              <InputField label="Education" name="education" value={profile.education}
                onChange={handleChange} icon={<FaGraduationCap />} readOnly={!isEdit} />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">Bio</label>
              <textarea rows={4} name="bio" value={profile.bio} onChange={handleChange} readOnly={!isEdit}
                className={`w-full resize-none rounded-xl border p-3 text-xs font-medium text-slate-800 outline-none transition sm:rounded-xl sm:p-3.5 sm:text-sm ${isEdit ? "border-slate-300 bg-white focus:border-blue-600" : "border-blue-100 bg-blue-50"}`} />
            </div>
            {isEdit && (
              <div className="flex flex-col gap-2 border-t border-blue-100 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={handleCancel}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:px-5 sm:text-sm">
                  <FaTimes /> Cancel
                </button>
                <button type="button" onClick={handleSave} disabled={loading}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow disabled:opacity-60 sm:px-5 sm:text-sm">
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

const SpecializationDropdown = ({ value, departments, disabled, isOpen, setIsOpen, onSelect }: {
  value: string; departments: Department[]; disabled: boolean;
  isOpen: boolean; setIsOpen: (v: boolean) => void; onSelect: (v: string) => void;
}) => (
  <div className="relative min-w-0">
    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">Specialization</label>
    <button type="button" disabled={disabled} onClick={() => setIsOpen(!isOpen)}
      className={`flex h-10 w-full items-center justify-between rounded-xl border px-3 text-left transition sm:h-11 ${disabled ? "cursor-not-allowed border-blue-100 bg-blue-50" : "border-slate-300 bg-white focus:border-blue-600"}`}>
      <span className="flex min-w-0 items-center gap-2">
        <MdMedicalServices className="shrink-0 text-sm text-blue-500" />
        <span className="truncate text-xs font-semibold text-slate-800 sm:text-sm">
          {value || "Select Specialization"}
        </span>
      </span>
      {!disabled && <span className={`shrink-0 text-[10px] transition ${isOpen ? "rotate-180" : ""}`}>▼</span>}
    </button>
    {isOpen && !disabled && (
      <div className="absolute left-0 top-[52px] z-50 w-full rounded-xl border border-blue-100 bg-white shadow-2xl sm:top-[56px]">
        <div className="max-h-52 overflow-y-auto p-1.5">
          {departments.map((dept) => (
            <button key={dept.id} type="button" onClick={() => { onSelect(dept.name); setIsOpen(false); }}
              className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 sm:text-sm">
              {dept.name}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
);

const InfoCard = ({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) => (
  <div className="rounded-xl border border-white/20 bg-white/10 p-2.5 backdrop-blur-md sm:rounded-2xl sm:p-3">
    <div className="flex items-center gap-2 lg:justify-start">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm text-white sm:h-9 sm:w-9 sm:rounded-xl">
        {icon}
      </div>
      <div className="min-w-0 text-left">
        <p className="truncate text-[10px] font-medium text-blue-100 sm:text-xs">{title}</p>
        <h3 className="truncate text-xs font-extrabold text-white sm:text-sm">{value}</h3>
      </div>
    </div>
  </div>
);

const InputField = ({ label, icon, readOnly, ...props }: any) => (
  <div className="min-w-0">
    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">{label}</label>
    <div className={`flex h-10 items-center rounded-xl border px-3 transition sm:h-11 ${readOnly ? "border-blue-100 bg-blue-50" : "border-slate-300 bg-white focus-within:border-blue-600"}`}>
      {icon && <span className="shrink-0 text-sm text-blue-500">{icon}</span>}
      <input {...props} readOnly={readOnly}
        className="h-full min-w-0 flex-1 bg-transparent px-2 text-xs font-semibold text-slate-800 outline-none sm:text-sm" />
    </div>
  </div>
);