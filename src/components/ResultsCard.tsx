import { AnalysisResult, getRecommendationText } from "@/lib/analysis-engine";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertCircle, AlertTriangle, CheckCircle, Info, Activity, Dna, FileText, BrainCircuit, ShieldAlert, ShieldX, ShieldCheck, HelpCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import RiskGraph from "./RiskGraph";

interface ResultsCardProps {
  result: AnalysisResult;
  index: number;
}

// Map backend risk labels to display properties
function getRiskDisplay(label: string) {
  const normalized = label.toUpperCase().replace(/\s+/g, "_");
  switch (normalized) {
    case "TOXIC":
      return {
        icon: <ShieldAlert className="h-4 w-4" />,
        badgeClass: "risk-danger shadow-red-900/40",
        borderClass: "border-l-red-600 shadow-red-900/10",
        barClass: "bg-red-600 shadow-red-500/50",
        bgClass: "bg-red-950/20 border-red-500/20",
        iconBgClass: "bg-red-500/20 text-red-500",
        displayLabel: "Toxic",
      };
    case "INEFFECTIVE":
      return {
        icon: <ShieldX className="h-4 w-4" />,
        badgeClass: "risk-warning shadow-amber-900/40",
        borderClass: "border-l-amber-500 shadow-amber-900/10",
        barClass: "bg-amber-500 shadow-amber-500/50",
        bgClass: "bg-amber-950/20 border-amber-500/20",
        iconBgClass: "bg-amber-500/20 text-amber-500",
        displayLabel: "Ineffective",
      };
    case "ADJUST_DOSAGE":
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        badgeClass: "risk-warning shadow-amber-900/40",
        borderClass: "border-l-yellow-500 shadow-yellow-900/10",
        barClass: "bg-yellow-500 shadow-yellow-500/50",
        bgClass: "bg-yellow-950/20 border-yellow-500/20",
        iconBgClass: "bg-yellow-500/20 text-yellow-500",
        displayLabel: "Adjust Dosage",
      };
    case "SAFE":
      return {
        icon: <ShieldCheck className="h-4 w-4" />,
        badgeClass: "risk-safe shadow-emerald-900/40",
        borderClass: "border-l-emerald-500 shadow-emerald-900/10",
        barClass: "bg-emerald-500 shadow-emerald-500/50",
        bgClass: "bg-emerald-950/20 border-emerald-500/20",
        iconBgClass: "bg-emerald-500/20 text-emerald-500",
        displayLabel: "Safe",
      };
    case "UNKNOWN":
    default:
      return {
        icon: <HelpCircle className="h-4 w-4" />,
        badgeClass: "risk-info",
        borderClass: "border-l-blue-500 shadow-blue-900/10",
        barClass: "bg-blue-500 shadow-blue-500/50",
        bgClass: "bg-blue-950/20 border-blue-500/20",
        iconBgClass: "bg-blue-500/20 text-blue-500",
        displayLabel: label || "Unknown",
      };
  }
}

