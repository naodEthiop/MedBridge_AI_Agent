import type { UrgencyLevel } from "@/lib/backend/types";

const HOSPITALS = [
  { name: "Addis Emergency Center", distanceKm: 1.2, etaMinutes: 6, phone: "+251-911-100-100" },
  { name: "St. Gabriel General Hospital", distanceKm: 3.5, etaMinutes: 14, phone: "+251-911-200-200" },
  { name: "Bole Medical Center", distanceKm: 5.1, etaMinutes: 19, phone: "+251-911-300-300" },
];

export function findNearestHospital(_lat: number, _lng: number, urgency: UrgencyLevel) {
  const nearest = HOSPITALS[0];
  if (urgency === "urgent") return nearest;
  return { ...nearest, etaMinutes: nearest.etaMinutes + 4 };
}

