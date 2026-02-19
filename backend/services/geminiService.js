/**
 * services/geminiService.js
 *
 * Generates clinically-grounded pharmacogenomic explanations using Groq LLM.
 *
 * CRITICAL DESIGN RULE:
 *   The LLM does NOT perform risk calculations.
 *   Risk is determined by riskEngine.js (deterministic rules).
 *   The LLM is used ONLY to produce human-readable explanations for pre-computed findings.
 *
 * Returns strict JSON:
 *   { "summary": "...", "mechanism": "...", "clinical_impact": "..." }
 */

const Groq = require('groq-sdk');

// Lazy-initialized Groq client
let groqClient = null;

/**
 * Initialize and cache the Groq client instance.
 * Returns null if GROQ_API_KEY is not set.
 */
function getGroqClient() {
  if (groqClient) return groqClient;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('[LLM] No GROQ_API_KEY set — AI explanations disabled.');
    return null;
  }

  try {
    groqClient = new Groq({ apiKey });
    console.log('[LLM] Groq client initialized (llama-3.3-70b-versatile)');
    return groqClient;
  } catch (err) {
    console.error('[LLM] Failed to initialize Groq:', err.message);
    return null;
  }
}

/**
 * Build the structured prompt.
 */
function buildPrompt({ drug, gene, diplotype, phenotype, riskLabel, detectedVariants }) {
  const rsidList = (detectedVariants || []).map((v) => v.rsid).join(', ') || 'none detected';

  return `You are a pharmacogenomics assistant explaining genetic drug risk in simple, easy-to-understand language.

IMPORTANT:
The risk has ALREADY been calculated. 
Do NOT change or question the risk label.
Your job is only to explain it clearly.

Pre-computed findings:
- Drug: ${drug}
- Gene involved: ${gene}
- Patient Diplotype: ${diplotype}
- Metabolizer Type: ${phenotype}
- Risk Label: ${riskLabel}
- Detected Variant rsIDs: ${rsidList}

Instructions:
1. Return ONLY a valid JSON object — no markdown, no code fences, no extra text.
2. Use simple language. Avoid complex medical terms.
3. If a medical term must be used, explain it briefly.
4. Do NOT fabricate claims.
5. If scientific evidence is limited, clearly mention uncertainty.
6. Keep tone informative and reassuring — not alarming.

Required JSON schema:
{
  "summary": "2–3 sentences explaining in simple terms what this result means for the patient.",
  "mechanism": "2–3 sentences explaining in easy language how this gene affects how the body handles the drug.",
  "clinical_impact": "2–3 sentences explaining what this means for dosing or treatment decisions."
}`;
}


/**
 * Rule-based fallback explanation — used when LLM is unavailable or fails.
 */
