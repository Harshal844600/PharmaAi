/**
 * routes/analyze.js
 *
 * POST /analyze
 *
 * Orchestrates the complete pharmacogenomic analysis pipeline:
 *   1. Validate inputs (file + drug_name)
 *   2. Parse VCF file
 *   3. For each drug: build genetic profile → assess risk → generate LLM explanation
 *   4. Save result(s) to MongoDB
 *   5. Return structured JSON response
 *
 * Accepts:
 *   vcf_file   (multipart file) — .vcf only, max 5 MB
 *   drug_name  (string)        — single or comma-separated drug names
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const { upload } = require('../middleware/uploadMiddleware');
const { parseVCF } = require('../services/vcfParser');
const { buildGeneticProfile } = require('../services/phenotypeEngine');
const { assessRisk, getRecommendation } = require('../services/riskEngine');
const { generateExplanation } = require('../services/geminiService');
const { DRUG_CONFIG, SUPPORTED_DRUGS } = require('../config/drugConfig');
const Analysis = require('../models/Analysis');

/**
 * Validate and normalize drug name input.
 * Returns an array of uppercase drug name strings.
 */
function parseDrugNames(drugNameStr) {
  if (!drugNameStr || typeof drugNameStr !== 'string') return [];
  return drugNameStr
    .split(',')
    .map((d) => d.trim().toUpperCase())
    .filter(Boolean);
}

/**
 * Analyze a single drug against VCF-parsed gene data.
 * Returns the full structured response object for that drug.
 *
 * @param {string}  drug       - Uppercase drug name
 * @param {object}  geneMap    - Parsed VCF gene map { CYP2D6: { alleles, rsids }, ... }
 * @param {boolean} vcfSuccess - Whether VCF parsing succeeded
 * @returns {Promise<object>}  - Full analysis result for this drug
 */
async function analyzeOneDrug(drug, geneMap, vcfSuccess) {
  const patientId = `PATIENT_${uuidv4().substring(0, 8).toUpperCase()}`;
  const timestamp = new Date().toISOString();

  const drugConfig = DRUG_CONFIG[drug];

  // ─── Unsupported drug path ────────────────────────────────────────────────────
  if (!drugConfig) {
    const result = {
      patient_id: patientId,
      drug,
      timestamp,
      risk_assessment: { risk_label: 'Unknown', confidence_score: 0.2, severity: 'low' },
      pharmacogenomic_profile: {
        primary_gene: 'UNKNOWN',
        diplotype: 'Unknown',
        phenotype: 'Unknown',
        detected_variants: [],
      },
      clinical_recommendation: {
        suggestion: 'No pharmacogenomic guidance available. Follow standard clinical protocols.',
      },
      llm_generated_explanation: {
        summary: `${drug} is not in the PharmaGuard supported drug list.`,
        mechanism: 'Drug-gene interaction data not available for this compound.',
        clinical_impact: 'Follow standard prescribing guidelines and consult a clinical pharmacist.',
      },
      quality_metrics: { vcf_parsing_success: vcfSuccess },
    };

    // Attempt to save to DB (non-blocking — don't fail response on DB error)
    saveToDatabase(result, 'UNKNOWN', 0.2).catch((e) =>
      console.error('[DB] Failed to save unsupported drug result:', e.message)
    );

    return result;
  }

  const { primaryGene, type } = drugConfig;

  // ─── Build genetic profile ────────────────────────────────────────────────────
  const profile = buildGeneticProfile(primaryGene, geneMap[primaryGene] || {});

  // Debug logs to help trace incorrect risk labels
  console.log(`[Debug] drug=${drug} gene=${primaryGene} diplotype=${profile.diplotype} activityScore=${profile.activityScore} phenotype=${profile.phenotype} confidence=${profile.confidence}`);
  console.log(`[Debug] geneMap for ${primaryGene}:`, geneMap[primaryGene] || { alleles: [], rsids: [] });

  // ─── Risk assessment (deterministic — no LLM) ────────────────────────────────
  const riskAssessment = assessRisk(type, profile.activityScore, profile.confidence);

  // ─── Clinical recommendation ──────────────────────────────────────────────────
  const recommendation = getRecommendation(riskAssessment.risk_label, drugConfig);

  // ─── LLM explanation (Gemini) ─────────────────────────────────────────────────
  const llmExplanation = await generateExplanation({
    drug,
    gene: primaryGene,
    diplotype: profile.diplotype,
    phenotype: profile.phenotype,
    riskLabel: riskAssessment.risk_label,
    detectedVariants: profile.detectedVariants,
  });

  // ─── Assemble final response ───────────────────────────────────────────────────
  const result = {
    patient_id: patientId,
    drug,
    timestamp,
    risk_assessment: {
      risk_label: riskAssessment.risk_label,
      confidence_score: riskAssessment.confidence_score,
      severity: riskAssessment.severity,
    },
    pharmacogenomic_profile: {
      primary_gene: profile.primaryGene,
      diplotype: profile.diplotype,
      phenotype: profile.phenotype,
      detected_variants: profile.detectedVariants,
    },
    clinical_recommendation: {
      suggestion: recommendation,
    },
    llm_generated_explanation: {
      summary: llmExplanation.summary,
      mechanism: llmExplanation.mechanism,
      clinical_impact: llmExplanation.clinical_impact,
    },
    quality_metrics: {
      vcf_parsing_success: vcfSuccess,
    },
  };

  // ─── Persist to MongoDB ────────────────────────────────────────────────────────
  saveToDatabase(result, primaryGene, riskAssessment.confidence_score).catch((e) =>
    console.error('[DB] Failed to save analysis result:', e.message)
  );

  return result;
}

