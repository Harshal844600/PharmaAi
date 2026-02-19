import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X, HardDrive, Shield } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface VcfUploaderProps {
  onFileAccepted: (file: File, content: string) => void;
  isProcessing: boolean;
}

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateVcfStructure(content: string): { valid: boolean; error?: string; stats?: { lines: number; variants: number; hasHeader: boolean } } {
  const lines = content.split("\n").filter(l => l.trim().length > 0);

  if (lines.length === 0) {
    return { valid: false, error: "The file is empty. Please upload a valid VCF file." };
  }

  // Check for VCF format header
  const hasFormatLine = lines.some(l => l.startsWith("##fileformat=VCF"));
  if (!hasFormatLine) {
    return { valid: false, error: "Missing ##fileformat=VCF header. This does not appear to be a valid VCF file." };
  }

  // Check for column header
  const hasColumnHeader = lines.some(l => l.startsWith("#CHROM"));
  if (!hasColumnHeader) {
    return { valid: false, error: "Missing #CHROM header line. The VCF file structure is incomplete." };
  }

  // Count data lines
  const dataLines = lines.filter(l => !l.startsWith("#"));
  if (dataLines.length === 0) {
    return { valid: false, error: "No variant data found in the VCF file. The file contains only headers." };
  }

  // Validate first data line has enough columns
  const firstData = dataLines[0].split(/\t|\s+/);
  if (firstData.length < 5) {
    return { valid: false, error: "Invalid variant format. Each data line must have at least 5 columns (CHROM, POS, ID, REF, ALT)." };
  }

  return {
    valid: true,
    stats: {
      lines: lines.length,
      variants: dataLines.length,
      hasHeader: hasFormatLine,
    }
  };
}

export default function VcfUploader({ onFileAccepted, isProcessing }: VcfUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [variantCount, setVariantCount] = useState<number>(0);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);

    // Handle rejected files (from dropzone constraints)
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors?.some((e: any) => e.code === "file-too-large")) {
        setError(`File too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB. Your file is ${formatFileSize(rejection.file.size)}.`);
      } else if (rejection.errors?.some((e: any) => e.code === "file-invalid-type")) {
        setError("Invalid file type. Please upload a .vcf file.");
      } else {
        setError("File could not be uploaded. Please try again.");
      }
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    // Extension check
    if (!file.name.endsWith(".vcf") && !file.name.endsWith(".vcf.gz")) {
      setError("Please upload a valid .vcf file. Supported extensions: .vcf");
      return;
    }

    // Size check (redundant with dropzone, but extra safety)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File too large (${formatFileSize(file.size)}). Maximum allowed: ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;

      // Deep VCF validation
      const validation = validateVcfStructure(content);
      if (!validation.valid) {
        setError(validation.error || "Invalid VCF file");
        return;
      }

      setFileName(file.name);
      setFileSize(file.size);
      setVariantCount(validation.stats?.variants || 0);
      onFileAccepted(file, content);
      toast.success(`Loaded ${validation.stats?.variants} variants from ${file.name}`);
    };
    reader.onerror = () => {
      setError("Failed to read the file. It may be corrupted or encrypted.");
    };
    reader.readAsText(file);
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/plain": [".vcf"], "text/vcf": [".vcf"] },
    multiple: false,
    disabled: isProcessing,
    maxSize: MAX_FILE_SIZE_BYTES,
  });

  const clearFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setFileName(null);
    setFileSize(0);
    setVariantCount(0);
    setError(null);
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer h-64 flex flex-col items-center justify-center gap-4 group ${isDragActive
          ? "border-red-500 bg-red-500/10 scale-[1.02]"
          : fileName
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
          }`}
      >
        <input {...getInputProps()} />

        {/* Drag overlay effect */}
        {isDragActive && (
          <div className="absolute inset-0 bg-red-500/5 backdrop-blur-sm z-20 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <Upload className="h-12 w-12 text-red-500 animate-bounce" />
              <p className="text-lg font-semibold text-red-400">Drop VCF file here</p>
            </motion.div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-md bg-red-500/50 animate-pulse" />
                <Loader2 className="h-10 w-10 animate-spin text-red-500 relative z-10" />
              </div>
              <p className="text-sm font-medium text-zinc-300 animate-pulse">Analyzing Genome...</p>
            </motion.div>
          ) : fileName ? (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-3 relative"
            >
              <button
                onClick={clearFile}
                className="absolute top-0 right-4 p-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-zinc-400" />
              </button>
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">{fileName}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    {formatFileSize(fileSize)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-emerald-500" />
                    {variantCount} variants
                  </span>
                </div>
                <p className="text-xs text-emerald-400/70 mt-1">✓ VCF validated • Ready for analysis</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all duration-500" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/30 group-hover:scale-105 transition-transform duration-300">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-lg font-semibold text-foreground">Drop your VCF file here</p>
                <p className="text-sm text-muted-foreground">or <span className="text-primary underline underline-offset-2">browse files</span></p>
                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2 justify-center">
                  <span className="flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded-md border border-white/5">
                    <FileText className="h-3 w-3" /> .vcf
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" /> Max {MAX_FILE_SIZE_MB}MB
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* File size progress indicator */}
      {fileSize > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 px-1"
        >
          <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
            <span>{formatFileSize(fileSize)}</span>
            <span>{MAX_FILE_SIZE_MB}MB limit</span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${(fileSize / MAX_FILE_SIZE_BYTES) > 0.8 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min((fileSize / MAX_FILE_SIZE_BYTES) * 100, 100)}%` }}
            />
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-3 text-sm text-red-400"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium mb-0.5">Upload Error</p>
              <p className="text-xs text-red-400/80">{error}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setError(null); }} className="rounded-full p-1 hover:bg-red-500/10 shrink-0">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
