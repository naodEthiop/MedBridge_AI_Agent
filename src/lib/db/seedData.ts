// src/lib/db/seedData.ts
// Demo data seeding for MedBridge

import { createServiceSupabaseClient } from '@/lib/db/supabaseServer';

export interface SeedPatient {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  address: string;
  emergencyContact: string;
  medicalHistory: string[];
  currentMedications: string[];
  allergies: string[];
  tenantId: string;
}

export interface SeedDoctor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  specialty: string;
  licenseNumber: string;
  phone: string;
  tenantId: string;
}

export interface SeedAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
  tenantId: string;
}

export interface SeedLabResult {
  id: string;
  patientId: string;
  testName: string;
  testDate: string;
  result: string;
  normalRange: string;
  status: 'normal' | 'abnormal' | 'critical';
  tenantId: string;
}

const DEMO_PATIENTS: SeedPatient[] = [
  {
    id: 'demo-patient-1',
    email: 'john.doe@email.com',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1985-03-15',
    phone: '+1-555-0101',
    address: '123 Main St, Anytown, USA',
    emergencyContact: 'Jane Doe: +1-555-0102',
    medicalHistory: ['Hypertension diagnosed 2018', 'Appendectomy 2010'],
    currentMedications: ['Lisinopril 10mg daily', 'Aspirin 81mg daily'],
    allergies: ['Penicillin'],
    tenantId: 'demo-tenant'
  },
  {
    id: 'demo-patient-2',
    email: 'sarah.smith@email.com',
    firstName: 'Sarah',
    lastName: 'Smith',
    dateOfBirth: '1992-07-22',
    phone: '+1-555-0103',
    address: '456 Oak Ave, Somewhere, USA',
    emergencyContact: 'Mike Smith: +1-555-0104',
    medicalHistory: ['Asthma diagnosed 2005', 'Seasonal allergies'],
    currentMedications: ['Albuterol inhaler as needed', 'Fluticasone nasal spray'],
    allergies: ['Sulfa drugs', 'Shellfish'],
    tenantId: 'demo-tenant'
  },
  {
    id: 'demo-patient-3',
    email: 'mike.johnson@email.com',
    firstName: 'Mike',
    lastName: 'Johnson',
    dateOfBirth: '1978-11-08',
    phone: '+1-555-0105',
    address: '789 Pine Rd, Elsewhere, USA',
    emergencyContact: 'Lisa Johnson: +1-555-0106',
    medicalHistory: ['Type 2 Diabetes diagnosed 2015', 'High cholesterol'],
    currentMedications: ['Metformin 500mg twice daily', 'Atorvastatin 20mg daily'],
    allergies: ['None known'],
    tenantId: 'demo-tenant'
  },
  {
    id: 'demo-patient-4',
    email: 'lisa.brown@email.com',
    firstName: 'Lisa',
    lastName: 'Brown',
    dateOfBirth: '1988-05-30',
    phone: '+1-555-0107',
    address: '321 Elm St, Nowhere, USA',
    emergencyContact: 'Tom Brown: +1-555-0108',
    medicalHistory: ['Migraine headaches', 'Anxiety'],
    currentMedications: ['Sumatriptan as needed', 'Sertraline 50mg daily'],
    allergies: ['Codeine'],
    tenantId: 'demo-tenant'
  },
  {
    id: 'demo-patient-5',
    email: 'david.wilson@email.com',
    firstName: 'David',
    lastName: 'Wilson',
    dateOfBirth: '1995-12-12',
    phone: '+1-555-0109',
    address: '654 Maple Dr, Anywhere, USA',
    emergencyContact: 'Emma Wilson: +1-555-0110',
    medicalHistory: ['Sports injuries - ACL reconstruction 2019'],
    currentMedications: ['Ibuprofen as needed'],
    allergies: ['None known'],
    tenantId: 'demo-tenant'
  }
];