/**
 * Persist an analysis result to MongoDB.
 * Non-blocking — errors are logged but do not affect the API response.
 */
async function saveToDatabase(result, gene, confidence) {
  try {
    await Analysis.create({
      patient_id: result.patient_id,
      drug: result.drug,
      gene,
      diplotype: result.pharmacogenomic_profile.diplotype,
      phenotype: result.pharmacogenomic_profile.phenotype,
      risk: result.risk_assessment.risk_label,
      severity: result.risk_assessment.severity,
      confidence,
      full_response: result,
    });
    console.log(`[DB] Saved analysis for ${result.drug} (${result.patient_id})`);
  } catch (err) {
    console.error('[DB] Save error:', err.message);
    throw err; // Re-throw so caller can catch if needed
  }
}

// ─── Route Handler ──────────────────────────────────────────────────────────────

router.post(
  '/analyze',
  upload.single('vcf_file'), // Multer processes the file upload
  async (req, res, next) => {
    try {
      // ── 1. Validate file ────────────────────────────────────────────────────
      if (!req.file) {
        return res.status(400).json({
          error: true,
          code: 'MISSING_FILE',
          message: 'A VCF file is required. Upload it in the "vcf_file" field.',
        });
      }

      // ── 2. Validate drug_name ───────────────────────────────────────────────
      const rawDrugName = req.body.drug_name;
      if (!rawDrugName || String(rawDrugName).trim() === '') {
        return res.status(400).json({
          error: true,
          code: 'MISSING_DRUG_NAME',
          message: 'The "drug_name" field is required (e.g., "CODEINE" or "CODEINE,WARFARIN").',
        });
      }

      const drugs = parseDrugNames(rawDrugName);
      if (drugs.length === 0) {
        return res.status(400).json({
          error: true,
          code: 'INVALID_DRUG_NAME',
          message: 'No valid drug names found. Use comma-separated names like "CODEINE,WARFARIN".',
        });
      }

      // ── 3. Parse VCF file ───────────────────────────────────────────────────
      const fileContent = req.file.buffer.toString('utf-8');
      const { geneMap, success: vcfSuccess, error: vcfError } = parseVCF(fileContent);

      console.log(
        `[Analyze] Drug(s): ${drugs.join(', ')} | File: ${req.file.originalname} (${req.file.size}B) | VCF parsed: ${vcfSuccess} | Genes: ${Object.keys(geneMap).join(', ') || 'none'}`
      );

      // If VCF parsing failed completely, return an error
      if (!vcfSuccess) {
        return res.status(422).json({
          error: true,
          code: 'VCF_PARSE_ERROR',
          message: `Failed to parse the VCF file: ${vcfError}`,
        });
      }

      // ── 4. Analyze each drug ─────────────────────────────────────────────────
      // Each drug is independently wrapped in try-catch so one failure doesn't crash all
      const results = [];
      for (const drug of drugs) {
        try {
          const r = await analyzeOneDrug(drug, geneMap, vcfSuccess);
          results.push(r);
        } catch (drugErr) {
          console.error(`[Analyze] Error processing ${drug}:`, drugErr.message);
          // Push a safe fallback result so the frontend still gets something
          results.push({
            patient_id: `PATIENT_${Date.now().toString(36).toUpperCase()}`,
            drug,
            timestamp: new Date().toISOString(),
            risk_assessment: { risk_label: 'Unknown', confidence_score: 0.1, severity: 'low' },
            pharmacogenomic_profile: {
              primary_gene: DRUG_CONFIG[drug]?.primaryGene || 'UNKNOWN',
              diplotype: 'Unknown',
              phenotype: 'Unknown',
              detected_variants: [],
            },
            clinical_recommendation: {
              suggestion: 'Analysis encountered an error. Please try again.',
            },
            llm_generated_explanation: {
              summary: `An error occurred while analyzing ${drug}: ${drugErr.message}`,
              mechanism: 'Unable to determine mechanism due to processing error.',
              clinical_impact: 'Please retry the analysis or consult the backend logs.',
            },
            quality_metrics: { vcf_parsing_success: vcfSuccess },
          });
        }
      }

      // Always return an array for frontend consistency
      return res.status(200).json(results);
    } catch (err) {
      // Delegate to global error handler
      next(err);
    }
  }
);

module.exports = router;
