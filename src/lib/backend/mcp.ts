import { findNearestHospital } from "@/lib/backend/hospitals";

export async function getEmergencySteps(symptom: string) {
  const s = symptom.toLowerCase();
  const common = [
    "Stay calm and avoid exertion.",
    "Do not self-medicate with unknown drugs.",
    "Keep emergency contacts nearby.",
  ];
  if (s.includes("chest") || s.includes("breath")) {
    return [
      "Call emergency services immediately.",
      "Sit upright and loosen tight clothing.",
      "If advised and available, chew aspirin unless allergic.",
      ...common,
    ];
  }
  return ["Contact a clinician urgently for guidance.", ...common];
}

export async function getNearbyHospitals(lat = 9.02, lng = 38.74) {
  const primary = findNearestHospital(lat, lng, "urgent");
  return [primary, { ...primary, name: "CityCare Hospital", distanceKm: 2.9, etaMinutes: 11 }];
}

export async function getNearbyPharmacies(medicine: string, latitude?: number, longitude?: number) {
  const lat = latitude ?? 9.02;
  const lng = longitude ?? 38.74;
  return [
    {
      name: "Bole Community Pharmacy",
      hasMedicine: true,
      medicine,
      distanceKm: 1.4,
      latitude: lat + 0.004,
      longitude: lng + 0.002,
      phone: "+251-911-400-100",
    },
    {
      name: "Sunrise Pharmacy",
      hasMedicine: false,
      medicine,
      distanceKm: 2.1,
      latitude: lat - 0.003,
      longitude: lng + 0.001,
      phone: "+251-911-400-200",
    },
  ];
}

export async function analyzePrescription(_kind: string, fileName: string) {
  const lower = fileName.toLowerCase();
  const likely = lower.includes("rx") || lower.includes("prescription") || lower.includes("med");
  return {
    detected: likely,
    confidence: likely ? "likely" : "possible",
    medicine: likely ? "Amoxicillin" : undefined,
    dosage: likely ? "500 mg" : undefined,
    timing: likely ? "Three times daily" : undefined,
    summary: likely ? "Prescription-like text pattern detected from file name." : "Could not confidently detect.",
  } as const;
}

