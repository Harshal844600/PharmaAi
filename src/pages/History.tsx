import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, ChevronRight, Dna } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import ResultsCard from "@/components/ResultsCard";
import { AnalysisResult } from "@/lib/analysis-engine";

interface HistoryEntry {
  patient_id: string;
  drug: string;
  risk_label: string;
  created_at: string;
  full_result: AnalysisResult;
}

export default function History() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("drug_analyses")
        .select("patient_id, drug, risk_label, created_at, full_result")
        .order("created_at", { ascending: false })
        .limit(50);
      setEntries((data as any[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">Analysis History</h1>
          <p className="mt-2 text-muted-foreground">Past pharmacogenomic analyses stored in your database.</p>
        </motion.div>

        {selectedEntry ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
            <button onClick={() => setSelectedEntry(null)} className="mb-4 text-sm text-accent hover:underline">← Back to history</button>
            <ResultsCard result={selectedEntry.full_result} />
          </motion.div>
        ) : (
          <div className="mt-8 space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card h-16 animate-pulse" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Dna className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No analyses yet. Upload a VCF file to get started.</p>
              </div>
            ) : (
              entries.map((entry, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedEntry(entry)}
                  className="glass-card flex w-full items-center justify-between px-5 py-4 text-left transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{entry.drug} — {entry.patient_id}</p>
                      <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                      entry.risk_label === "Safe" ? "risk-safe" : entry.risk_label === "Toxic" ? "risk-danger" : "risk-warning"
                    }`}>{entry.risk_label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </motion.button>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
