import type { Appointment, LabRecord, Patient } from '@/lib/types';

export function toInternalPatient(fhirPatient: Record<string, unknown>): Partial<Patient> {
  return {
    id: fhirPatient?.id,
    fullName: [fhirPatient?.name?.[0]?.given?.join(' '), fhirPatient?.name?.[0]?.family].filter(Boolean).join(' '),
    dateOfBirth: fhirPatient?.birthDate,
    sex: fhirPatient?.gender,
    phone: fhirPatient?.telecom?.find((t: { system?: string; value?: string }) => t.system === 'phone')?.value,
    email: fhirPatient?.telecom?.find((t: { system?: string; value?: string }) => t.system === 'email')?.value,
  };
}

export function toFhirPatient(internalPatient: Partial<Patient>) {
  return {
    resourceType: 'Patient',
    id: internalPatient.id,
    name: [{ text: internalPatient.fullName }],
    birthDate: internalPatient.dateOfBirth,
    gender: internalPatient.sex,
    telecom: [internalPatient.phone ? { system: 'phone', value: internalPatient.phone } : null, internalPatient.email ? { system: 'email', value: internalPatient.email } : null].filter(Boolean),
  };
}

export function toInternalObservation(fhirObservation: Record<string, unknown>): Partial<LabRecord> {
  return {
    id: fhirObservation?.id,
    patientId: fhirObservation?.subject?.reference?.replace('Patient/', ''),
    testName: fhirObservation?.code?.text,
    result: String(fhirObservation?.valueQuantity?.value ?? fhirObservation?.valueString ?? ''),
    createdAt: fhirObservation?.effectiveDateTime,
  };
}

export function toFhirObservation(labResult: Partial<LabRecord>) {
  return {
    resourceType: 'Observation',
    id: labResult.id,
    code: { text: labResult.testName },
    valueString: labResult.result,
    effectiveDateTime: labResult.createdAt,
    subject: { reference: `Patient/${labResult.patientId}` },
  };
}

export function toInternalAppointment(fhirAppointment: Record<string, unknown>): Partial<Appointment> {
  return {
    id: fhirAppointment?.id,
    startTime: fhirAppointment?.start,
    endTime: fhirAppointment?.end,
    status: fhirAppointment?.status,
    patientId: fhirAppointment?.participant?.[0]?.actor?.reference?.replace('Patient/', ''),
    doctorId: fhirAppointment?.participant?.[1]?.actor?.reference?.replace('Practitioner/', ''),
  };
}

export function toFhirAppointment(appointment: Partial<Appointment>) {
  return {
    resourceType: 'Appointment',
    id: appointment.id,
    status: appointment.status,
    start: appointment.startTime,
    end: appointment.endTime,
    participant: [
      { actor: { reference: `Patient/${appointment.patientId}` } },
      { actor: { reference: `Practitioner/${appointment.doctorId}` } },
    ],
  };
}
