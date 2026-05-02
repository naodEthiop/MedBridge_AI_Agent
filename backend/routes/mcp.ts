import { NextResponse } from 'next/server'
import { getGebetaMapsConfig } from '@/lib/env'
import { getEmergencySteps, getNearbyHospitals } from '@/lib/mcp'
import type { McpToolName } from '@/lib/types'

export async function handleMcpPost(req: Request) {
  const { tool, symptom, latitude, longitude } = (await req.json()) as {
    tool?: McpToolName
    symptom?: string
    latitude?: number
    longitude?: number
  }

  if (tool === 'getEmergencySteps') {
    return NextResponse.json({
      type: 'tool_result',
      result: {
        title: 'Emergency Guidance',
        steps: await getEmergencySteps(symptom ?? ''),
      },
    })
  }

  if (tool === 'getNearbyHospitals') {
    const hospitals = await getNearbyHospitals()
    const maps = getGebetaMapsConfig()

    return NextResponse.json({
      result: hospitals,
      mapEnabled: maps.configured,
      location:
        typeof latitude === 'number' && typeof longitude === 'number'
          ? { latitude, longitude }
          : null,
    })
  }

  return NextResponse.json({ error: 'Unknown tool' }, { status: 400 })
}
