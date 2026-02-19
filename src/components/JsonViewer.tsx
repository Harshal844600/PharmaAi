import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Code2, Copy, Check, ChevronDown, ChevronUp, Download, Braces } from "lucide-react";
import { AnalysisResult } from "@/lib/analysis-engine";

interface JsonViewerProps {
    results: AnalysisResult[];
}

// Syntax highlighter for JSON
function highlightJson(json: string): string {
    return json
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        // Keys
        .replace(/"([^"]+)"(?=\s*:)/g, '<span class="json-key">"$1"</span>')
        // String values
        .replace(/:\s*"([^"]*?)"/g, ': <span class="json-string">"$1"</span>')
        // Numbers
        .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
        // Booleans & null
        .replace(/:\s*(true|false|null)/g, ': <span class="json-bool">$1</span>');
}

export default function JsonViewer({ results }: JsonViewerProps) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"pretty" | "raw">("pretty");
    const codeRef = useRef<HTMLPreElement>(null);

    const jsonString = JSON.stringify(results, null, 2);
    const rawString = JSON.stringify(results);

    // Line count
    const lineCount = jsonString.split("\n").length;

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(jsonString);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
        }
    };

    const downloadJson = () => {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pharmaguard-analysis-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (results.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10"
        >
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/20">
                    <Braces className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">JSON Response</h3>
                    <p className="text-[11px] text-zinc-500">{lineCount} lines • {results.length} results • {(new TextEncoder().encode(jsonString).length / 1024).toFixed(1)} KB</p>
                </div>
            </div>

            {/* Code Container */}
            <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-[#0A0A0A]/90 backdrop-blur-xl">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] bg-[#0D0D0D]">
                    <div className="flex items-center gap-1">
                        {/* macOS window dots */}
                        <div className="flex items-center gap-1.5 mr-4">
                            <div className="h-3 w-3 rounded-full bg-red-500/80 border border-red-500/50" />
                            <div className="h-3 w-3 rounded-full bg-amber-500/80 border border-amber-500/50" />
                            <div className="h-3 w-3 rounded-full bg-emerald-500/80 border border-emerald-500/50" />
                        </div>

                        {/* Tabs */}
                        <button
                            onClick={() => setActiveTab("pretty")}
                            className={`text-[11px] font-medium px-3 py-1 rounded-md transition-all ${activeTab === "pretty"
                                ? "text-white bg-white/[0.06] border border-white/[0.08]"
                                : "text-zinc-500 hover:text-zinc-400"
                                }`}
                        >
                            Pretty
                        </button>
                        <button
                            onClick={() => setActiveTab("raw")}
                            className={`text-[11px] font-medium px-3 py-1 rounded-md transition-all ${activeTab === "raw"
                                ? "text-white bg-white/[0.06] border border-white/[0.08]"
                                : "text-zinc-500 hover:text-zinc-400"
                                }`}
                        >
                            Raw
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={copyToClipboard}
                            className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-white/[0.05] transition-all"
                        >
                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied ? "Copied!" : "Copy"}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={downloadJson}
                            className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-white/[0.05] transition-all"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Save
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-white/[0.05] transition-all"
                        >
                            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            {expanded ? "Collapse" : "Expand"}
                        </motion.button>
                    </div>
                </div>

                {/* Code Content */}
                <div className={`relative overflow-hidden transition-all duration-500 ${expanded ? "max-h-[800px]" : "max-h-[280px]"}`}>
                    <div className="overflow-auto max-h-[800px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <div className="flex">
                            {/* Line numbers */}
                            {activeTab === "pretty" && (
                                <div className="select-none py-4 pl-4 pr-2 text-right border-r border-white/[0.04] bg-[#080808]">
                                    {jsonString.split("\n").slice(0, expanded ? undefined : 15).map((_, i) => (
                                        <div key={i} className="text-[11px] leading-[1.7] font-mono text-zinc-700">{i + 1}</div>
                                    ))}
                                </div>
                            )}

                            {/* Code */}
                            <pre
                                ref={codeRef}
                                className="flex-1 p-4 text-[12px] leading-[1.7] font-mono overflow-x-auto"
                            >
                                {activeTab === "pretty" ? (
                                    <code
                                        dangerouslySetInnerHTML={{
                                            __html: highlightJson(
                                                expanded
                                                    ? jsonString
                                                    : jsonString.split("\n").slice(0, 15).join("\n") + "\n  ..."
                                            )
                                        }}
                                    />
                                ) : (
                                    <code className="text-zinc-400 break-all whitespace-pre-wrap">{rawString}</code>
                                )}
                            </pre>
                        </div>
                    </div>

                    {/* Fade-out gradient when collapsed */}
                    {!expanded && (
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />
                    )}
                </div>

                {/* Footer info bar */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.04] bg-[#080808]">
                    <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                        <span className="flex items-center gap-1">
                            <Code2 className="h-3 w-3" />
                            application/json
                        </span>
                        <span>•</span>
                        <span>UTF-8</span>
                        <span>•</span>
                        <span>{lineCount} lines</span>
                    </div>
                    <div className="text-[10px] text-zinc-700 font-mono">
                        PharmaGuard API v2.0
                    </div>
                </div>
            </div>

            {/* JSON Syntax Highlighting Styles */}
            <style>{`
        .json-key { color: #c084fc; }
        .json-string { color: #86efac; }
        .json-number { color: #fbbf24; }
        .json-bool { color: #60a5fa; }
      `}</style>
        </motion.div>
    );
}
