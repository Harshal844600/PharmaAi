/**
 * services/phenotypeEngine.js
 *
 * Builds a complete pharmacogenomic profile for a single gene:
 *   1. Constructs the diplotype string from detected alleles
 *   2. Calculates the combined activity score
 *   3. Maps activity score → phenotype (PM/IM/NM/RM/URM)
 *
 * Activity scoring:
 *   Each allele has an independent function value (0.0 – 1.0).
 *   The diplotype score is the SUM of both allele scores (range 0.0 – 2.0).
 *   Gene duplication (*xN) can push the score above 2.0 — capped at URM.
 */

const { activityToPhenotype, getAlleleActivity, PHENOTYPE_ACTIVITY } = require('../config/phenotypeMap');

/**
 * Build a genetic profile for one gene.
 *
 * @param {string} gene    - Gene symbol (e.g., 'CYP2D6')
 * @param {object} geneData - { alleles: ['*4', '*1'], rsids: ['rs3892097'] }
 * @returns {{
 *   primaryGene: string,
 *   diplotype: string,
 *   phenotype: string,
 *   activityScore: number,
 *   detectedVariants: Array<{ rsid: string }>,
 *   confidence: number
 * }}
 */
function buildGeneticProfile(gene, geneData) {
  const alleles = geneData?.alleles || [];
  const rsids = geneData?.rsids || [];

  let confidence;
  let diplotype;
  let activityScore;
  let phenotype;

  if (alleles.length === 0) {
    // No allele data for this gene — treat as unknown rather than assuming normal.
    // This avoids incorrectly labeling risk as 'Safe' when no genotype information is present.
    diplotype = '*1/*1';
    activityScore = null; // Unknown activity
    phenotype = 'Unknown';
    confidence = 0.3; // Low confidence — no detected variant data
  } else {
    // Ensure exactly two alleles for diplotype (pad with *1 if only one detected)
    const allele1 = alleles[0] || '*1';
    const allele2 = alleles[1] || '*1';

    diplotype = `${allele1}/${allele2}`;

    // Sum individual allele activity scores
    activityScore = getAlleleActivity(allele1) + getAlleleActivity(allele2);

    phenotype = activityToPhenotype(activityScore);
    confidence = 0.9; // High confidence — direct allele detection
  }

  return {
    primaryGene: gene,
    diplotype,
    phenotype,
    activityScore,
    detectedVariants: rsids.map((rsid) => ({ rsid })),
    confidence,
  };
}

module.exports = { buildGeneticProfile };
