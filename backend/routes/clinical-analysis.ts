import { NextRequest, NextResponse } from 'next/server'
import { fetchPatientClinicalProfile, saveClinicalObservation } from '@/lib/supabase-health'
import type { AIAnalysisResponse } from '@/lib/health-types'

export async function handleClinicalAnalysisPost(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, observation } = body

    if (!patientId || !observation) {
      return NextResponse.json(
        { error: 'Missing required fields: patientId, observation' },
        { status: 400 },
      )
    }

    const patientProfile = await fetchPatientClinicalProfile(patientId)
    if (!patientProfile) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const recordId = await saveClinicalObservation(patientId, 'clinician-id', observation, {})

    const criticalAlerts: string[] = []
    const recommendations: string[] = []
    const suggestedActions: string[] = []
    let requiresSpecialist: string | null = null
    let followUpRequired = false
    const clinicianReviewRequired = true

    if (patientProfile.allergies?.allergies.length) {
      const lifeThreateningAllergies = patientProfile.allergies.allergies.filter(
        (a) => a.reaction_severity === 'life_threatening',
      )
      if (lifeThreateningAllergies.length > 0) {
        criticalAlerts.push(
          `CRITICAL: Life-threatening allergies present: ${lifeThreateningAllergies.map((a) => a.allergen).join(', ')}`,
        )
      }
    }

    if (patientProfile.vitals?.vitals.length) {
      const criticalVitals = patientProfile.vitals.vitals.filter((v) => v.is_critical)
      if (criticalVitals.length > 0) {
        criticalAlerts.push(
          `Critical vital signs detected: ${criticalVitals.map((v) => v.vital_type).join(', ')}`,
        )
        suggestedActions.push('Review critical vitals immediately')
        followUpRequired = true
      }
    }

    if (patientProfile.lab_results?.lab_results.length) {
      const criticalLabs = patientProfile.lab_results.lab_results.filter((l) => l.is_critical)
      const abnormalLabs = patientProfile.lab_results.lab_results.filter((l) => l.is_abnormal && !l.is_critical)

      if (criticalLabs.length > 0) {
        criticalAlerts.push(`Critical lab values: ${criticalLabs.map((l) => l.test_name).join(', ')}`)
        suggestedActions.push('Review critical labs and consult with lab specialist')
        requiresSpecialist = 'Laboratory Medicine'
        followUpRequired = true
      }

      if (abnormalLabs.length > 0) {
        recommendations.push(
          `Abnormal lab results noted: ${abnormalLabs.slice(0, 3).map((l) => l.test_name).join(', ')}`,
        )
      }
    }

    if (patientProfile.medications?.medications.length) {
      if (patientProfile.medications.medications.length > 5) {
        recommendations.push('Patient on multiple medications - monitor for interactions')
        suggestedActions.push('Review medication list for potential interactions')
      }
    }

    let aiSummary = observation
    let riskLevel: 'critical' | 'high' | 'medium' | 'low' = 'low'

    try {
      const aiResponse = await fetch(new URL('/api/ai', request.nextUrl.origin).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: observation }),
      })

      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        aiSummary = aiData.reply || observation
        riskLevel = aiData.risk as 'critical' | 'high' | 'medium' | 'low'

        if (riskLevel === 'high' || riskLevel === 'critical') {
          followUpRequired = true
          suggestedActions.push('Schedule follow-up within 24 hours')
        }
      }
    } catch (error) {
      console.error('[MedBridge] Error calling AI endpoint:', error)
    }

    const observationLower = observation.toLowerCase()
    const specialistKeywords: Record<string, string> = {
      cardiac: 'Cardiology',
      chest: 'Cardiology',
      respiratory: 'Pulmonology',
      breathing: 'Pulmonology',
      neuro: 'Neurology',
      seizure: 'Neurology',
      psych: 'Psychiatry',
      mental: 'Psychiatry',
      endo: 'Endocrinology',
      diabetes: 'Endocrinology',
      kidney: 'Nephrology',
      liver: 'Hepatology',
      infection: 'Infectious Disease',
      cancer: 'Oncology',
    }

    for (const [keyword, specialty] of Object.entries(specialistKeywords)) {
      if (observationLower.includes(keyword)) {
        requiresSpecialist = specialty
        break
      }
    }

    let confidenceScore = 0.6
    if (patientProfile.vitals?.vitals.length) confidenceScore += 0.1
    if (patientProfile.lab_results?.lab_results.length) confidenceScore += 0.1
    if (patientProfile.medications?.medications.length) confidenceScore += 0.05
    if (patientProfile.allergies?.allergies.length) confidenceScore += 0.05
    confidenceScore = Math.min(confidenceScore, 0.95)

    const response: AIAnalysisResponse = {
      request_id: recordId || `analysis_${Date.now()}`,
      patient_id: patientId,
      summary: aiSummary,
      risk_level: riskLevel,
      critical_alerts: criticalAlerts,
      recommendations: recommendations.length > 0 ? recommendations : ['Continue current management'],
      suggested_actions: suggestedActions.length > 0 ? suggestedActions : ['Document observation'],
      follow_up_required: followUpRequired,
      requires_specialist: requiresSpecialist,
      clinician_review_required: clinicianReviewRequired,
      confidence_score: confidenceScore,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[MedBridge] Clinical analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
