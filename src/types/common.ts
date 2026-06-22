import type { ReactNode } from "react";
{/** Common types used across the application */}

export type StatProps = {
  value: number;
  suffix?: string;
  label: string;
  color: string;
};

export type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  text: string;
};

export type FooterColumnProps = {
  title: string;
  items: string[];
};

export type SocialIconProps = {
  icon: ReactNode;
  hover: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  profile_picture?: string | null;
};

export type StatusBadgeProps = {
  status: string;
};

export type UserProtectedRouteProps = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "doctor" | "patient";
};
export type ProtectedRouteProps = {
  allowedRoles: string[];
};

export type InfoBoxProps = {
  icon: React.ReactNode;
  title: string;
  text: string;
  color: "blue" | "emerald" | "cyan" | "violet";
};

export type InputBoxProps = {
  label: string;
  icon: React.ReactNode;
  type: string;
  name: string;
  value: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export type PasswordBoxProps = {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export type SectionCardProps = {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
};

export type PatientInputBoxProps = {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
};

export type SummaryRowProps = {
  label: string;
  value: string;
};

export type PaymentRowProps = {
  label: string;
  amount: number;
};

export type PaymentMethodProps = {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  text: string;
};

export type InfoRowProps = {
  label: string;
  value: string;
  canCopy?: boolean;
  onCopy?: () => void;
  highlight?: boolean;
  badge?: React.ReactNode;
};

//utils types

export type JitsiMeetRoomProps = {
  meetingRoom: string;
  displayName: string;
  titleName: string;
  avatarName: string;
  onClose: () => void;
  onHangup?: () => void | Promise<void>;
};
//review modal types


export interface ReviewModalProps {
    appointmentId: number;
    doctorName: string;
    onClose: () => void;
    onSubmitted?: () => void;
}