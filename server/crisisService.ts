export interface CrisisResource {
  name: string;
  contact: string;
  description: string;
  type: 'phone' | 'text' | 'web';
}

export interface CrisisCheckResult {
  isCrisisDetected: boolean;
  severity: 'none' | 'moderate' | 'high';
  message: string | null;
  resources: CrisisResource[];
}

export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    name: 'Tele-MANAS (National Tele Mental Health Helpline)',
    contact: '14416 or 1800-891-4416',
    description: 'Government of India 24/7 free, confidential mental health support in 20+ Indian languages.',
    type: 'phone',
  },
  {
    name: 'KIRAN (National Mental Health Helpline by MSJE)',
    contact: '1800-599-0019',
    description: '24/7 toll-free helpline providing early screening, first-aid, psychological support, and distress management.',
    type: 'phone',
  },
  {
    name: 'Vandrevala Foundation Helpline',
    contact: '+91 9999 666 555',
    description: '24/7 free & confidential emotional crisis counseling across India via call and WhatsApp.',
    type: 'phone',
  },
  {
    name: 'AASRA (24/7 Crisis & Suicide Prevention)',
    contact: '+91 98204 66726',
    description: '24/7 volunteer-run helpline providing emotional support to distressed and suicidal individuals.',
    type: 'phone',
  },
  {
    name: 'iCall (TISS Psychosocial Helpline)',
    contact: '+91 91529 87821',
    description: 'Professional telephone and email-based counseling by Tata Institute of Social Sciences (Mon–Sat, 8 AM–10 PM).',
    type: 'phone',
  },
  {
    name: 'Sneha India Helpline',
    contact: '+91 44 2464 0050',
    description: '24/7 suicide prevention and emotional crisis assistance based in Chennai, serving all of India.',
    type: 'phone',
  },
  {
    name: 'National Emergency Helpline',
    contact: 'Call 112',
    description: 'All-in-one emergency response for immediate physical safety, police, and ambulance assistance in India.',
    type: 'phone',
  },
];

// Predefined distress markers (multi-keyword scoring to prevent false positives while ensuring safety)
const HIGH_DISTRESS_PATTERNS = [
  /\b(kill myself|suicide|end my life|want to die|take my own life|commit suicide)\b/i,
  /\b(better off dead|hang myself|slit my|overdose|no reason to live)\b/i,
  /\b(giving up completely|planning my death|goodbye forever)\b/i,
];

const MODERATE_DISTRESS_PATTERNS = [
  /\b(can'?t go on|hopeless|unbearable pain|hate living|nobody cares about me)\b/i,
  /\b(worthless|hurting myself|self-harm|cutting myself|can'?t take this anymore)\b/i,
  /\b(panic attack|overwhelming despair|suffocating from anxiety)\b/i,
];

export function analyzeCrisisIndicators(text: string): CrisisCheckResult {
  if (!text || typeof text !== 'string') {
    return {
      isCrisisDetected: false,
      severity: 'none',
      message: null,
      resources: [],
    };
  }

  // Check high distress patterns first
  for (const pattern of HIGH_DISTRESS_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isCrisisDetected: true,
        severity: 'high',
        message:
          'We hear how deeply painful things feel right now. You are not alone, and there is immediate, compassionate support ready to listen 24/7.',
        resources: CRISIS_RESOURCES,
      };
    }
  }

  // Check moderate distress patterns
  for (const pattern of MODERATE_DISTRESS_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isCrisisDetected: true,
        severity: 'moderate',
        message:
          'It sounds like you are carrying a very heavy weight. Please consider reaching out to a trusted loved one, counselor, or one of these free support lines.',
        resources: CRISIS_RESOURCES.slice(0, 3),
      };
    }
  }

  return {
    isCrisisDetected: false,
    severity: 'none',
    message: null,
    resources: [],
  };
}
