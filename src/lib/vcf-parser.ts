// VCF File Parser - Extracts pharmacogenomic variants from VCF v4.2 files

export interface VcfVariant {
  chrom: string;
  pos: string;
  id: string;
  ref: string;
  alt: string;
  qual: string;
  filter: string;
  info: Record<string, string>;
  gene?: string;
  starAllele?: string;
  rsid?: string;
}

export interface VcfMetadata {
  date?: string;
  source?: string;
  reference?: string;
}

// Known pharmacogenomic variant positions (GRCh38)
const PHARMACOGENE_REGIONS: Record<string, { chrom: string; start: number; end: number }> = {
  CYP2D6: { chrom: "22", start: 42126000, end: 42130000 },
  CYP2C19: { chrom: "10", start: 94762000, end: 94855000 },
  CYP2C9: { chrom: "10", start: 94938000, end: 94990000 },
  SLCO1B1: { chrom: "12", start: 21176000, end: 21240000 },
  TPMT: { chrom: "6", start: 18128000, end: 18157000 },
  DPYD: { chrom: "1", start: 97543000, end: 98386000 },
};

// Known rsIDs mapped to gene + star allele
// Expanded list for better coverage
const KNOWN_RSID_MAP: Record<string, { gene: string; starAllele: string }> = {
  // CYP2D6
  rs3892097: { gene: "CYP2D6", starAllele: "*4" },
  rs5030655: { gene: "CYP2D6", starAllele: "*6" },
  rs16947: { gene: "CYP2D6", starAllele: "*2" },
  rs1065852: { gene: "CYP2D6", starAllele: "*10" },
  rs28371725: { gene: "CYP2D6", starAllele: "*41" },

  // CYP2C19
  rs4244285: { gene: "CYP2C19", starAllele: "*2" },
  rs4986893: { gene: "CYP2C19", starAllele: "*3" },
  rs12248560: { gene: "CYP2C19", starAllele: "*17" },

  // CYP2C9
  rs1799853: { gene: "CYP2C9", starAllele: "*2" },
  rs1057910: { gene: "CYP2C9", starAllele: "*3" },

  // SLCO1B1
  rs4149056: { gene: "SLCO1B1", starAllele: "*5" },

  // TPMT
  rs1800460: { gene: "TPMT", starAllele: "*3B" },
  rs1142345: { gene: "TPMT", starAllele: "*3C" },

  // DPYD
  rs3918290: { gene: "DPYD", starAllele: "*2A" },
  rs67376798: { gene: "DPYD", starAllele: "*13" },
  rs55886062: { gene: "DPYD", starAllele: "*13" },
};

export interface VcfParseResult {
  isValid: boolean;
  error?: string;
  variants: VcfVariant[];
  pharmacogenomicVariants: VcfVariant[];
  header: string[];
  totalLines: number;
  metadata: VcfMetadata;
  geneCoverage: Record<string, boolean>; // True if gene region is covered in VCF
}

export function validateVcfFile(file: File): { valid: boolean; error?: string } {
  if (!file.name.toLowerCase().endsWith(".vcf")) {
    return { valid: false, error: "File must have .vcf extension" };
  }
  if (file.size > 50 * 1024 * 1024) { // Increased limit to 50MB
    return { valid: false, error: "File exceeds 50MB limit" };
  }
  return { valid: true };
}

export function parseVcfContent(content: string): VcfParseResult {
  const lines = content.split("\n").filter((l) => l.trim());
  const headerLines = lines.filter((l) => l.startsWith("#"));
  const dataLines = lines.filter((l) => !l.startsWith("#"));

  // 1. Validate VCF format
  const formatLine = headerLines.find((l) => l.startsWith("##fileformat="));
  if (!formatLine) {
    return {
      isValid: false,
      error: "Missing VCF file format header. Expected ##fileformat=VCFv4.x",
      variants: [],
      pharmacogenomicVariants: [],
      header: [],
      totalLines: 0,
      metadata: {},
      geneCoverage: {}
    };
  }

  // 2. Extract Metadata
  const metadata: VcfMetadata = {};
  const dateLine = headerLines.find(l => l.startsWith("##fileDate="));
  if (dateLine) metadata.date = dateLine.split("=")[1];

  const sourceLine = headerLines.find(l => l.startsWith("##source="));
  if (sourceLine) metadata.source = sourceLine.split("=")[1];

  const refLine = headerLines.find(l => l.startsWith("##reference="));
  if (refLine) metadata.reference = refLine.split("=")[1];


  const columnHeader = headerLines.find((l) => l.startsWith("#CHROM"));
  if (!columnHeader) {
    return { isValid: false, error: "Missing #CHROM column header line", variants: [], pharmacogenomicVariants: [], header: [], totalLines: 0, metadata, geneCoverage: {} };
  }

  const variants: VcfVariant[] = [];
  const geneCoverage: Record<string, boolean> = {};

  // Initialize coverage to false
  Object.keys(PHARMACOGENE_REGIONS).forEach(g => geneCoverage[g] = false);

  for (const line of dataLines) {
    const fields = line.split("\t");
    if (fields.length < 5) continue; // Relaxed check, sometimes VCFs are minimal

    const [chromRaw, pos, id, ref, alt, qual, filter, infoStr] = fields;

    // Normalize chromosome (remove 'chr' prefix)
    const chrom = chromRaw.replace(/^chr/i, "");

    const info: Record<string, string> = {};
    if (infoStr && infoStr !== ".") {
      infoStr.split(";").forEach((pair) => {
        const [key, ...valParts] = pair.split("=");
        info[key] = valParts.join("=") || "true";
      });
    }

    // Try to identify gene/rsid from INFO tags or known rsIDs
    let gene = info.GENE || info.gene || undefined;
    let starAllele = info.STAR || info.star_allele || undefined;
    let rsid = id !== "." ? id : info.RSID || info.rsid || undefined;

    // Check if rsid maps to a known pharmacogene
    if (rsid && KNOWN_RSID_MAP[rsid]) {
      gene = gene || KNOWN_RSID_MAP[rsid].gene;
      starAllele = starAllele || KNOWN_RSID_MAP[rsid].starAllele;
    }

    // Check by chromosomal position
    const posNum = parseInt(pos, 10);

    // Update coverage detection
    // If we see *any* variant in the gene's region, we assume the gene is covered
    if (!gene) {
      for (const [geneName, region] of Object.entries(PHARMACOGENE_REGIONS)) {
        if (chrom === region.chrom && posNum >= region.start && posNum <= region.end) {
          gene = geneName;
          geneCoverage[geneName] = true;
          break;
        }
      }
    } else if (PHARMACOGENE_REGIONS[gene]) {
      geneCoverage[gene] = true;
    }

    variants.push({ chrom, pos, id, ref, alt, qual, filter, info, gene, starAllele, rsid });
  }

  const pharmacogenomicVariants = variants.filter((v) => v.gene && Object.keys(PHARMACOGENE_REGIONS).includes(v.gene));

  return {
    isValid: true,
    variants,
    pharmacogenomicVariants,
    header: headerLines,
    totalLines: dataLines.length,
    metadata,
    geneCoverage
  };
}

export const TARGET_GENES = Object.keys(PHARMACOGENE_REGIONS);
