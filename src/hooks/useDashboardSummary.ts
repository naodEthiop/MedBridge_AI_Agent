"use client";

import { useAppointments } from "@/hooks/useAppointments";
import { useDoctors } from "@/hooks/useDoctors";
import { usePatients } from "@/hooks/usePatients";

export function useDashboardSummary() {
  const patients = usePatients();
  const doctors = useDoctors();
  const appointments = useAppointments();

  const loading = patients.isLoading || doctors.isLoading || appointments.isLoading;
  const error = patients.error || doctors.error || appointments.error;

  const patientList = patients.data ?? [];
  const doctorList = doctors.data ?? [];
  const appointmentList = appointments.data ?? [];

  const scheduledAppointments = appointmentList
    .filter((appointment) => appointment.status === "scheduled")
    .slice()
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return {
    loading,
    error,
    patients: patientList,
    doctors: doctorList,
    appointments: appointmentList,
    patientCount: patientList.length,
    doctorCount: doctorList.length,
    appointmentCount: appointmentList.length,
    scheduledCount: scheduledAppointments.length,
    nextAppointment: scheduledAppointments[0] ?? null,
    currentPatient: patientList[0] ?? null,
    currentDoctor: doctorList[0] ?? null,
  };
}