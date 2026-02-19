
import { analyzeAllDrugs } from "./src/lib/analysis-engine";

// Mock VCF with some specific variants to see if we get different results
// rs4244285 is CYP2C19 *2 (loss of function)
const MOCK_VCF = `##fileformat=VCFv4.2
##fileDate=20240101
##source=Test
##reference=GRCh38
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO
10	94762000	rs4244285	G	A	.	.	RSID=rs4244285;GENE=CYP2C19
22	42126000	.	G	A	.	.	.
`;

console.log("Running analysis on mock VCF...");
const results = analyzeAllDrugs(MOCK_VCF, "test-patient");

results.forEach(r => {
    console.log(`--- ${r.drug} (${r.pharmacogenomic_profile.primary_gene}) ---`);
    console.log(`Phenotype: ${r.pharmacogenomic_profile.phenotype}`);
    console.log(`Risk: ${r.risk_assessment.risk_label}`);
    console.log(`Coverage: ${r.quality_metrics.gene_covered}`);
    console.log(`Summary: ${r.llm_generated_explanation.summary.substring(0, 50)}...`);
});
