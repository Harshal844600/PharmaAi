/**
 * services/riskEngine.js
 *
 * Deterministic rule-based risk prediction engine.
 * Risk is NEVER calculated by the LLM — this is intentional and critical.
 *
 * Risk Logic by drug type:
 *
 *   prodrug (enzyme must activate the drug):
 *     activity == 0   → Ineffective   (can't activate the prodrug)
 *     activity > 1    → Toxic         (over-activation → excess active metabolite)
 *     activity < 1    → Adjust Dosage (under-activation → subtherapeutic)
 *     activity == 1   → Safe
 *
 *   detox (enzyme must clear/inactivate the drug):
 *     activity == 0   → Toxic         (drug accumulates — no clearance)
 *     activity < 1    → Adjust Dosage (slower clearance → higher exposure)
 *     activity >= 1   → Safe
 *
 *   transporter (enzyme controls hepatic drug uptake):
 *     activity < 1    → Toxic         (impaired transport → systemic accumulation)
 *     else            → Safe
 *
 *   unsupported drug → Unknown
 */

// ─── Severity mapping ──────────────────────────────────────────────────────────
const SEVERITY_MAP = {
  Safe: 'none',
  'Adjust Dosage': 'moderate',
  Ineffective: 'high',
  Toxic: 'critical',
  Unknown: 'low',
};

// ─── Clinical recommendation templates ────────────────────────────────────────
// Drug-specific recommendations are in drugConfig.js.
// These serve as gene-agnostic fallbacks.
const DEFAULT_RECOMMENDATIONS = {
  Safe: 'Standard dosing acceptable.',
  'Adjust Dosage': 'Consider dose adjustment based on CPIC guidelines.',
  Ineffective: 'Consider alternative therapy — this drug is unlikely to be effective.',
  Toxic: 'Avoid this drug and consider a safer alternative.',
  Unknown: 'No pharmacogenomic guidance available. Follow standard clinical protocols.',
};

/**
 * Evaluate risk for a prodrug (needs enzymatic activation).
 */
function evaluateProdrugRisk(activityScore) {
  if (activityScore === 0) return 'Ineffective';
  if (activityScore > 1) return 'Toxic';
  if (activityScore < 1) return 'Adjust Dosage';
  return 'Safe'; // activityScore === 1
}

/**
 * Evaluate risk for a detox drug (enzyme must clear the drug).
 */
function evaluateDetoxRisk(activityScore) {
  if (activityScore === 0) return 'Toxic';
  if (activityScore < 1) return 'Adjust Dosage';
  return 'Safe'; // activityScore >= 1
}

/**
 * Evaluate risk for a transporter drug (enzyme controls drug uptake).
 */
function evaluateTransporterRisk(activityScore) {
  if (activityScore < 1) return 'Toxic';
  return 'Safe';
}

/**
 * Main risk assessment function.
 *
 * @param {string} drugType      - 'prodrug' | 'detox' | 'transporter' | null
 * @param {number} activityScore - Combined diplotype activity (0.0 – 2.0+)
 * @returns {{ risk_label: string, severity: string, confidence_score: number }}
 */
function assessRisk(drugType, activityScore, baseConfidence = 0.9) {
  let riskLabel;

  // If activity score is unknown (null/undefined), return Unknown risk
  if (activityScore === null || activityScore === undefined) {
    return {
      risk_label: 'Unknown',
      severity: SEVERITY_MAP['Unknown'],
      confidence_score: 0.25,
    };
  }

  switch (drugType) {
    case 'prodrug':
      riskLabel = evaluateProdrugRisk(activityScore);
      break;
    case 'detox':
      riskLabel = evaluateDetoxRisk(activityScore);
      break;
    case 'transporter':
      riskLabel = evaluateTransporterRisk(activityScore);
      break;
    default:
      riskLabel = 'Unknown';
      baseConfidence = 0.2; // Very low confidence for unsupported drugs
  }

  return {
    risk_label: riskLabel,
    severity: SEVERITY_MAP[riskLabel] || 'low',
    confidence_score: baseConfidence,
  };
}

/**
 * Get the clinical recommendation text for a given risk label.
 * Uses drug-specific recommendations from drugConfig when available.
 *
 * @param {string} riskLabel  - Risk label string
 * @param {object} drugConfig - Drug config entry (may have recommendations map)
 * @returns {string}
 */
function getRecommendation(riskLabel, drugConfig) {
  if (drugConfig?.recommendations?.[riskLabel]) {
    return drugConfig.recommendations[riskLabel];
  }
  return DEFAULT_RECOMMENDATIONS[riskLabel] || DEFAULT_RECOMMENDATIONS['Unknown'];
}

module.exports = { assessRisk, getRecommendation, SEVERITY_MAP, DEFAULT_RECOMMENDATIONS };
