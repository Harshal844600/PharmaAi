import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SUPPORTED_DRUGS } from "@/lib/pharmacogenomics";
import { Pill, Activity, Search, CheckSquare, Square, X } from "lucide-react";

interface DrugSelectorProps {
  selectedDrugs: string[];
  onSelect: (drugs: string[]) => void;
}

const drugLabels: Record<string, string> = {
  CODEINE: "Codeine",
  CLOPIDOGREL: "Clopidogrel",
  WARFARIN: "Warfarin",
  SIMVASTATIN: "Simvastatin",
  AZATHIOPRINE: "Azathioprine",
  FLUOROURACIL: "Fluorouracil",
};

const drugGeneLabel: Record<string, string> = {
  CODEINE: "CYP2D6",
  CLOPIDOGREL: "CYP2C19",
  WARFARIN: "CYP2C9",
  SIMVASTATIN: "SLCO1B1",
  AZATHIOPRINE: "TPMT",
  FLUOROURACIL: "DPYD",
};

const drugDescriptions: Record<string, string> = {
  CODEINE: "Pain reliever (opioid)",
  CLOPIDOGREL: "Antiplatelet agent",
  WARFARIN: "Blood thinner",
  SIMVASTATIN: "Cholesterol lowering",
  AZATHIOPRINE: "Immunosuppressant",
  FLUOROURACIL: "Chemotherapy agent",
};

export default function DrugSelector({ selectedDrugs, onSelect }: DrugSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDrugs = SUPPORTED_DRUGS.filter(d => {
    const query = searchQuery.toLowerCase();
    return (
      drugLabels[d.drug]?.toLowerCase().includes(query) ||
      d.drug.toLowerCase().includes(query) ||
      drugGeneLabel[d.drug]?.toLowerCase().includes(query) ||
      drugDescriptions[d.drug]?.toLowerCase().includes(query)
    );
  });

  const toggleDrug = (drug: string) => {
    if (selectedDrugs.includes(drug)) {
      onSelect(selectedDrugs.filter(d => d !== drug));
    } else {
      onSelect([...selectedDrugs, drug]);
    }
  };

  const selectAll = () => {
    onSelect(SUPPORTED_DRUGS.map(d => d.drug));
  };

  const clearAll = () => {
    onSelect([]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <div className="flex items-center justify-between mb-4">
        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Pill className="h-4 w-4" />
          Select Medications for Analysis
        </label>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {selectedDrugs.length > 0 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-xs font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded-full"
              >
                {selectedDrugs.length} selected
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={selectAll}
            className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-primary transition-colors font-bold"
          >
            All
          </button>
          <span className="text-zinc-700">|</span>
          <button
            onClick={clearAll}
            className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-red-400 transition-colors font-bold"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search drugs or genes..."
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/30 focus:bg-white/[0.05] focus:ring-1 focus:ring-red-500/15 transition-all duration-300"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-zinc-500" />
          </button>
        )}
      </div>

      {/* Drug Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {filteredDrugs.map((d) => {
          const isSelected = selectedDrugs.includes(d.drug);
          return (
            <motion.button
              key={d.drug}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleDrug(d.drug)}
              className={`group relative flex flex-col items-start gap-2 overflow-hidden rounded-xl border px-4 py-3.5 text-left transition-all duration-300 ${isSelected
                ? "border-red-500/40 bg-red-500/[0.08] shadow-lg ring-1 ring-red-500/30"
                : "border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.05]"
                }`}
              style={isSelected ? { boxShadow: '0 0 20px rgba(209, 26, 42, 0.1)' } : {}}
            >
              {/* Subtle gradient overlay when selected */}
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.06] to-transparent pointer-events-none" />
              )}

              <div className="relative z-10 flex w-full items-center justify-between">
                <span className={`text-sm font-semibold transition-colors ${isSelected ? "text-red-400" : "text-foreground group-hover:text-red-400/80"}`}>
                  {drugLabels[d.drug]}
                </span>
                {isSelected ? (
                  <CheckSquare className="h-4 w-4 text-red-500" />
                ) : (
                  <Square className="h-4 w-4 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                )}
              </div>

              <div className="relative z-10 flex items-center gap-1.5">
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono font-semibold transition-colors ${isSelected ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-white/[0.03] text-zinc-500 border border-white/[0.04]"
                  }`}>
                  {drugGeneLabel[d.drug]}
                </span>
              </div>

              <p className="relative z-10 text-[10px] text-zinc-600 leading-tight mt-0.5">{drugDescriptions[d.drug]}</p>
            </motion.button>
          );
        })}
      </div>

      {filteredDrugs.length === 0 && (
        <div className="text-center py-8 text-zinc-500 text-sm">
          No drugs matching "{searchQuery}"
        </div>
      )}

      {/* Validation message */}
      <AnimatePresence>
        {selectedDrugs.length === 0 && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-amber-500/80 mt-3 flex items-center gap-1.5"
          >
            <Activity className="h-3 w-3" />
            Select at least one drug to begin analysis
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