const DEMO_DOCTORS: SeedDoctor[] = [
  {
    id: 'demo-doctor-1',
    email: 'dr.smith@medbridge.com',
    firstName: 'Dr. Emily',
    lastName: 'Smith',
    specialty: 'Internal Medicine',
    licenseNumber: 'MD123456',
    phone: '+1-555-0201',
    tenantId: 'demo-tenant'
  },
  {
    id: 'demo-doctor-2',
    email: 'dr.jones@medbridge.com',
    firstName: 'Dr. Robert',
    lastName: 'Jones',
    specialty: 'Family Medicine',
    licenseNumber: 'MD234567',
    phone: '+1-555-0202',
    tenantId: 'demo-tenant'
  },
  {
    id: 'demo-doctor-3',
    email: 'dr.davis@medbridge.com',
    firstName: 'Dr. Maria',
    lastName: 'Davis',
    specialty: 'Cardiology',
    licenseNumber: 'MD345678',
    phone: '+1-555-0203',
    tenantId: 'demo-tenant'
  }
];

const DEMO_APPOINTMENTS: SeedAppointment[] = [
  {
    id: 'demo-apt-1',
    patientId: 'demo-patient-1',
    doctorId: 'demo-doctor-1',
    appointmentDate: '2024-01-15T10:00:00Z',
    status: 'completed',
    notes: 'Follow-up for hypertension management. Blood pressure well controlled.',
    tenantId: 'demo-tenant'
  },
  {
    id: 'demo-apt-2',
    patientId: 'demo-patient-2',
    doctorId: 'demo-doctor-2',
    appointmentDate: '2024-01-16T14:30:00Z',
    status: 'completed',
    notes: 'Asthma review. Good control with current regimen.',
    tenantId: 'demo-tenant'
  },
  {
    id: 'demo-apt-3',
    patientId: 'demo-patient-3',
    doctorId: 'demo-doctor-3',
    appointmentDate: '2024-01-17T09:15:00Z',
    status: 'scheduled',
    notes: 'Diabetes management and cardiovascular risk assessment.',
    tenantId: 'demo-tenant'
  },
  {
    id: 'demo-apt-4',
    patientId: 'demo-patient-4',
    doctorId: 'demo-doctor-1',
    appointmentDate: '2024-01-18T11:00:00Z',
    status: 'scheduled',
    notes: 'Migraine management and mental health follow-up.',
    tenantId: 'demo-tenant'
  },
  {
    id: 'demo-apt-5',
    patientId: 'demo-patient-5',
    doctorId: 'demo-doctor-2',
    appointmentDate: '2024-01-19T15:45:00Z',
    status: 'scheduled',
    notes: 'Sports medicine follow-up and rehabilitation progress.',
    tenantId: 'demo-tenant'
  }
];

const DEMO_LAB_RESULTS: SeedLabResult[] = [
  {
    id: 'demo-lab-1',
    patientId: 'demo-patient-1',
    testName: 'Blood Pressure',
    testDate: '2024-01-15T10:00:00Z',
    result: '128/82 mmHg',
    normalRange: '< 130/80 mmHg',
    status: 'normal',
    tenantId: 'demo-tenant'
  },
  {
    id: 'demo-lab-2',
    patientId: 'demo-patient-1',
    testName: 'HbA1c',
    testDate: '2024-01-15T10:00:00Z',
    result: '5.8%',
    normalRange: '< 5.7%',
    status: 'abnormal',
    tenantId: 'demo-tenant'
  },
  {
    id: 'demo-lab-3',
    patientId: 'demo-patient-2',
    testName: 'Peak Flow',
    testDate: '2024-01-16T14:30:00Z',
    result: '450 L/min',
    normalRange: '> 400 L/min',
    status: 'normal',
    tenantId: 'demo-tenant'
  },
  {
    id: 'demo-lab-4',
    patientId: 'demo-patient-3',
    testName: 'Fasting Glucose',
    testDate: '2024-01-10T08:00:00Z',
    result: '145 mg/dL',
    normalRange: '70-99 mg/dL',
    status: 'abnormal',
    tenantId: 'demo-tenant'
  },
  {
    id: 'demo-lab-5',
    patientId: 'demo-patient-3',
    testName: 'Total Cholesterol',
    testDate: '2024-01-10T08:00:00Z',
    result: '220 mg/dL',
    normalRange: '< 200 mg/dL',
    status: 'abnormal',
    tenantId: 'demo-tenant'
  },
  {
    id: 'demo-lab-6',
    patientId: 'demo-patient-4',
    testName: 'Migraine Assessment',
    testDate: '2024-01-05T12:00:00Z',
    result: 'Moderate frequency',
    normalRange: 'N/A',
    status: 'normal',
    tenantId: 'demo-tenant'
  }
];