function generateFallbackExplanation({ drug, gene, diplotype, phenotype, riskLabel }) {
  const drugName = drug.charAt(0) + drug.slice(1).toLowerCase();

  const summaries = {
    Safe: `This patient's ${gene} diplotype (${diplotype}) confers a ${phenotype} phenotype, indicating standard ${drugName} metabolism. No pharmacogenomic dose adjustment is required.`,
    'Adjust Dosage': `The ${gene} ${diplotype} diplotype results in a ${phenotype} phenotype with reduced enzymatic activity. ${drugName} dosing may need adjustment to prevent suboptimal plasma levels.`,
    Toxic: `The patient's ${gene} ${diplotype} diplotype yields a ${phenotype} phenotype that substantially impairs ${drugName} clearance or over-produces its active metabolite, posing a high toxicity risk.`,
    Ineffective: `With ${gene} diplotype ${diplotype} and a ${phenotype} phenotype, the patient lacks sufficient enzymatic capacity to activate ${drugName} (a prodrug). The drug is unlikely to provide therapeutic benefit.`,
    Unknown: `Pharmacogenomic guidance is unavailable for ${drugName}. Standard clinical protocols should be followed.`,
  };

  const mechanisms = {
    Safe: `${gene} encodes a key phase-I drug-metabolizing enzyme. A normal diplotype preserves full enzymatic activity, ensuring ${drugName} is processed at expected rates without accumulation or under-conversion.`,
    'Adjust Dosage': `Reduced-function alleles in ${gene} lower enzyme expression or catalytic efficiency. This impairs normal ${drugName} processing, leading to altered plasma pharmacokinetics compared to normal metabolizers.`,
    Toxic: `Non-functional alleles in ${gene} abolish or critically reduce enzymatic capacity. Depending on drug type, this results in either accumulation of the parent drug or excessive production of an active and potentially harmful metabolite.`,
    Ineffective: `${gene} is required to bioactivate ${drugName} from its prodrug form. Loss-of-function variants prevent this metabolic step, meaning the active moiety is never adequately formed at the target site.`,
    Unknown: `The drug-gene interaction for ${drugName} has not been fully characterized in available pharmacogenomic evidence bases, or no relevant variants were detected in the uploaded VCF file.`,
  };

  const impacts = {
    Safe: `Standard dosing per the FDA label is appropriate. Routine therapeutic drug monitoring is recommended per institutional protocol. No CPIC-based dose modification is indicated for this phenotype.`,
    'Adjust Dosage': `CPIC guidelines recommend a dose reduction or extended dosing interval. Therapeutic drug monitoring is advised to individualize therapy. Clinical pharmacist consultation is recommended.`,
    Toxic: `CPIC strongly recommends avoiding this drug or using the minimum effective dose with intensive monitoring. A pharmacogenomically-appropriate alternative therapy should be selected in consultation with a clinical pharmacist or geneticist.`,
    Ineffective: `Select an alternative medication with a different metabolic pathway. CPIC guidelines do not recommend this prodrug in patients with a PM phenotype. Review alternative agents with the prescribing team.`,
    Unknown: `Manual clinical review is required. Comprehensive pharmacogenomic panel testing may be warranted if clinically indicated. Adhere to standard evidence-based prescribing guidelines in the absence of PGx data.`,
  };

  return {
    summary: summaries[riskLabel] ?? summaries['Unknown'],
    mechanism: mechanisms[riskLabel] ?? mechanisms['Unknown'],
    clinical_impact: impacts[riskLabel] ?? impacts['Unknown'],
  };
}

/**
 * Main entry point: generate an LLM-based explanation for a pharmacogenomic finding.
 * Falls back to rule-based templates gracefully on any error or missing API key.
 */
async function generateExplanation(params) {
  const client = getGroqClient();

  if (!client) {
    console.warn('[LLM] No API key or client init failed — using rule-based fallback.');
    return generateFallbackExplanation(params);
  }

  try {
    const prompt = buildPrompt(params);

    const chatCompletion = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a pharmacogenomics expert. Return ONLY valid JSON, no markdown, no code fences.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 700,
      response_format: { type: 'json_object' },
    });

    const rawText = chatCompletion.choices?.[0]?.message?.content;

    if (!rawText) throw new Error('Groq returned an empty response.');

    // Strip any accidental markdown code fences before parsing
    const cleanText = rawText.replace(/```json|```/gi, '').trim();
    const parsed = JSON.parse(cleanText);

    // Validate all required fields are present and non-empty
    if (!parsed.summary || !parsed.mechanism || !parsed.clinical_impact) {
      throw new Error('LLM JSON response is missing required fields.');
    }

    return {
      summary: parsed.summary,
      mechanism: parsed.mechanism,
      clinical_impact: parsed.clinical_impact,
    };
  } catch (err) {
    console.error(`[LLM] API call failed: ${err.message}`);
    console.error('[LLM] Falling back to rule-based templates.');
    return generateFallbackExplanation(params);
  }
}

module.exports = { generateExplanation };
