import { NextResponse } from 'next/server'
import { createCase } from '@/lib/case-service'
import { findNearestHospital } from '@/lib/hospitals'
import type { AiTriageResponse, UrgencyLevel } from '@/lib/types'

const DISCLAIMER = 'This is not a diagnosis. Seek professional medical care.'

const urgentMatchers = [
  { keyword: 'chest pain', label: 'Chest pain' },
  { keyword: 'bleeding', label: 'Bleeding' },
  { keyword: 'breathing difficulty', label: 'Breathing difficulty' },
  { keyword: 'shortness of breath', label: 'Shortness of breath' },
  { keyword: "can't breathe", label: 'Unable to breathe comfortably' },
  { keyword: 'cannot breathe', label: 'Unable to breathe comfortably' },
  { keyword: 'unconscious', label: 'Loss of consciousness' },
  { keyword: 'severe pain', label: 'Severe pain' },
]

const mediumMatchers = [
  'fever',
  'headache',
  'vomiting',
  'dizziness',
  'abdominal pain',
  'cough',
  'infection',
  'weakness',
]

function detectUrgency(message: string): {
  urgency: UrgencyLevel
  redFlags: string[]
} {
  const normalized = message.toLowerCase()
  const redFlags = urgentMatchers
    .filter((entry) => normalized.includes(entry.keyword))
    .map((entry) => entry.label)

  if (redFlags.length > 0) {
    return {
      urgency: 'urgent',
      redFlags,
    }
  }

  if (mediumMatchers.some((entry) => normalized.includes(entry))) {
    return {
      urgency: 'medium',
      redFlags: [],
    }
  }

  return {
    urgency: 'low',
    redFlags: [],
  }
}

function hasEnoughInfo(message: string) {
  const normalized = message.trim().toLowerCase()

  if (normalized.length < 12) {
    return false
  }

  return normalized.split(/\s+/).length >= 3
}

function buildFollowUpQuestions(message: string, urgency: UrgencyLevel) {
  const normalized = message.toLowerCase()
  const questions: string[] = []

  if (!hasEnoughInfo(message)) {
    questions.push('What symptom is bothering you the most right now?')
    questions.push('When did it start, and is it getting worse?')
    return questions
  }

  if (urgency === 'urgent') {
    questions.push('Are you alone, and can someone help you get urgent care right now?')
  } else if (normalized.includes('fever')) {
    questions.push('How high is the fever, and how long have you had it?')
  } else if (normalized.includes('headache')) {
    questions.push('Is the headache sudden, severe, or associated with vision changes?')
  } else if (urgency === 'low') {
    questions.push('Can you share where the symptom is located and what makes it better or worse?')
  }

  return questions
}

function buildRecommendedAction(urgency: UrgencyLevel) {
  if (urgency === 'urgent') {
    return 'Seek emergency medical care immediately or have someone take you to the nearest hospital.'
  }

  if (urgency === 'medium') {
    return 'Arrange a clinician review soon and monitor for worsening symptoms.'
  }

  return 'Monitor symptoms closely, answer the follow-up questions, and seek care if symptoms worsen.'
}

function buildResponse(message: string, userLat = 9.02, userLng = 38.74): AiTriageResponse {
  const { urgency, redFlags } = detectUrgency(message)
  const enoughInfo = hasEnoughInfo(message)
  const followUpQuestions = buildFollowUpQuestions(message, urgency)
  const recommendedAction = buildRecommendedAction(urgency)
  const doctorSummary = `Symptoms: ${message}. Urgency: ${urgency}. Red flags: ${
    redFlags.length > 0 ? redFlags.join(', ') : 'none identified from keyword screening'
  }. Follow-up needed: ${followUpQuestions.length > 0 ? followUpQuestions.join(' ') : 'No immediate follow-up question required.'}`
  const confidence =
    urgency === 'urgent'
      ? 0.95
      : urgency === 'medium'
        ? 0.78
        : enoughInfo
          ? 0.64
          : 0.4
  const nextStep =
    urgency === 'urgent'
      ? 'emergency'
      : !enoughInfo
        ? 'ask_more'
        : urgency === 'medium'
        ? 'create_case'
        : followUpQuestions.length > 0
          ? 'ask_more'
          : 'ask_more'

  const messagePrefix =
    urgency === 'urgent'
      ? 'Your symptoms may need urgent medical attention.'
      : urgency === 'medium'
        ? 'Your symptoms should be reviewed by a clinician soon.'
        : 'Your symptoms do not appear to suggest an immediate emergency from this brief description.'

  return {
    message: `${messagePrefix} ${DISCLAIMER}`,
    urgency,
    redFlags,
    followUpQuestions,
    doctorSummary,
    recommendedAction: `${recommendedAction} ${DISCLAIMER}`,
    confidence,
    nextStep,
    ...(urgency === 'medium' || urgency === 'urgent'
      ? { nearestHospital: findNearestHospital(userLat, userLng, urgency) }
      : {}),
  }
}

export async function handleAiPost(req: Request) {
  try {
    const body = (await req.json()) as {
      message?: string
      userLat?: number
      userLng?: number
      patientName?: string
    }
    const message = body.message?.trim() ?? ''

    if (!message) {
      return NextResponse.json(
        buildResponse('I need help understanding my symptoms.', body.userLat, body.userLng),
      )
    }

    const aiData = buildResponse(message, body.userLat, body.userLng)

    if (aiData.urgency === 'medium' || aiData.urgency === 'urgent') {
      const createdCase = await createCase({
        symptoms: message,
        urgency: aiData.urgency,
        redFlags: aiData.redFlags,
        doctorSummary: aiData.doctorSummary,
        patientName: body.patientName,
        nearestHospital: aiData.nearestHospital,
      })

      return NextResponse.json({
        ...aiData,
        createdCase,
      })
    }

    return NextResponse.json(aiData)
  } catch {
    return NextResponse.json(buildResponse('I am not feeling well.'))
  }
}
