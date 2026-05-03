// src/lib/db/mcpSeed.ts
// MCP Demo Data Seeder
// Generate deterministic demo dataset via MCP

import { demoMode } from './demoMode';

interface DemoPatient {
  id: string;
  user_id: string;
  full_name: string;
  gender: 'female' | 'male' | 'other';
  dob: string;
  phone?: string;
  email?: string;
  primary_doctor_id?: string;
  allergies: string[];
  conditions: string[];
  medical_history: any;
}

interface DemoDoctor {
  id: string;
  user_id: string;
  full_name: string;
  specialization: string;
  clinic_name?: string;
  phone?: string;
  email?: string;
  license_number: string;
}

interface DemoAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  health_center_id: string;
  scheduled_at: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  reason?: string;
  location?: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
}

interface DemoLab {
  id: string;
  patient_id: string;
  test_name: string;
  result: string;
  normal_range?: string;
}

interface DemoHealthCenter {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy';
  lat: number;
  lng: number;
  address: string;
}

class MCPSeed {
  private gateway: any;

  constructor() {
    if (!demoMode.isEnabled()) {
      throw new Error('MCP Seed requires demo mode to be enabled');
    }
    this.gateway = demoMode.getDemoGateway();
  }

  /**
   * Generate deterministic demo dataset
   */
  async seedDemoData(): Promise<void> {
    console.log('[MCPSeed] Starting demo data seeding...');

    try {
      // Seed in order to respect foreign keys
      await this.seedHealthCenters();
      await this.seedUsersAndDoctors();
      await this.seedPatients();
      await this.seedAppointments();
      await this.seedLabs();
      await this.seedMedicalTimeline();

      console.log('[MCPSeed] Demo data seeding completed successfully');
    } catch (error) {
      console.error('[MCPSeed] Seeding failed:', error);
      throw error;
    }
  }

  private async seedHealthCenters(): Promise<void> {
    const centers: DemoHealthCenter[] = [
      {
        id: 'hc-001',
        name: 'MedBridge General Hospital',
        type: 'hospital',
        lat: 40.7128,
        lng: -74.0060,
        address: '123 Main St, New York, NY'
      },
      {
        id: 'hc-002',
        name: 'Downtown Medical Clinic',
        type: 'clinic',
        lat: 40.7589,
        lng: -73.9851,
        address: '456 Health Ave, New York, NY'
      },
      {
        id: 'hc-003',
        name: 'City Pharmacy',
        type: 'pharmacy',
        lat: 40.7505,
        lng: -73.9934,
        address: '789 Med St, New York, NY'
      },
      {
        id: 'hc-004',
        name: 'Emergency Care Center',
        type: 'hospital',
        lat: 40.7282,
        lng: -73.7949,
        address: '321 Care Blvd, Queens, NY'
      },
      {
        id: 'hc-005',
        name: 'Family Health Clinic',
        type: 'clinic',
        lat: 40.7831,
        lng: -73.9712,
        address: '654 Family Rd, Manhattan, NY'
      }
    ];

    for (const center of centers) {
      await this.gateway.insert('health_centers', demoMode.markAsDemo(center));
    }
  }

  private async seedUsersAndDoctors(): Promise<void> {
    const doctors: DemoDoctor[] = [
      {
        id: 'doc-001',
        user_id: 'user-doc-001',
        full_name: 'Dr. Sarah Johnson',
        specialization: 'Cardiology',
        clinic_name: 'Heart Health Center',
        phone: '+1-555-0101',
        email: 'sarah.johnson@medbridge.com',
        license_number: 'MD123456'
      },
      {
        id: 'doc-002',
        user_id: 'user-doc-002',
        full_name: 'Dr. Michael Chen',
        specialization: 'Neurology',
        clinic_name: 'Brain & Nerve Institute',
        phone: '+1-555-0102',
        email: 'michael.chen@medbridge.com',
        license_number: 'MD123457'
      },
      {
        id: 'doc-003',
        user_id: 'user-doc-003',
        full_name: 'Dr. Emily Rodriguez',
        specialization: 'Pediatrics',
        clinic_name: 'Kids Care Clinic',
        phone: '+1-555-0103',
        email: 'emily.rodriguez@medbridge.com',
        license_number: 'MD123458'
      },
      {
        id: 'doc-004',
        user_id: 'user-doc-004',
        full_name: 'Dr. James Wilson',
        specialization: 'Orthopedics',
        clinic_name: 'Bone & Joint Center',
        phone: '+1-555-0104',
        email: 'james.wilson@medbridge.com',
        license_number: 'MD123459'
      },
      {
        id: 'doc-005',
        user_id: 'user-doc-005',
        full_name: 'Dr. Lisa Thompson',
        specialization: 'Dermatology',
        clinic_name: 'Skin Health Clinic',
        phone: '+1-555-0105',
        email: 'lisa.thompson@medbridge.com',
        license_number: 'MD123460'
      }
    ];

    for (const doctor of doctors) {
      // Insert user first
      await this.gateway.insert('users', demoMode.markAsDemo({
        id: doctor.user_id,
        email: doctor.email,
        role: 'doctor'
      }));

      // Insert doctor
      await this.gateway.insert('doctors', demoMode.markAsDemo(doctor));
    }
  }

