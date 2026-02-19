// Analysis engine: type definitions and utilities for pharmacogenomic analysis results

export interface AnalysisResult {
  patient_id: string;
  drug: string;
  timestamp: string;
  risk_assessment: {
    risk_label: string;
    confidence_score: number;
    severity: string;
  };
  pharmacogenomic_profile: {
    primary_gene: string;
    diplotype: string;
    phenotype: string;
    detected_variants: {
      rsid: string;
      gene?: string;
      star_allele?: string;
      chrom?: string;
      pos?: string;
    }[];
  };
  clinical_recommendation: {
    // Backend uses "suggestion", frontend legacy uses "recommendation"
    suggestion?: string;
    recommendation?: string;
    alternative_drugs?: string[];
    cpic_alignment?: boolean;
  };
  llm_generated_explanation: {
    summary: string;
    mechanism: string;
    clinical_impact?: string;
    lifestyle_tips?: string[];
    variant_citations?: string[];
  };
  quality_metrics: {
    vcf_parsing_success: boolean;
    missing_annotations?: boolean;
    gene_covered?: boolean;
    source?: string;
  };
  risk_scores?: { before: number; after: number };
}

/**
 * Helper: get the recommendation text from either backend or frontend format.
 */
export function getRecommendationText(result: AnalysisResult): string {
  return result.clinical_recommendation.suggestion
    || result.clinical_recommendation.recommendation
    || 'No recommendation available.';
}

/**
 * Normalize a backend response (single object or array) into an array of AnalysisResult.
 */
export function normalizeBackendResponse(data: any): AnalysisResult[] {
  if (Array.isArray(data)) return data;
  return [data];
}
