export type ID = string;

export type Patient = {
  id: ID;
  fullName: string;
  dateOfBirth: string; // ISO date
  sex: "female" | "male" | "other";
  phone?: string;
  email?: string;
  primaryDoctorId?: ID;
  allergies?: string[];
  conditions?: string[];
};

export type Doctor = {
  id: ID;
  fullName: string;
  specialty: string;
  clinicName?: string;
  phone?: string;
  email?: string;
};

export type Appointment = {
  id: ID;
  patientId: ID;
  doctorId: ID;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  status: "scheduled" | "completed" | "cancelled";
  reason?: string;
  location?: string;
};

