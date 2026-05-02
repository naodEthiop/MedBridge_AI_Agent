export type UserRole = "patient" | "doctor";

export type PatientProfile = {
  fullName: string;
  age: number;
  sex: "female" | "male" | "other";
  heightCm: number;
  weightKg: number;
  bloodType: string;
};

export type DoctorProfile = {
  fullName: string;
  specialty: string;
  experienceYears: number;
  clinicName: string;
};

export type SessionUser = {
  email: string;
  role: UserRole;
  patientProfile?: PatientProfile;
  doctorProfile?: DoctorProfile;
};

export type SessionPayload = SessionUser & {
  exp: number;
};
