import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AnalysisResult } from "@/lib/analysis-engine";
import { supabase } from "@/integrations/supabase/client";

interface AiAssistantProps {
  analysisResult: AnalysisResult | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiAssistant({ analysisResult }: AiAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context: analysisResult
            ? {
              patient_id: analysisResult.patient_id,
              drug: analysisResult.drug,
              risk_label: analysisResult.risk_assessment.risk_label,
              gene: analysisResult.pharmacogenomic_profile.primary_gene,
              diplotype: analysisResult.pharmacogenomic_profile.diplotype,
              phenotype: analysisResult.pharmacogenomic_profile.phenotype,
              detected_variants: analysisResult.pharmacogenomic_profile.detected_variants,
              suggestion: analysisResult.clinical_recommendation.suggestion || analysisResult.clinical_recommendation.recommendation,
              mechanism: analysisResult.llm_generated_explanation.mechanism,
            }
            : null,
        }),
      });

      if (!response.ok) throw new Error("Backend chat failed");
      const data = await response.json();
      const reply = data.reply;

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      if (analysisResult) {
        supabase.from("assistant_conversations").insert([
          { patient_id: analysisResult.patient_id, role: "user", content: userMsg.content },
          { patient_id: analysisResult.patient_id, role: "assistant", content: reply },
        ]).then(({ error }) => { if (error) console.error("History save error", error); });
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toggle button - Glowing Red Pulse */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className={`fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#D11A2A] shadow-[0_0_30px_rgba(209,26,42,0.6)] hover:shadow-[0_0_50px_rgba(209,26,42,0.8)] transition-all border border-white/20 ${open ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
      >
        <MessageCircle className="h-7 w-7 text-white" />
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-white rounded-full animate-pulse shadow-lg" />
      </motion.button>

      {/* Panel - Dark Glass */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/5 bg-[#050505]/95 backdrop-blur-3xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-5 bg-[#0A0A0A]">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-[#8a1c26] shadow-lg shadow-red-900/20 ring-1 ring-white/10">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">PharmaGuard AI</h3>
                  <p className="text-xs text-zinc-400 font-medium">Genomic Intelligence Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-6 text-center opacity-80">
                  <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center animate-pulse-slow">
                    <Sparkles className="h-8 w-8 text-red-500" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-white">How can I help?</p>
                    <p className="text-sm text-zinc-500 max-w-[250px] mx-auto mt-2">I analyze risks based on your VCF data and CPIC guidelines.</p>
                  </div>
                  <div className="mt-4 grid gap-2 w-full max-w-sm">
                    {["Analyze the risk for Warfarin", "Explain CYP2C19 phenotype", "Dietary restrictions?"].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); }}
                        className="w-full rounded-xl bg-white/5 border border-white/5 px-4 py-3 text-sm text-zinc-300 hover:bg-white/10 hover:border-red-500/30 hover:text-white transition-all text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Icon */}
                  <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${msg.role === "assistant"
                    ? "bg-[#0A0A0A] border-red-500/20 text-red-500"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400"
                    }`}>
                    {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm shadow-sm ${msg.role === "user"
                    ? "bg-zinc-800 text-white rounded-tr-sm"
                    : "bg-black border-l-2 border-red-600 pl-4 py-2 text-zinc-300 rounded-tl-sm"
                    }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none leading-relaxed">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-center gap-3 text-sm text-zinc-500 pl-2">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" />
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce delay-75" />
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce delay-150" />
                  <span className="ml-2 text-xs uppercase tracking-widest font-medium">Processing</span>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Disclaimer */}
            <div className="px-6 py-2 border-t border-white/5 bg-[#020202]">
              <p className="text-[10px] text-zinc-600 text-center flex items-center justify-center gap-1.5">
                <span className="text-red-900">⚕️</span> AI generated. Consult a physician for medical decisions.
              </p>
            </div>

            {/* Input */}
            <div className="p-4 bg-[#050505]">
              <div className="relative flex items-center gap-2 rounded-2xl bg-[#0F0F0F] border border-white/10 px-2 py-2 focus-within:border-red-500/50 focus-within:ring-1 focus-within:ring-red-500/20 transition-all">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask a follow-up question..."
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none min-w-0"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-900/20 hover:bg-red-500 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
