import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Loader2, Sparkles, Download, Copy, Check, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";
import VcfUploader from "@/components/VcfUploader";
import DrugSelector from "@/components/DrugSelector";
import ResultsCard from "@/components/ResultsCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import AiAssistant from "@/components/AiAssistant";
import PharmaGuardLogo from "@/components/PharmaGuardLogo";
import JsonViewer from "@/components/JsonViewer";
import { AnalysisResult, normalizeBackendResponse } from "@/lib/analysis-engine";
import { parseVcfContent } from "@/lib/vcf-parser";
import { supabase } from "@/integrations/supabase/client";
import { saveAnalysisResult } from "@/lib/storage-service";
import { toast } from "sonner";

export default function Index() {
  const [vcfContent, setVcfContent] = useState<string | null>(null);
  const [vcfFile, setVcfFile] = useState<File | null>(null);
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>(["CODEINE"]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [activeResult, setActiveResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const onFileAccepted = useCallback((file: File, content: string) => {
    const parsed = parseVcfContent(content);
    if (!parsed.isValid) {
      toast.error(parsed.error || "Invalid VCF file");
      return;
    }
    setVcfFile(file);
    setVcfContent(content);
    setResults([]);
    setAnalysisError(null);
    toast.success(`Loaded ${parsed.totalLines} variant lines, ${parsed.pharmacogenomicVariants.length} pharmacogenomic variants detected`);
  }, []);

  /**
   * Call the Node.js backend at POST /api/analyze with multipart/form-data.
   * Sends the actual VCF file + comma-separated drug names.
   */
  const callBackendAnalysis = async (file: File, drugNames: string[]): Promise<AnalysisResult[]> => {
    try {
      const formData = new FormData();
      formData.append("vcf_file", file, file.name);
      formData.append("drug_name", drugNames.join(","));

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
        // Do NOT set Content-Type header — browser sets it with boundary automatically
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        if (response.status === 400) {
          throw new Error(errorData.message || "Bad request — check your file and drug selection.");
        } else if (response.status === 422) {
          throw new Error(errorData.message || "Failed to parse VCF file. Check the file format.");
        } else if (response.status === 413) {
          throw new Error(errorData.message || "File too large. Maximum size is 5MB.");
        }
        throw new Error(`Server Error (${response.status}): ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return normalizeBackendResponse(data);
    } catch (err: any) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        throw new Error("Cannot connect to the backend. Please ensure the backend is running (npm start in the backend/ folder).");
      }
      throw err;
    }
  };

  const runAnalysis = async () => {
    if (!vcfFile || !vcfContent) {
      toast.error("Please upload a VCF file first");
      return;
    }
    if (selectedDrugs.length === 0) {
      toast.error("Please select at least one drug for analysis");
      return;
    }

    setProcessing(true);
    setResults([]);
    setAnalysisError(null);

    try {
      // Upload VCF to Supabase storage (graceful — don't block analysis)
      try {
        const patientId = `PATIENT_${Date.now().toString(36).toUpperCase()}`;
        await supabase.from("patients").upsert({ patient_id: patientId }, { onConflict: "patient_id" });
        const filePath = `${patientId}/${vcfFile.name}`;
        await supabase.storage.from("vcf-files").upload(filePath, vcfFile);
        await supabase.from("vcf_uploads").insert({
          patient_id: patientId, file_name: vcfFile.name,
          file_path: filePath, file_size: vcfFile.size, upload_status: "completed",
        });
      } catch { /* Supabase optional */ }

      // Call Backend with selected drugs
      const allResults = await callBackendAnalysis(vcfFile, selectedDrugs);

      if (allResults.length === 0) {
        setAnalysisError("No analysis data was returned. Please check the backend logs.");
        setProcessing(false);
        return;
      }

      // Store results in Supabase (graceful)
      for (const result of allResults) {
        try { await saveAnalysisResult(result); } catch { /* Supabase optional */ }
      }

      setResults(allResults);
      setActiveResult(allResults[0] || null);
      toast.success(`Analyzed ${allResults.length} drug-gene interactions`);
    } catch (e: any) {
      console.error(e);
      setAnalysisError(e.message || "An unexpected error occurred during analysis.");
      toast.error(e.message || "Analysis failed");
    } finally {
      setProcessing(false);
    }
  };

  const runAllDrugs = async () => {
    if (!vcfFile || !vcfContent) {
      toast.error("Please upload a VCF file first");
      return;
    }

    setProcessing(true);
    setResults([]);
    setAnalysisError(null);

    try {
      // Upload VCF to Supabase (graceful)
      try {
        const patientId = `PATIENT_${Date.now().toString(36).toUpperCase()}`;
        const filePath = `${patientId}/${vcfFile.name}`;
        await supabase.storage.from("vcf-files").upload(filePath, vcfFile);
        await supabase.from("vcf_uploads").insert({
          patient_id: patientId, file_name: vcfFile.name,
          file_path: filePath, file_size: vcfFile.size, upload_status: "completed",
        });
      } catch { /* Supabase optional */ }

      // Send all 6 supported drugs
      const ALL_DRUGS = ["CODEINE", "WARFARIN", "CLOPIDOGREL", "SIMVASTATIN", "AZATHIOPRINE", "FLUOROURACIL"];
      const allResults = await callBackendAnalysis(vcfFile, ALL_DRUGS);

      for (const result of allResults) {
        try { await saveAnalysisResult(result); } catch { /* Supabase optional */ }
      }

      setResults(allResults);
      setActiveResult(allResults[0] || null);
      toast.success(`Analyzed ${allResults.length} drug-gene pairs`);
    } catch (e: any) {
      console.error(e);
      setAnalysisError(e.message || "An unexpected error occurred during analysis.");
      toast.error(e.message || "Analysis failed");
    } finally {
      setProcessing(false);
    }
  };

  // --- Export Utilities ---
  const downloadJson = () => {
    const json = JSON.stringify(results, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pharmacogenomic-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded as JSON");
  };

  const copyToClipboard = async () => {
    try {
      const json = JSON.stringify(results, null, 2);
      await navigator.clipboard.writeText(json);
      setCopied(true);
      toast.success("Results copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy. Please try the download option.");
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 relative">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-20 relative z-10">
        {/* Animated background effects */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-600/[0.07] rounded-full blur-[150px] -z-10 animate-pulse-slow" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-red-800/[0.05] rounded-full blur-[100px] -z-10 animate-breathe" />
        <div className="absolute top-60 right-1/4 w-[200px] h-[200px] bg-rose-900/[0.04] rounded-full blur-[80px] -z-10 animate-float" />

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-20 text-center relative"
        >
          {/* Hero Logo with orbital ring */}
          <div className="relative mx-auto mb-10 w-28 h-28">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-dashed border-red-500/20"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-3 rounded-full border border-dotted border-red-500/10"
            />
            <div className="relative flex h-full w-full items-center justify-center animate-float">
              <PharmaGuardLogo size={96} animated={true} />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-zinc-400">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Powered by CPIC Guidelines & Gemini AI
            </div>
          </motion.div>

          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl mb-6 leading-[1.1]">
            <span className="pg-gradient-text">Precision Medicine</span>
            <br />
            <span className="text-white/90">Risk Prediction</span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mx-auto mt-6 max-w-xl text-lg text-zinc-500 leading-relaxed font-light"
          >
            Upload your <span className="text-red-400/90 font-medium">VCF genomic data</span> to detect
            drug-gene interactions with clinical-grade accuracy.
          </motion.p>
        </motion.div>

        {/* Interaction Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-8 md:p-10 relative overflow-hidden animate-border-glow"
        >
          {/* Corner accent glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/[0.05] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-500/[0.03] rounded-full blur-3xl pointer-events-none" />

          <VcfUploader onFileAccepted={onFileAccepted} isProcessing={processing} />

          <AnimatePresence>
            {vcfContent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-8 pt-6 border-t border-white/[0.04]"
              >
                <DrugSelector selectedDrugs={selectedDrugs} onSelect={setSelectedDrugs} />

                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={runAnalysis}
                    disabled={processing || selectedDrugs.length === 0}
                    className="glass-button flex-1 h-12 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Analyze Selected ({selectedDrugs.length})
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={runAllDrugs}
                    disabled={processing}
                    className="glass-button-secondary h-12 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Shield className="h-4 w-4" />
                    Analyze All
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {analysisError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-8 p-5 rounded-xl border border-red-500/20 bg-red-950/20 backdrop-blur-sm"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-400 mb-1">Analysis Error</h4>
                  <p className="text-xs text-red-400/80 leading-relaxed">{analysisError}</p>
                  <p className="text-[10px] text-zinc-500 mt-2">If this persists, ensure the backend is running: cd backend && node server.js</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        <AnimatePresence>
          {processing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-16">
              <LoadingSkeleton />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {!processing && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-16 space-y-8"
            >
              {/* Section divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-3xl font-bold tracking-tight text-white">Analysis Results</h2>
                  <span className="text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 glow-red-sm">
                    {results.length} Predictions
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={downloadJson}
                    className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] px-3 py-2 rounded-lg border border-white/[0.06] hover:border-white/[0.1] transition-all"
                    title="Download JSON report"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] px-3 py-2 rounded-lg border border-white/[0.06] hover:border-white/[0.1] transition-all"
                    title="Copy results to clipboard"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </motion.button>
                </div>
              </div>

              <div className="grid gap-6">
                {results.map((r, i) => (
                  <motion.div
                    key={`${r.drug}-${i}`}
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 20 }}
                    onClick={() => setActiveResult(r)}
                    className="cursor-pointer group"
                  >
                    <ResultsCard result={r} index={i} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* JSON Code Section */}
        <AnimatePresence>
          {!processing && results.length > 0 && (
            <JsonViewer results={results} />
          )}
        </AnimatePresence>
      </main>

      <AiAssistant analysisResult={activeResult} />
    </div>
  );
}
