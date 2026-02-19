/**
 * services/vcfParser.js
 *
 * Parses VCF (Variant Call Format v4.2) files and extracts
 * pharmacogenomically relevant variants for 6 target genes.
 *
 * VCF column layout (tab-separated):
 *   #CHROM | POS | ID | REF | ALT | QUAL | FILTER | INFO | FORMAT | SAMPLE
 *
 * We read INFO tags:
 *   GENE=CYP2D6   — which gene this variant belongs to
 *   STAR=*4       — star allele designation
 *
 * We also read the FORMAT/SAMPLE columns to extract genotype (GT).
 */

const SUPPORTED_GENES = ['CYP2D6', 'CYP2C19', 'CYP2C9', 'SLCO1B1', 'TPMT', 'DPYD'];

/**
 * Parse a VCF INFO field string into a key-value object.
 * Example: "GENE=CYP2D6;STAR=*4;AF=0.05" → { GENE: 'CYP2D6', STAR: '*4', AF: '0.05' }
 *
 * @param {string} infoStr - Raw INFO column string
 * @returns {object}
 */
function parseInfoField(infoStr) {
  const info = {};
  if (!infoStr || infoStr === '.') return info;

  infoStr.split(';').forEach((token) => {
    const eqIdx = token.indexOf('=');
    if (eqIdx !== -1) {
      info[token.substring(0, eqIdx).trim()] = token.substring(eqIdx + 1).trim();
    } else {
      info[token.trim()] = true; // Flag-type field with no value
    }
  });

  return info;
}

/**
 * Extract the GT (genotype) field from the FORMAT/SAMPLE columns.
 * FORMAT: "GT:DP:GQ" and SAMPLE: "0/1:30:99" → returns "0/1"
 *
 * @param {string} formatCol - FORMAT column (e.g., "GT:DP:GQ")
 * @param {string} sampleCol - SAMPLE column (e.g., "0/1:30:99")
 * @returns {string} Raw genotype string or "." if unavailable
 */
function extractGenotype(formatCol, sampleCol) {
  if (!formatCol || !sampleCol) return '.';

  const formatKeys = formatCol.split(':');
  const sampleValues = sampleCol.split(':');
  const gtIndex = formatKeys.indexOf('GT');

  return gtIndex !== -1 ? (sampleValues[gtIndex] || '.') : '.';
}

/**
 * Main VCF parsing function.
 *
 * @param {string} fileContent - Raw text content of the uploaded VCF file
 * @returns {{
 *   geneMap: object,    // { CYP2D6: { alleles: ['*4','*1'], rsids: ['rs3892097'] } }
 *   allVariants: Array, // Flat list of all parsed variant objects
 *   success: boolean,
 *   error: string|null
 * }}
 */
function parseVCF(fileContent) {
  try {
    const lines = fileContent.split('\n');

    // geneMap accumulates alleles and rsIDs per gene
    const geneMap = {};

    // Flat list for debugging / full audit trail
    const allVariants = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();

      // Skip header lines (start with '#') and blank lines
      if (!line || line.startsWith('#')) continue;

      const cols = line.split('\t');

      // VCF data rows need at minimum 8 columns (through INFO)
      if (cols.length < 8) continue;

      const rsid = cols[2] && cols[2] !== '.' ? cols[2] : 'unknown';
      const infoStr = cols[7];
      const formatCol = cols[8] || '';
      const sampleCol = cols[9] || '';

      const info = parseInfoField(infoStr);

      const gene = info['GENE'] ? info['GENE'].toUpperCase() : null;
      const starAllele = info['STAR'] || null;
      const genotype = extractGenotype(formatCol, sampleCol);

      // Skip variants not in our supported gene set
      if (!gene || !SUPPORTED_GENES.includes(gene)) continue;

      // Record the variant in the flat list
      const variant = { rsid, gene, starAllele: starAllele || '*1', genotype, rawInfo: info };
      allVariants.push(variant);

      // Accumulate alleles and rsIDs per gene
      if (!geneMap[gene]) {
        geneMap[gene] = { alleles: [], rsids: [] };
      }

      if (starAllele) {
        geneMap[gene].alleles.push(starAllele);
      }

      if (rsid !== 'unknown') {
        geneMap[gene].rsids.push(rsid);
      }
    }

    return { geneMap, allVariants, success: true, error: null };
  } catch (err) {
    return { geneMap: {}, allVariants: [], success: false, error: err.message };
  }
}

module.exports = { parseVCF, SUPPORTED_GENES };
