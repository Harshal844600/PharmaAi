/**
 * config/phenotypeMap.js
 *
 * Maps star-allele diplotypes to phenotype classifications and activity scores.
 *
 * Phenotype codes:
 *   PM  = Poor Metabolizer       (no enzyme function)
 *   IM  = Intermediate Metabolizer (reduced function)
 *   NM  = Normal Metabolizer      (full function)
 *   RM  = Rapid Metabolizer       (increased function)
 *   URM = Ultra-Rapid Metabolizer (greatly increased, e.g. gene duplication)
 *
 * Activity scores are used by the risk engine to determine drug safety.
 */

// ─── Per-allele function value ─────────────────────────────────────────────────
// Each allele contributes independently; diplotype score = allele1 + allele2.
const ALLELE_FUNCTION = {
  '*1': 1.0,   // Normal function (reference)
  '*2': 0.5,   // Reduced function
  '*3': 0.0,   // No function
  '*4': 0.0,   // No function (most common null allele in CYP2D6)
  '*5': 0.0,   // Gene deletion (no function)
  '*6': 0.0,   // No function
  '*7': 0.0,   // No function
  '*8': 0.0,   // No function
  '*10': 0.5,  // Reduced function (prevalent in East Asian populations)
  '*17': 0.5,  // Reduced function (prevalent in African populations)
  '*41': 0.5,  // Reduced function (splicing defect)
  '*2A': 0.0,  // No function (DPYD *2A — most clinically significant)
  '*3C': 0.5,  // Reduced function (TPMT *3C)
  '*5': 0.0,   // No function (SLCO1B1 *5)
  '*xN': 2.0,  // Gene duplication (ultra-rapid) — any *xN pattern
};

// Default activity when an allele is not in the lookup table
const DEFAULT_ALLELE_ACTIVITY = 1.0; // Assume normal function for unknown alleles

// ─── Phenotype → Activity score mapping ───────────────────────────────────────
const PHENOTYPE_ACTIVITY = {
  PM: 0.0,
  IM: 0.5,
  NM: 1.0,
  RM: 1.5,
  URM: 2.0,
  Unknown: 0.5, // Conservative estimate for missing data
};

// ─── Activity score ranges → phenotype ────────────────────────────────────────
// Used to classify a diplotype's combined activity score.
function activityToPhenotype(score) {
  if (score === 0) return 'Poor Metabolizer';
  if (score <= 0.75) return 'Intermediate Metabolizer';
  if (score <= 1.25) return 'Normal Metabolizer';
  if (score <= 1.75) return 'Rapid Metabolizer';
  return 'Ultra-Rapid Metabolizer';
}

/**
 * Get the activity value for a single star allele.
 * Handles gene duplication patterns (*1xN, *2xN → ultra-rapid).
 */
function getAlleleActivity(allele) {
  if (!allele) return DEFAULT_ALLELE_ACTIVITY;

  const normalized = allele.toLowerCase();

  // Gene duplication patterns → ultra-rapid
  if (/x[n23456]/i.test(normalized)) {
    return ALLELE_FUNCTION['*xN'];
  }

  return ALLELE_FUNCTION[allele] !== undefined
    ? ALLELE_FUNCTION[allele]
    : DEFAULT_ALLELE_ACTIVITY;
}

module.exports = {
  ALLELE_FUNCTION,
  DEFAULT_ALLELE_ACTIVITY,
  PHENOTYPE_ACTIVITY,
  activityToPhenotype,
  getAlleleActivity,
};
