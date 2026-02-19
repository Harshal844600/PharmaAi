
import { supabase } from "@/integrations/supabase/client";
import { AnalysisResult, getRecommendationText } from "./analysis-engine";
import { toast } from "sonner";

export async function saveAnalysisResult(result: AnalysisResult) {
    let toastId: string | number | undefined;
    try {
        toastId = toast.loading("Saving results to secure storage...");

        // 1. Ensure User/Patient Exists
        const { error: patientError } = await supabase
            .from("patients")
            .upsert({ patient_id: result.patient_id }, { onConflict: "patient_id" });

        if (patientError) {
            console.error("Error saving patient:", patientError);
        }

        // 2. Save Analysis
        const { error } = await supabase.from("drug_analyses").insert({
            patient_id: result.patient_id,
            drug: result.drug,
            risk_label: result.risk_assessment.risk_label,
            severity: result.risk_assessment.severity,
            confidence_score: result.risk_assessment.confidence_score,
            recommendation: getRecommendationText(result),
            primary_gene: result.pharmacogenomic_profile.primary_gene,
            diplotype: result.pharmacogenomic_profile.diplotype,
            phenotype: result.pharmacogenomic_profile.phenotype,
            detected_variants: result.pharmacogenomic_profile.detected_variants as unknown as any,
            alternative_drugs: (result.clinical_recommendation.alternative_drugs || []) as unknown as any,
            cpic_alignment: result.clinical_recommendation.cpic_alignment ?? true,
            llm_explanation: result.llm_generated_explanation as unknown as any,
            full_result: result as unknown as any,
        });

        if (error) throw error;

        // 3. Save Risk Metrics (only if risk_scores are present)
        if (result.risk_scores) {
            const { error: riskError } = await supabase.from("risk_trend_metrics").insert({
                patient_id: result.patient_id,
                drug_name: result.drug,
                before_score: result.risk_scores.before,
                after_score: result.risk_scores.after,
            });

            if (riskError) {
                console.error("Error saving risk metrics:", riskError);
            }
        }

        toast.dismiss(toastId);

        toast.success("Analysis saved to secure health record.");
        return true;

    } catch (err) {
        console.error("Unexpected error saving analysis:", err);
        if (toastId) toast.dismiss(toastId);
        toast.error("Failed to save result to history.");
        return null;
    }
}
