import { NextResponse } from 'next/server';

import { fetchNearbyHospitalsGeoapify } from '@/lib/geo/geoapify-nearby';
import { env } from '@/lib/env';
import { getAuthenticatedUser, UnauthorizedError } from '@/lib/server/auth';
import { getRepositories, repositoryPrincipalFromAuthenticatedUser } from '@/lib/server/repositories';
import { rateLimitOrThrow } from '@/lib/server/rateLimit';

/**
 * GET /api/geo/nearby-hospitals?lat=&lng= (or lon=)
 * Returns hospitals / clinics near a point via Geoapify.
 */
export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);

    if (!env.GEOAPIFY_API_KEY) {
      return NextResponse.json({ ok: false, error: 'Geoapify is not configured. Set GEOAPIFY_API_KEY.' }, { status: 500 });
    }

    rateLimitOrThrow({ req: request, key: 'geoapify:nearby-hospitals' });

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng') ?? searchParams.get('lon');
    if (!lat || !lng) {
      return NextResponse.json({ ok: false, error: 'Missing lat and lng (or lon)' }, { status: 400 });
    }
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum) || Math.abs(latNum) > 90 || Math.abs(lngNum) > 180) {
      return NextResponse.json({ ok: false, error: 'Invalid coordinates' }, { status: 400 });
    }

    const result = await fetchNearbyHospitalsGeoapify({
      lat: latNum,
      lng: lngNum,
      apiKey: env.GEOAPIFY_API_KEY,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
    }

    const emergencyMode = String(searchParams.get('emergency_mode') ?? 'false').toLowerCase() === 'true';
    const hospitals = result.hospitals
      .map((h) => {
        const deltaLat = h.lat - latNum;
        const deltaLng = h.lng - lngNum;
        const earthRadius = 6371000;
        const rad = (value: number) => (value * Math.PI) / 180;
        const a =
          Math.sin(rad(deltaLat / 2)) ** 2 +
          Math.cos(rad(latNum)) * Math.cos(rad(h.lat)) * Math.sin(rad(deltaLng / 2)) ** 2;
        const distanceMeters = earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const estimatedTime = Math.max(1, Math.round((distanceMeters / 1000) * (emergencyMode ? 10 : 14)));
        const priorityScore = Math.min(
          100,
          Math.round(
            (100 - Math.min(90, distanceMeters / 1000) * 4) * (h.kind === 'hospital' ? 1.2 : 0.88) *
              (emergencyMode && h.kind === 'hospital' ? 1.15 : 1),
          ),
        );
        return {
          name: h.name,
          lat: h.lat,
          lng: h.lng,
          address: h.address,
          kind: h.kind,
          distanceMeters,
          estimatedTime: `${estimatedTime} min`,
          priority_score: priorityScore,
          reason:
            emergencyMode && h.kind === 'hospital'
              ? 'Preferred emergency facility for critical routing'
              : h.kind === 'pharmacy'
              ? 'Nearby pharmacy for urgent medication support'
              : 'Local hospital route recommendation',
        };
      })
      .sort((a, b) => b.priority_score - a.priority_score || a.distanceMeters - b.distanceMeters);

    try {
      const repos = getRepositories(repositoryPrincipalFromAuthenticatedUser(authUser));
      await Promise.all(
        hospitals.map((hospital) =>
          repos.healthCenters.saveHealthCenter({
            name: hospital.name,
            type: hospital.kind === 'pharmacy' ? 'pharmacy' : 'hospital',
            lat: hospital.lat,
            lng: hospital.lng,
            address: hospital.address,
          }),
        ),
      );
    } catch (err) {
      console.error('[geo/nearby-hospitals] health center persistence failed', err);
    }

    return NextResponse.json({ ok: true, data: { emergency_mode: emergencyMode, hospitals } });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Unable to fetch nearby hospitals';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