export default function ResultsCard({ result, index }: ResultsCardProps) {
  const { drug, risk_assessment, pharmacogenomic_profile, clinical_recommendation, llm_generated_explanation } = result;

  const riskDisplay = getRiskDisplay(risk_assessment.risk_label);

  // Compute a safety score based on risk label (not raw confidence_score which is data quality)
  const safetyScores: Record<string, number> = {
    'Safe': 95,
    'Adjust Dosage': 60,
    'Ineffective': 30,
    'Toxic': 15,
    'Unknown': 50,
  };
  const safetyPercent = safetyScores[risk_assessment.risk_label] ?? 50;

  // Color the bar based on safety level
  const safetyBarClass = safetyPercent >= 80
    ? 'bg-emerald-500 shadow-emerald-500/50'
    : safetyPercent >= 50
      ? 'bg-amber-500 shadow-amber-500/50'
      : 'bg-red-500 shadow-red-500/50';

  return (
    <Card className={`glass-card overflow-hidden border-l-4 transition-all duration-500 hover:shadow-2xl hover:scale-[1.01] ${riskDisplay.borderClass}`}>
      <CardHeader className="pb-6 pt-6 px-8">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-3xl font-bold tracking-tight text-white mb-2">{drug}</CardTitle>
            <CardDescription className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                <Dna className="h-3 w-3 text-red-500" />
                {pharmacogenomic_profile.primary_gene}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400 font-medium">{pharmacogenomic_profile.phenotype}</span>
            </CardDescription>
          </div>
          <Badge variant="outline" className={`flex gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-xl border ${riskDisplay.badgeClass}`}>
            {riskDisplay.icon}
            {riskDisplay.displayLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 px-8 pb-8">
        {/* Safety Confidence Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Safety Confidence</span>
            <span className="text-white">{safetyPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#151515] border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)] ${safetyBarClass}`}
              style={{ width: `${safetyPercent}%` }}
            />
          </div>
        </div>

        {/* Core Recommendation */}
        <div className={`p-5 rounded-xl border backdrop-blur-md ${riskDisplay.bgClass}`}>
          <div className="flex gap-4">
            <div className={`mt-1 p-2 rounded-full ${riskDisplay.iconBgClass}`}>
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-base mb-1">Clinical Recommendation</h4>
              <p className="text-sm leading-relaxed text-zinc-300">
                {getRecommendationText(result)}
              </p>
              {clinical_recommendation.alternative_drugs && clinical_recommendation.alternative_drugs.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider self-center">Alternatives:</span>
                  {clinical_recommendation.alternative_drugs.map((alt, i) => (
                    <span key={i} className="text-xs bg-white/5 text-zinc-300 px-2 py-0.5 rounded-full border border-white/5">{alt}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Risk Graph */}
        {result.risk_scores && (
          <RiskGraph before={result.risk_scores.before} after={result.risk_scores.after} drug={drug} />
        )}

        <Accordion type="single" collapsible className="w-full border-t border-white/5 pt-4">
          {/* Genetic Details */}
          <AccordionItem value="genetics" className="border-b border-white/5 last:border-0">
            <AccordionTrigger className="hover:no-underline py-4 text-zinc-400 hover:text-white transition-colors">
              <div className="flex items-center gap-3 text-sm font-medium">
                <Dna className="h-4 w-4 text-red-500" />
                Genetic Profile Details
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-[#050505]/50 p-5 mt-2 border border-white/5 text-sm sm:grid-cols-3">
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Genotype</p>
                  <p className="font-mono font-medium text-white bg-white/5 inline-block px-2 py-0.5 rounded border border-white/5">{pharmacogenomic_profile.diplotype}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Phenotype</p>
                  <p className="font-medium text-white">{pharmacogenomic_profile.phenotype}</p>
                </div>
                {clinical_recommendation.cpic_alignment !== undefined && (
                  <div className="space-y-1.5 sm:col-span-1 col-span-2">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">CPIC Alignment</p>
                    <p className="font-medium text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="h-3 w-3" />
                      {String(clinical_recommendation.cpic_alignment)}
                    </p>
                  </div>
                )}
                {pharmacogenomic_profile.detected_variants && pharmacogenomic_profile.detected_variants.length > 0 && (
                  <div className="col-span-full space-y-1.5 pt-2 border-t border-white/5">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Detected Variants</p>
                    <div className="flex flex-wrap gap-2">
                      {pharmacogenomic_profile.detected_variants.map((v, i) => (
                        <span key={i} className="font-mono text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">
                          {v.rsid}{v.star_allele ? ` (${v.star_allele})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* AI Explanation */}
          <AccordionItem value="explanation" className="border-b-0 border-white/5">
            <AccordionTrigger className="hover:no-underline py-4 text-zinc-400 hover:text-white transition-colors">
              <div className="flex items-center gap-3 text-sm font-medium">
                <BrainCircuit className="h-4 w-4 text-red-500" />
                AI Analysis & Mechanism
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="rounded-xl bg-[#050505]/50 p-6 mt-2 border border-white/5 space-y-6">

                <div className="space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <FileText className="h-3 w-3" /> Mechanism
                  </h5>
                  <div className="prose prose-sm prose-invert max-w-none text-zinc-300 leading-relaxed">
                    <ReactMarkdown>{llm_generated_explanation.mechanism}</ReactMarkdown>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
                    {llm_generated_explanation.clinical_impact ? 'Clinical Impact' : 'Clinical Summary'}
                  </h5>
                  <p className="text-sm text-zinc-400 bg-white/5 p-3 rounded-lg border border-white/5 italic border-l-2 border-l-red-500">
                    "{llm_generated_explanation.clinical_impact || llm_generated_explanation.summary}"
                  </p>
                </div>

                {llm_generated_explanation.lifestyle_tips && llm_generated_explanation.lifestyle_tips.length > 0 && (
                  <div className="pt-4 border-t border-white/5">
                    <h5 className="text-xs font-bold uppercase tracking-widest text-emerald-500/80 mb-3 flex items-center gap-2">
                      <Activity className="h-3 w-3" /> Lifestyle & Diet
                    </h5>
                    <ul className="grid gap-2">
                      {llm_generated_explanation.lifestyle_tips.map((tip, i) => (
                        <li key={i} className="text-sm text-zinc-300 flex items-start gap-3 bg-emerald-900/10 p-3 rounded-lg border border-emerald-500/10 hover:border-emerald-500/20 transition-colors">
                          <span className="mt-1.5 block h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex items-center justify-between border-t border-white/5 pt-6 text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
          <div className="flex items-center gap-4">
            <span>Source: {result.quality_metrics?.source || "CPIC API"}</span>
            {!result.quality_metrics?.gene_covered && (
              <span className="text-amber-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Low Coverage
              </span>
            )}
          </div>
          <div>
            Analyzed: {new Date(result.timestamp).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
