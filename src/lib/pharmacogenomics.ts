// Pharmacogenomic risk prediction engine
// Maps gene-drug pairs to clinical recommendations based on CPIC guidelines

import { VcfVariant } from "./vcf-parser";

export interface DrugGeneMap {
  drug: string;
  gene: string;
  phenotypeRiskMap: Record<string, { risk: string; severity: string; confidence: number; recommendation: string; alternatives: string[] }>;
}

export const SUPPORTED_DRUGS: DrugGeneMap[] = [
  {
    drug: "CODEINE",
    gene: "CYP2D6",
    phenotypeRiskMap: {
      PM: { risk: "Ineffective", severity: "high", confidence: 0.92, recommendation: "Avoid codeine. Patient is a CYP2D6 poor metabolizer and cannot convert codeine to morphine. Use alternative analgesics.", alternatives: ["Morphine", "Acetaminophen", "NSAIDs"] },
      IM: { risk: "Adjust Dosage", severity: "moderate", confidence: 0.85, recommendation: "Reduced codeine metabolism expected. Consider lower dose or alternative analgesic. Monitor for inadequate pain relief.", alternatives: ["Tramadol (with caution)", "Acetaminophen"] },
      NM: { risk: "Safe", severity: "none", confidence: 0.95, recommendation: "Standard codeine dosing is appropriate. Normal CYP2D6 metabolizer status.", alternatives: [] },
      RM: { risk: "Safe", severity: "low", confidence: 0.88, recommendation: "Standard dosing likely appropriate. Monitor for enhanced response.", alternatives: [] },
      URM: { risk: "Toxic", severity: "critical", confidence: 0.94, recommendation: "AVOID codeine. Ultra-rapid metabolism leads to dangerously high morphine levels. Risk of respiratory depression and death.", alternatives: ["Morphine (reduced dose)", "Acetaminophen", "NSAIDs"] },
      Unknown: { risk: "Unknown", severity: "moderate", confidence: 0.5, recommendation: "CYP2D6 phenotype could not be determined. Exercise caution with codeine. Consider pharmacogenomic testing.", alternatives: ["Acetaminophen", "NSAIDs"] },
    },
  },
  {
    drug: "CLOPIDOGREL",
    gene: "CYP2C19",
    phenotypeRiskMap: {
      PM: { risk: "Ineffective", severity: "critical", confidence: 0.93, recommendation: "Avoid clopidogrel. Poor metabolizer cannot activate the prodrug. High risk of cardiovascular events.", alternatives: ["Prasugrel", "Ticagrelor"] },
      IM: { risk: "Adjust Dosage", severity: "high", confidence: 0.87, recommendation: "Reduced clopidogrel activation. Consider alternative antiplatelet or increased monitoring.", alternatives: ["Prasugrel", "Ticagrelor"] },
      NM: { risk: "Safe", severity: "none", confidence: 0.95, recommendation: "Standard clopidogrel dosing is appropriate.", alternatives: [] },
      RM: { risk: "Safe", severity: "none", confidence: 0.90, recommendation: "Enhanced clopidogrel activation. Standard dosing appropriate.", alternatives: [] },
      URM: { risk: "Safe", severity: "low", confidence: 0.88, recommendation: "Ultra-rapid metabolism may enhance drug effect. Monitor for bleeding.", alternatives: [] },
      Unknown: { risk: "Unknown", severity: "moderate", confidence: 0.5, recommendation: "CYP2C19 status unknown. Consider alternative antiplatelet agents.", alternatives: ["Prasugrel", "Ticagrelor"] },
    },
  },
  {
    drug: "WARFARIN",
    gene: "CYP2C9",
    phenotypeRiskMap: {
      PM: { risk: "Toxic", severity: "critical", confidence: 0.94, recommendation: "Significantly reduced warfarin metabolism. Use 50-80% dose reduction. High bleeding risk. Frequent INR monitoring required.", alternatives: ["DOACs (Rivaroxaban, Apixaban)"] },
      IM: { risk: "Adjust Dosage", severity: "high", confidence: 0.89, recommendation: "Reduced warfarin clearance. Start with lower dose (25-50% reduction). Close INR monitoring.", alternatives: ["Apixaban", "Rivaroxaban"] },
      NM: { risk: "Safe", severity: "none", confidence: 0.95, recommendation: "Standard warfarin dosing algorithm. Normal CYP2C9 metabolism.", alternatives: [] },
      Unknown: { risk: "Unknown", severity: "moderate", confidence: 0.5, recommendation: "CYP2C9 status unknown. Start warfarin at conservative dose.", alternatives: ["Apixaban", "Rivaroxaban"] },
    },
  },
  {
    drug: "SIMVASTATIN",
    gene: "SLCO1B1",
    phenotypeRiskMap: {
      PM: { risk: "Toxic", severity: "high", confidence: 0.91, recommendation: "High risk of simvastatin-induced myopathy. SLCO1B1 poor function leads to elevated plasma levels. Use alternative statin.", alternatives: ["Pravastatin", "Rosuvastatin", "Fluvastatin"] },
      IM: { risk: "Adjust Dosage", severity: "moderate", confidence: 0.85, recommendation: "Intermediate SLCO1B1 function. Limit simvastatin to ≤20mg/day or use alternative statin.", alternatives: ["Pravastatin", "Rosuvastatin"] },
      NM: { risk: "Safe", severity: "none", confidence: 0.95, recommendation: "Normal SLCO1B1 transporter function. Standard simvastatin dosing appropriate.", alternatives: [] },
      Unknown: { risk: "Unknown", severity: "low", confidence: 0.5, recommendation: "SLCO1B1 status unknown. Consider starting with lower simvastatin dose.", alternatives: ["Pravastatin"] },
    },
  },
  {
    drug: "AZATHIOPRINE",
    gene: "TPMT",
    phenotypeRiskMap: {
      PM: { risk: "Toxic", severity: "critical", confidence: 0.96, recommendation: "AVOID azathioprine or reduce dose by 90%. TPMT-deficient patients at extreme risk of fatal myelosuppression.", alternatives: ["Mycophenolate mofetil"] },
      IM: { risk: "Adjust Dosage", severity: "high", confidence: 0.90, recommendation: "Reduce azathioprine dose by 30-70%. Monitor blood counts weekly for first 8 weeks.", alternatives: ["Mycophenolate mofetil"] },
      NM: { risk: "Safe", severity: "none", confidence: 0.95, recommendation: "Normal TPMT activity. Standard azathioprine dosing.", alternatives: [] },
      Unknown: { risk: "Unknown", severity: "high", confidence: 0.5, recommendation: "TPMT status unknown. Obtain TPMT enzyme activity test before starting azathioprine.", alternatives: ["Mycophenolate mofetil"] },
    },
  },
  {
    drug: "FLUOROURACIL",
    gene: "DPYD",
    phenotypeRiskMap: {
      PM: { risk: "Toxic", severity: "critical", confidence: 0.95, recommendation: "CONTRAINDICATED. DPYD-deficient patients have >50% risk of fatal toxicity with fluorouracil. Avoid completely.", alternatives: ["Capecitabine (with extreme caution)", "Alternative chemotherapy regimen"] },
      IM: { risk: "Adjust Dosage", severity: "high", confidence: 0.88, recommendation: "Reduce fluorouracil dose by 25-50%. Monitor for severe toxicity. Intermediate DPD activity.", alternatives: ["Reduced-dose capecitabine"] },
      NM: { risk: "Safe", severity: "none", confidence: 0.95, recommendation: "Normal DPD activity. Standard fluorouracil dosing.", alternatives: [] },
      Unknown: { risk: "Unknown", severity: "high", confidence: 0.5, recommendation: "DPYD status unknown. Consider DPD enzyme testing before fluoropyrimidine therapy.", alternatives: ["Alternative chemotherapy"] },
    },
  },
];