const DEMO_HOSPITALS = [
  {
    id: 'demo-hospital-1',
    name: 'MedBridge General Hospital',
    address: '100 Healthcare Ave, Medical City, USA',
    phone: '+1-555-1000',
    emergencyPhone: '+1-555-9111',
    services: ['Emergency', 'Surgery', 'Internal Medicine', 'Cardiology'],
    latitude: 40.7128,
    longitude: -74.0060,
    tenantId: 'demo-tenant'
  },
  {
    id: 'demo-hospital-2',
    name: 'City Medical Center',
    address: '200 Health Blvd, Wellness Town, USA',
    phone: '+1-555-2000',
    emergencyPhone: '+1-555-9222',
    services: ['Emergency', 'Pediatrics', 'Orthopedics', 'Neurology'],
    latitude: 40.7589,
    longitude: -73.9851,
    tenantId: 'demo-tenant'
  },
  {
    id: 'demo-hospital-3',
    name: 'Regional Health Clinic',
    address: '300 Care Street, Healing Village, USA',
    phone: '+1-555-3000',
    emergencyPhone: '+1-555-9333',
    services: ['Primary Care', 'Urgent Care', 'Laboratory', 'Pharmacy'],
    latitude: 40.7505,
    longitude: -73.9934,
    tenantId: 'demo-tenant'
  }
];

const DEMO_ADMIN = {
  id: 'demo-admin-1',
  email: 'admin@medbridge.com',
  firstName: 'System',
  lastName: 'Administrator',
  role: 'admin',
  tenantId: 'demo-tenant'
};

export async function seedDemoDataIfEmpty(): Promise<void> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  try {
    // Check if demo data already exists
    const { data: existingPatients } = await supabase
      .from('patients')
      .select('id')
      .eq('tenantId', 'demo-tenant')
      .limit(1);

    if (existingPatients && existingPatients.length > 0) {
      console.log('Demo data already exists, skipping seed');
      return;
    }

    console.log('Seeding demo data...');

    // Seed patients
    for (const patient of DEMO_PATIENTS) {
      await supabase
        .from('patients')
        .insert({
          id: patient.id,
          email: patient.email,
          firstName: patient.firstName,
          lastName: patient.lastName,
          dateOfBirth: patient.dateOfBirth,
          phone: patient.phone,
          address: patient.address,
          emergencyContact: patient.emergencyContact,
          medicalHistory: patient.medicalHistory,
          currentMedications: patient.currentMedications,
          allergies: patient.allergies,
          tenantId: patient.tenantId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
    }

    // Seed doctors
    for (const doctor of DEMO_DOCTORS) {
      await supabase
        .from('doctors')
        .insert({
          id: doctor.id,
          email: doctor.email,
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          specialty: doctor.specialty,
          licenseNumber: doctor.licenseNumber,
          phone: doctor.phone,
          tenantId: doctor.tenantId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
    }

    // Seed appointments
    for (const appointment of DEMO_APPOINTMENTS) {
      await supabase
        .from('appointments')
        .insert({
          id: appointment.id,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          appointmentDate: appointment.appointmentDate,
          status: appointment.status,
          notes: appointment.notes,
          tenantId: appointment.tenantId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
    }

    // Seed lab results
    for (const labResult of DEMO_LAB_RESULTS) {
      await supabase
        .from('lab_results')
        .insert({
          id: labResult.id,
          patientId: labResult.patientId,
          testName: labResult.testName,
          testDate: labResult.testDate,
          result: labResult.result,
          normalRange: labResult.normalRange,
          status: labResult.status,
          tenantId: labResult.tenantId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
    }

    // Seed hospitals
    for (const hospital of DEMO_HOSPITALS) {
      await supabase
        .from('hospitals')
        .insert({
          id: hospital.id,
          name: hospital.name,
          address: hospital.address,
          phone: hospital.phone,
          emergencyPhone: hospital.emergencyPhone,
          services: hospital.services,
          latitude: hospital.latitude,
          longitude: hospital.longitude,
          tenantId: hospital.tenantId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
    }

    // Seed admin user
    await supabase
      .from('users')
      .insert({
        id: DEMO_ADMIN.id,
        email: DEMO_ADMIN.email,
        firstName: DEMO_ADMIN.firstName,
        lastName: DEMO_ADMIN.lastName,
        role: DEMO_ADMIN.role,
        tenantId: DEMO_ADMIN.tenantId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

    console.log('Demo data seeded successfully!');
  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  }
}