import { useEffect, useState } from "react";
import {FaUser,FaEnvelope,FaPhone,FaCalendarAlt,FaTint,FaEdit,FaSave,FaTimes,FaCamera,FaChevronDown,} from "react-icons/fa";
import API from "../../api/axios";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import type { Profile, EditableFieldProps, DropdownFieldProps} from "../../types/patient.ts";
import usePageTitle from "../../hooks/usePageTitle";

const BASE_URL = "http://localhost:5000";

const getImageUrl = (image?: string | null) => {
  if (!image) return "";
  if (image.startsWith("blob:")) return image;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/uploads")) return `${BASE_URL}${image}`;
  return `${BASE_URL}/uploads/${image}`;
};

export const MyProfile = () => {
  usePageTitle("My Profile");
  const [isEdit, setIsEdit] = useState(false);
  const [, setPatientId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [profile, setProfile] = useState<Profile>({
    name: "",
    email: "",
    phone_number: "",
    gender: "",
    dob: "",
    blood_group: "",
    profile_picture: "",
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get("/patients/me");
      const patient = res.data?.data?.patient || res.data?.patient || res.data?.data || res.data;
      if (!patient?.id) {
        toast.error("Patient id not found");
        return;
      }
      setPatientId(Number(patient.id));
      setProfile({
        name: patient.user?.name || "",
        email: patient.user?.email || "",
        phone_number: String(patient.user?.phone_number || ""),
        gender: patient.user?.gender || "",
        dob: patient.dob || "",
        blood_group: patient.blood_group || "",
        profile_picture: patient.user?.profile_picture || "",
      });
    } catch (error: any) {
      console.log("Fetch profile error:", error);
      toast.error(error.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleDropdownSelect = (name: keyof Profile, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date: Date | null) => {
    setProfile((prev) => ({
      ...prev,
      dob: date ? date.toISOString().split("T")[0] : "",
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
    fetchProfile();
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      await API.put("/patients/me", {
        name: profile.name,
        email: profile.email,
        phone_number: profile.phone_number,
        gender: profile.gender,
        dob: profile.dob,
        blood_group: profile.blood_group,
      });

      if (selectedImage) {
        const imageFormData = new FormData();
        imageFormData.append("profile_picture", selectedImage);

        await API.put("/patients/me/photo", imageFormData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      toast.success("Profile updated successfully");
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const oldUser = JSON.parse(storedUser);
        localStorage.setItem("user",JSON.stringify({
            ...oldUser,
            name: profile.name,
            email: profile.email,
            profile_picture: profile.profile_picture,
          })
        );

        window.dispatchEvent(new Event("authChanged"));
      }

      setIsEdit(false);
      setSelectedImage(null);
      fetchProfile();
    } catch (error: any) {
      console.log("Update profile error:", error);
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = getImageUrl(profile.profile_picture);

  return (
    <main className="min-h-screen bg-[#f0f4fb] px-4 py-8 pt-24 sm:px-6 lg:px-8 lg:pt-28">
      <div className="mx-auto max-w-7xl">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            My Profile
          </h1>

          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            Manage your personal information
          </p>
        </div>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-md sm:mt-8 sm:p-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold">Profile Information</h2>

            {!isEdit ? (
              <button onClick={() => setIsEdit(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-600 px-5 py-3 font-semibold text-blue-600 transition hover:bg-blue-600 hover:text-white sm:w-auto">
                <FaEdit />
                Edit Profile
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:flex">
                <button onClick={handleSave} disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
                  <FaSave />
                  {loading ? "Saving..." : "Save"}
                </button>
                <button onClick={handleCancel} className="flex items-center justify-center gap-2 rounded-lg bg-gray-200 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-300">
                  <FaTimes />
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="grid items-start gap-8 lg:grid-cols-5 lg:gap-10">
            <div className="flex justify-center lg:justify-start">
              <div className="relative h-36 w-36 sm:h-40 sm:w-40">
                {imageUrl ? (
                  <img src={imageUrl} alt="Patient" className="h-36 w-36 rounded-full object-cover object-top shadow-lg sm:h-40 sm:w-40"/>
                ) : (
                  <div className="flex h-36 w-36 items-center justify-center rounded-full bg-blue-100 sm:h-40 sm:w-40">
                    <FaUser className="text-6xl text-blue-500 sm:text-7xl" />
                  </div>
                )}

                {isEdit && (
                  <label className="absolute bottom-1 right-1 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white shadow-lg sm:bottom-2 sm:right-2">
                    <FaCamera className="text-blue-600" />
                    <input type="file" hidden accept="image/*" onChange={handleImage}/>
                  </label>
                )}
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:col-span-4">
              <EditableField icon={<FaUser />} label="Full Name" name="name" value={profile.name}
                isEdit={isEdit}
                onChange={handleChange}/>
              <EditableField icon={<FaPhone />} label="Phone Number" name="phone_number" value={profile.phone_number}
                isEdit={isEdit}
                onChange={handleChange}/>
              <EditableField icon={<FaEnvelope />} label="Email" name="email" type="email"
                value={profile.email}
                isEdit={isEdit}
                onChange={handleChange}/>
              <EditDateField isEdit={isEdit} value={profile.dob} onChange={handleDateChange}/>
              <CustomDropdown icon={<FaUser />} label="Gender" name="gender" value={profile.gender}
                isEdit={isEdit}
                options={["Male", "Female", "Others"]}
                onSelect={handleDropdownSelect}/>
              <CustomDropdown icon={<FaTint />} label="Blood Group" name="blood_group" value={profile.blood_group} isEdit={isEdit}
                options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]}
                onSelect={handleDropdownSelect}/>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

const EditableField = ({icon,label,name,value,isEdit,type = "text",onChange,}: EditableFieldProps) => {
  return (
    <div className="flex gap-4 border-b border-gray-200 pb-4">
      <span className="mt-1 shrink-0 text-blue-500">{icon}</span>
      <div className="min-w-0 w-full">
        <p className="text-sm font-semibold text-gray-600">{label}</p>
        {isEdit ? (
          <input type={type} name={name} value={value} onChange={onChange}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"/>
        ) : (
          <h3 className="mt-1 break-words font-bold text-gray-900">
            {value || "N/A"}
          </h3>
        )}
      </div>
    </div>
  );
};

const EditDateField = ({ isEdit, value, onChange,}: {
  isEdit: boolean;
  value: string;
  onChange: (date: Date | null) => void;
}) => {
  return (
    <div className="flex gap-4 border-b border-gray-200 pb-4">
      <FaCalendarAlt className="mt-1 shrink-0 text-blue-500" />
      <div className="min-w-0 w-full">
        <p className="text-sm font-semibold text-gray-600">Date of Birth</p>
        {isEdit ? (
          <div className="relative mt-2 w-full">
            <DatePicker selected={value ? new Date(value) : null} onChange={onChange} dateFormat="dd/MM/yyyy"
              placeholderText="Select Date of Birth"
              popperPlacement="bottom-start"
              wrapperClassName="w-full"
              calendarClassName="rounded-xl border border-gray-200 shadow-xl"
              className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-blue-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"/>
          </div>
        ) : (
          <h3 className="mt-1 break-words font-bold text-gray-900">
            {value ? new Date(value).toLocaleDateString("en-GB") : "N/A"}
          </h3>
        )}
      </div>
    </div>
  );
};

const CustomDropdown = ({icon,label,name,value,isEdit,options,onSelect,}: DropdownFieldProps) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex gap-4 border-b border-gray-200 pb-4">
      <span className={`mt-1 shrink-0 ${label === "Blood Group" ? "text-red-600" : "text-blue-500"}`}>
        {icon}
      </span>
      <div className="min-w-0 w-full">
        <p className="text-sm font-semibold text-gray-600">{label}</p>
        {isEdit ? (
          <div className="relative mt-2">
            <button type="button" onClick={() => setOpen(!open)}
              className="flex w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-gray-800 outline-none transition hover:border-blue-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-100" >
              <span className={`truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
                {value || `Select ${label}`}
              </span>
              <FaChevronDown className={`shrink-0 text-gray-400 transition ${ open ? "rotate-180" : ""}`}/>
            </button>

            {open && (
              <div className="absolute left-0 top-full z-50 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                {options.map((option) => (
                  <button key={option} type="button" onClick={() => {
                      onSelect(name, option);
                      setOpen(false);
                    }}
                    className={`block w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition hover:bg-blue-50 hover:text-blue-600 ${
                      value === option? "bg-blue-100 text-blue-700": "text-gray-700"}`}>
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <h3 className="mt-1 break-words font-bold text-gray-900">
            {value || "N/A"}
          </h3>
        )}
      </div>
    </div>
  );
};