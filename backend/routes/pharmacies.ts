import { NextResponse } from 'next/server'
import { getGebetaMapsConfig } from '@/lib/env'
import { getNearbyPharmacies } from '@/lib/mcp'

export async function handlePharmaciesPost(req: Request) {
  const { medicine, latitude, longitude } = (await req.json()) as {
    medicine?: string
    latitude?: number
    longitude?: number
  }

  const pharmacies = await getNearbyPharmacies(medicine ?? '', latitude, longitude)
  const maps = getGebetaMapsConfig()

  return NextResponse.json({
    pharmacies,
    mapEnabled: maps.configured,
    location:
      typeof latitude === 'number' && typeof longitude === 'number'
        ? { latitude, longitude }
        : null,
  })
}
