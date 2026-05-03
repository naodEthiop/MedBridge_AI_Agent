import type { Appointment, LabRecord, Patient } from '@/lib/types';

export function toInternalPatient(fhirPatient: Record<string, unknown>): Partial<Patient> {
  const name = Array.isArray(fhirPatient?.name) && fhirPatient.name[0] ? fhirPatient.name[0] : null;
  const given = Array.isArray(name?.given) ? name.given.join(' ') : '';
  const family = typeof name?.family === 'string' ? name.family : '';
  const fullName = [given, family].filter(Boolean).join(' ') || undefined;

  const telecom = Array.isArray(fhirPatient?.telecom) ? fhirPatient.telecom : [];
  const phone = telecom.find((t: any) => t?.system === 'phone')?.value;
  const email = telecom.find((t: any) => t?.system === 'email')?.value;

  return {
    id: typeof fhirPatient?.id === 'string' ? fhirPatient.id : undefined,
    fullName,
    dateOfBirth: typeof fhirPatient?.birthDate === 'string' ? fhirPatient.birthDate : undefined,
    sex: typeof fhirPatient?.gender === 'string' && ['female', 'male', 'other'].includes(fhirPatient.gender) ? fhirPatient.gender as 'female' | 'male' | 'other' : undefined,
    phone: typeof phone === 'string' ? phone : undefined,
    email: typeof email === 'string' ? email : undefined,
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
  const subject = fhirObservation?.subject as any;
  const subjectRef = typeof subject?.reference === 'string' ? subject.reference : '';
  const patientId = subjectRef.replace('Patient/', '') || undefined;

  const code = fhirObservation?.code as any;
  const testName = typeof code?.text === 'string' ? code.text : undefined;

  const valueQuantity = fhirObservation?.valueQuantity as any;
  const valueString = fhirObservation?.valueString as any;
  const result = String(valueQuantity?.value ?? valueString ?? '');

  return {
    id: typeof fhirObservation?.id === 'string' ? fhirObservation.id : undefined,
    patientId,
    testName,
    result,
    createdAt: typeof fhirObservation?.effectiveDateTime === 'string' ? fhirObservation.effectiveDateTime : undefined,
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
  const participants = Array.isArray(fhirAppointment?.participant) ? fhirAppointment.participant : [];
  const patientRef = participants[0]?.actor?.reference as string;
  const doctorRef = participants[1]?.actor?.reference as string;

  return {
    id: typeof fhirAppointment?.id === 'string' ? fhirAppointment.id : undefined,
    startTime: typeof fhirAppointment?.start === 'string' ? fhirAppointment.start : undefined,
    endTime: typeof fhirAppointment?.end === 'string' ? fhirAppointment.end : undefined,
    status: typeof fhirAppointment?.status === 'string' && ['scheduled', 'confirmed', 'completed', 'cancelled'].includes(fhirAppointment.status) ? fhirAppointment.status as 'scheduled' | 'confirmed' | 'completed' | 'cancelled' : undefined,
    patientId: typeof patientRef === 'string' ? patientRef.replace('Patient/', '') : undefined,
    doctorId: typeof doctorRef === 'string' ? doctorRef.replace('Practitioner/', '') : undefined,
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
