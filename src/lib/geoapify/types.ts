export type GeoPlace = {
  id: string;
  name: string;
  address: string;
  kind: "hospital" | "pharmacy";
  lat: number;
  lon: number;
  distanceMeters: number | null;
  categories: string[];
};

export type ApiError = { message: string };

export type PlacesApiResponse =
  | { success: true; data: GeoPlace[]; count: number }
  | { success: false; error: ApiError };

export type GeocodeItem = {
  id: string;
  name: string | null;
  formatted: string | null;
  lat: number | null;
  lon: number | null;
};

export type GeocodeApiResponse =
  | { success: true; data: GeocodeItem[]; count: number }
  | { success: false; error: ApiError };

export type RoutingResult = {
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  distanceKm: number | null;
  durationMin: number | null;
};

export type RoutingApiResponse =
  | { success: true; data: RoutingResult; count: number }
  | { success: false; error: ApiError };

