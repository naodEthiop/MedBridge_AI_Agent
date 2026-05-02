"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import type { GeoPlace } from "@/lib/geoapify/types";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

export function NearbyMedicalLeafletMap(props: {
  center: { lat: number; lon: number };
  places: GeoPlace[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDirections: (place: GeoPlace) => void | Promise<void>;
}) {
  return (
    <MapContainer
      center={[props.center.lat, props.center.lon]}
      zoom={13}
      className="absolute inset-0 h-full w-full"
      scrollWheelZoom={false}
    >
      <TileLayer url="/api/tiles/{z}/{x}/{y}" />
      <Marker position={[props.center.lat, props.center.lon]}>
        <Popup>Your location</Popup>
      </Marker>
      {props.places.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lon]}
          eventHandlers={{
            click: () => props.onSelect(p.id),
          }}
        >
          <Popup>
            <div className="space-y-2">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-sahara-muted">{p.address}</p>
              </div>
              <button
                type="button"
                onClick={() => props.onDirections(p)}
                className="rounded-lg bg-sahara-fg px-3 py-2 text-xs font-semibold text-white"
              >
                Get Directions
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