// Star allele to phenotype mapping
const STAR_ALLELE_FUNCTION: Record<string, Record<string, string>> = {
  CYP2D6: { "*1": "normal", "*2": "normal", "*4": "none", "*6": "none", "*10": "decreased", "*41": "decreased" },
  CYP2C19: { "*1": "normal", "*2": "none", "*3": "none", "*17": "increased" },
  CYP2C9: { "*1": "normal", "*2": "decreased", "*3": "none" },
  SLCO1B1: { "*1": "normal", "*5": "decreased" },
  TPMT: { "*1": "normal", "*3B": "none", "*3C": "none" },
  DPYD: { "*1": "normal", "*2A": "none", "*13": "decreased" },
};

// Priority for calling diplotype: None > Decreased > Increased > Normal
const FUNCTION_PRIORITY: Record<string, number> = {
  "none": 4,
  "decreased": 3,
  "increased": 2,
  "normal": 1,
  "unknown": 0
};

export function inferPhenotype(gene: string, detectedVariants: VcfVariant[]): { diplotype: string; phenotype: string } {
  const geneVariants = detectedVariants.filter((v) => v.gene === gene);
  if (geneVariants.length === 0) return { diplotype: "*1/*1", phenotype: "NM" };

  const starAlleles = geneVariants.map((v) => v.starAllele).filter(Boolean) as string[];
  if (starAlleles.length === 0) return { diplotype: "*1/*1", phenotype: "NM" };

  // Sort alleles by functional impact to handle cases with >2 variants
  // We prioritize the most severe actionable variants
  // This is a simplification; optimal phasing requires haplotyping which is hard from VCF alone
  starAlleles.sort((a, b) => {
    const fA = STAR_ALLELE_FUNCTION[gene]?.[a] || "unknown";
    const fB = STAR_ALLELE_FUNCTION[gene]?.[b] || "unknown";
    return FUNCTION_PRIORITY[fB] - FUNCTION_PRIORITY[fA];
  });

  // Build diplotype (taking top 2 most impact)
  const allele1 = starAlleles[0] || "*1";
  const allele2 = starAlleles[1] || "*1";
  const diplotype = `${allele1}/${allele2}`;

  // Determine function
  const funcMap = STAR_ALLELE_FUNCTION[gene] || {};
  const f1 = funcMap[allele1] || "unknown";
  const f2 = funcMap[allele2] || "unknown";

  if (f1 === "unknown" || f2 === "unknown") return { diplotype, phenotype: "Unknown" };
  if (f1 === "none" && f2 === "none") return { diplotype, phenotype: "PM" };
  if (f1 === "none" && f2 === "decreased") return { diplotype, phenotype: "PM" }; // Severe IM/PM border
  if (f1 === "decreased" && f2 === "none") return { diplotype, phenotype: "PM" };

  if (f1 === "none" || f2 === "none") return { diplotype, phenotype: "IM" };
  if (f1 === "decreased" && f2 === "decreased") return { diplotype, phenotype: "IM" };
  if (f1 === "decreased" || f2 === "decreased") return { diplotype, phenotype: "IM" };

  if (f1 === "increased" && f2 === "increased") return { diplotype, phenotype: "URM" };
  if (f1 === "increased" || f2 === "increased") return { diplotype, phenotype: "RM" };

  return { diplotype, phenotype: "NM" };
}

export function computeRiskScore(riskLabel: string): { before: number; after: number } {
  switch (riskLabel) {
    case "Toxic": return { before: 0.92, after: 0.15 };
    case "Ineffective": return { before: 0.85, after: 0.20 };
    case "Adjust Dosage": return { before: 0.60, after: 0.18 };
    case "Safe": return { before: 0.08, after: 0.05 };
    default: return { before: 0.50, after: 0.30 };
  }
}

export function getDrugGeneMap(drug: string): DrugGeneMap | undefined {
  return SUPPORTED_DRUGS.find((d) => d.drug === drug.toUpperCase());
}