  private async seedPatients(): Promise<void> {
    const patients: DemoPatient[] = [
      {
        id: 'pat-001',
        user_id: 'user-pat-001',
        full_name: 'John Smith',
        gender: 'male',
        dob: '1985-03-15',
        phone: '+1-555-0201',
        email: 'john.smith@email.com',
        primary_doctor_id: 'doc-001',
        allergies: ['Penicillin'],
        conditions: ['Hypertension'],
        medical_history: {
          surgeries: ['Appendectomy 2010'],
          medications: ['Lisinopril 10mg daily']
        }
      },
      {
        id: 'pat-002',
        user_id: 'user-pat-002',
        full_name: 'Maria Garcia',
        gender: 'female',
        dob: '1992-07-22',
        phone: '+1-555-0202',
        email: 'maria.garcia@email.com',
        primary_doctor_id: 'doc-002',
        allergies: [],
        conditions: ['Migraine'],
        medical_history: {
          surgeries: [],
          medications: ['Sumatriptan as needed']
        }
      },
      {
        id: 'pat-003',
        user_id: 'user-pat-003',
        full_name: 'Robert Johnson',
        gender: 'male',
        dob: '1978-11-08',
        phone: '+1-555-0203',
        email: 'robert.johnson@email.com',
        primary_doctor_id: 'doc-003',
        allergies: ['Shellfish'],
        conditions: ['Type 2 Diabetes'],
        medical_history: {
          surgeries: ['Knee replacement 2015'],
          medications: ['Metformin 500mg twice daily']
        }
      },
      // Add more patients...
      {
        id: 'pat-004',
        user_id: 'user-pat-004',
        full_name: 'Anna Lee',
        gender: 'female',
        dob: '1988-05-12',
        phone: '+1-555-0204',
        email: 'anna.lee@email.com',
        primary_doctor_id: 'doc-004',
        allergies: ['Dust mites'],
        conditions: ['Asthma'],
        medical_history: {
          surgeries: [],
          medications: ['Albuterol inhaler']
        }
      },
      {
        id: 'pat-005',
        user_id: 'user-pat-005',
        full_name: 'David Brown',
        gender: 'male',
        dob: '1995-09-30',
        phone: '+1-555-0205',
        email: 'david.brown@email.com',
        primary_doctor_id: 'doc-005',
        allergies: [],
        conditions: ['Acne'],
        medical_history: {
          surgeries: [],
          medications: ['Topical retinoid']
        }
      },
      // Add 5 more for total of 10
      {
        id: 'pat-006',
        user_id: 'user-pat-006',
        full_name: 'Jennifer Davis',
        gender: 'female',
        dob: '1982-12-03',
        phone: '+1-555-0206',
        email: 'jennifer.davis@email.com',
        primary_doctor_id: 'doc-001',
        allergies: ['Latex'],
        conditions: ['Arthritis'],
        medical_history: {
          surgeries: [],
          medications: ['Ibuprofen 400mg as needed']
        }
      },
      {
        id: 'pat-007',
        user_id: 'user-pat-007',
        full_name: 'Christopher Wilson',
        gender: 'male',
        dob: '1975-06-18',
        phone: '+1-555-0207',
        email: 'christopher.wilson@email.com',
        primary_doctor_id: 'doc-002',
        allergies: [],
        conditions: ['High Cholesterol'],
        medical_history: {
          surgeries: [],
          medications: ['Atorvastatin 20mg daily']
        }
      },
      {
        id: 'pat-008',
        user_id: 'user-pat-008',
        full_name: 'Michelle Taylor',
        gender: 'female',
        dob: '1990-04-25',
        phone: '+1-555-0208',
        email: 'michelle.taylor@email.com',
        primary_doctor_id: 'doc-003',
        allergies: ['Peanuts'],
        conditions: ['Anxiety'],
        medical_history: {
          surgeries: [],
          medications: ['Sertraline 50mg daily']
        }
      },
      {
        id: 'pat-009',
        user_id: 'user-pat-009',
        full_name: 'Kevin Martinez',
        gender: 'male',
        dob: '1987-08-14',
        phone: '+1-555-0209',
        email: 'kevin.martinez@email.com',
        primary_doctor_id: 'doc-004',
        allergies: [],
        conditions: ['Back Pain'],
        medical_history: {
          surgeries: ['Herniated disc surgery 2018'],
          medications: ['Naproxen 500mg twice daily']
        }
      },
      {
        id: 'pat-010',
        user_id: 'user-pat-010',
        full_name: 'Amanda Anderson',
        gender: 'female',
        dob: '1993-01-07',
        phone: '+1-555-0210',
        email: 'amanda.anderson@email.com',
        primary_doctor_id: 'doc-005',
        allergies: ['Cats'],
        conditions: ['Allergies'],
        medical_history: {
          surgeries: [],
          medications: ['Loratadine 10mg daily']
        }
      }
    ];

    for (const patient of patients) {
      // Insert user first
      await this.gateway.insert('users', demoMode.markAsDemo({
        id: patient.user_id,
        email: patient.email,
        role: 'patient'
      }));

      // Insert patient
      await this.gateway.insert('patients', demoMode.markAsDemo(patient));
    }
  }

  private async seedAppointments(): Promise<void> {
    const appointments: DemoAppointment[] = [
      // Generate 25 appointments with realistic scheduling
    ];

    // Implementation for appointments...
    // This would create appointments linking patients to doctors at health centers
  }

  private async seedLabs(): Promise<void> {
    const labs: DemoLab[] = [
      // Generate 20 lab results
    ];

    // Implementation for labs...
  }

  private async seedMedicalTimeline(): Promise<void> {
    // Generate timeline events for AI-ready structured data
  }
}

// Export seeder
export const mcpSeed = new MCPSeed();

// Convenience function
export async function seedDemoData(): Promise<void> {
  await mcpSeed.seedDemoData();
}