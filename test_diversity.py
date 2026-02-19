"""Test that the backend returns DIFFERENT results per drug."""
import sys, os, json
sys.path.insert(0, os.path.abspath("."))

from backend.pharmacogenomics import analyze_vcf

# Sample VCF with a CYP2C19 *2 variant
vcf = """##fileformat=VCFv4.2
##fileDate=20240101
##source=TestLab
#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO
10\t94781859\trs4244285\tG\tA\t100\tPASS\t.
22\t42128945\trs3892097\tC\tT\t99\tPASS\t.
"""

results = analyze_vcf(vcf, "TEST_001")

print(f"Total results: {len(results)}")
print("=" * 70)
for r in results:
    print(f"Drug: {r.drug:15s} | Gene: {r.pharmacogenomic_profile.primary_gene:8s} | "
          f"Phenotype: {r.pharmacogenomic_profile.phenotype:7s} | "
          f"Risk: {r.risk_assessment.risk_label:15s} | "
          f"Confidence: {r.risk_assessment.confidence_score}")
print("=" * 70)

# Verify diversity
drugs = [r.drug for r in results]
genes = [r.pharmacogenomic_profile.primary_gene for r in results]
unique_drugs = set(drugs)
unique_genes = set(genes)
print(f"Unique drugs: {len(unique_drugs)} -> {unique_drugs}")
print(f"Unique genes: {len(unique_genes)} -> {unique_genes}")

if len(unique_drugs) < 2:
    print("BUG: All results have the same drug!")
if len(unique_genes) < 2:
    print("BUG: All results have the same gene!")
