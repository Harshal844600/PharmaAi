
import sys
import os

# Add project root to sys.path
sys.path.append(os.path.abspath("."))

from backend.pharmacogenomics import analyze_vcf

vcf_content = """##fileformat=VCFv4.2
##fileDate=20240101
##source=Test
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO
22	42126611	rs1065852	C	T	.	.	.
"""

patient_id = "TEST_PATIENT"

try:
    print("Running analysis...")
    results = analyze_vcf(vcf_content, patient_id)
    print("Analysis success!")
    print(f"Results count: {len(results)}")
    for r in results:
        print(f"Drug: {r.drug}, Risk: {r.risk_assessment.risk_label}")
except Exception as e:
    print("Analysis failed!")
    import traceback
    traceback.print_exc()
