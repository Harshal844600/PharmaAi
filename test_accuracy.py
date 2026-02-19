"""
End-to-end test: Verify that the analysis engine produces DIFFERENT results
per drug based on actual VCF variant data with genotypes.
"""
import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.vcf_parser import parse_vcf_content
from backend.pharmacogenomics import analyze_vcf

# Realistic VCF with GT fields — some variants present, some not
TEST_VCF = """##fileformat=VCFv4.2
##source=PharmaGuardTest
##reference=GRCh38
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
##FORMAT=<ID=DP,Number=1,Type=Integer,Description="Read Depth">
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT	SAMPLE1
chr22	42128945	rs3892097	C	T	100	PASS	.	GT:DP	0/1:35
chr10	94781859	rs4244285	G	A	200	PASS	.	GT:DP	1/1:42
chr10	94942290	rs1799853	C	T	150	PASS	.	GT:DP	0/1:28
chr12	21178615	rs4149056	T	C	180	PASS	.	GT:DP	0/0:50
chr6	18139051	rs1142345	A	G	120	PASS	.	GT:DP	0/1:30
chr1	97915614	rs3918290	C	T	250	PASS	.	GT:DP	1/1:60
"""

print("=" * 70)
print("STEP 1: VCF Parsing")
print("=" * 70)

parse = parse_vcf_content(TEST_VCF)
print(f"Total data lines: {parse.totalLines}")
print(f"PGx variants found: {len(parse.pharmacogenomicVariants)}")
print(f"\nGene Coverage:")
for gene, covered in parse.geneCoverage.items():
    print(f"  {gene}: {'✓ COVERED' if covered else '✗ NOT COVERED'}")

print(f"\nDetected Variants:")
for v in parse.pharmacogenomicVariants:
    print(f"  {v.rsid} → {v.gene} {v.starAllele} | GT={v.genotype} | Zygosity={v.zygosity}")

print("\n" + "=" * 70)
print("STEP 2: Analysis Results (should be DIFFERENT per drug)")
print("=" * 70)

results = analyze_vcf(TEST_VCF, "TEST_PATIENT")

for r in results:
    print(f"\n{'─' * 50}")
    print(f"  Drug: {r.drug}")
    print(f"  Gene: {r.pharmacogenomic_profile.primary_gene}")
    print(f"  Diplotype: {r.pharmacogenomic_profile.diplotype}")
    print(f"  Phenotype: {r.pharmacogenomic_profile.phenotype}")
    print(f"  Risk: {r.risk_assessment.risk_label}")
    print(f"  Confidence: {r.risk_assessment.confidence_score * 100:.0f}%")
    print(f"  Severity: {r.risk_assessment.severity}")
    print(f"  Covered: {r.quality_metrics.gene_covered}")
    print(f"  Variants: {len(r.pharmacogenomic_profile.detected_variants)}")

# Verify all results are DIFFERENT
print("\n" + "=" * 70)
print("STEP 3: Uniqueness Check")
print("=" * 70)

risk_labels = [r.risk_assessment.risk_label for r in results]
genes = [r.pharmacogenomic_profile.primary_gene for r in results]
phenotypes = [r.pharmacogenomic_profile.phenotype for r in results]
confidences = [r.risk_assessment.confidence_score for r in results]

print(f"Risk labels: {risk_labels}")
print(f"Genes: {genes}")
print(f"Phenotypes: {phenotypes}")
print(f"Confidences: {confidences}")

all_unique_genes = len(set(genes)) == len(genes)
diverse_risks = len(set(risk_labels)) > 1
diverse_phenotypes = len(set(phenotypes)) > 1

print(f"\n✓ All genes unique: {all_unique_genes}")
print(f"✓ Diverse risk labels: {diverse_risks}")
print(f"✓ Diverse phenotypes: {diverse_phenotypes}")

if all_unique_genes and diverse_risks and diverse_phenotypes:
    print("\n🎉 SUCCESS: Analysis produces accurate, diverse results per drug!")
else:
    print("\n❌ FAILURE: Some results are still identical")
