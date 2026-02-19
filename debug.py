
import sys
import os

print(f"Python Path: {sys.path}")
print(f"CWD: {os.getcwd()}")

try:
    print("Importing models...")
    from backend import models
    print("Models imported.")

    print("Importing vcf_parser...")
    from backend import vcf_parser
    print("VcfParser imported.")

    print("Importing pharmacogenomics...")
    from backend import pharmacogenomics
    print("Pharmacogenomics imported.")

    print("Importing main...")
    from backend import main
    print("Main imported.")

except Exception as e:
    import traceback
    traceback.print_exc()
