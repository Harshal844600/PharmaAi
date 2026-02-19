/**
 * config/drugConfig.js
 *
 * Central configuration for all supported drugs.
 * Each entry defines:
 *   primaryGene  — the pharmacogene responsible for metabolizing this drug
 *   type         — how the gene affects the drug:
 *                    "prodrug"     = gene must activate the drug
 *                    "detox"       = gene must clear/inactivate the drug
 *                    "transporter" = gene controls hepatic uptake/efflux
 *   description  — human-readable drug-gene relationship
 *   recommendation — clinical action per risk label (CPIC-aligned)
 */

const DRUG_CONFIG = {
  CODEINE: {
    primaryGene: 'CYP2D6',
    type: 'prodrug',
    description: 'Codeine is a prodrug converted to morphine by CYP2D6.',
    recommendations: {
      Safe: 'Standard codeine dosing is acceptable. Monitor for efficacy and side effects.',
      'Adjust Dosage': 'Consider dose reduction. Reduced CYP2D6 activity may lower morphine conversion.',
      Ineffective: 'Codeine is likely ineffective. Select an alternative opioid (e.g., morphine, oxycodone).',
      Toxic: 'Avoid codeine. Ultra-rapid CYP2D6 metabolism causes excessive morphine — risk of respiratory depression.',
      Unknown: 'No pharmacogenomic guidance available. Follow standard prescribing protocols.',
    },
  },

  WARFARIN: {
    primaryGene: 'CYP2C9',
    type: 'detox',
    description: 'Warfarin is metabolized and cleared by CYP2C9.',
    recommendations: {
      Safe: 'Standard warfarin dosing per INR-guided protocol is appropriate.',
      'Adjust Dosage': 'Reduce warfarin starting dose. Reduced CYP2C9 activity increases bleeding risk.',
      Ineffective: 'Not applicable for detox drugs.',
      Toxic: 'Avoid standard warfarin doses. CYP2C9 loss-of-function causes drug accumulation and hemorrhage risk.',
      Unknown: 'No pharmacogenomic guidance available. Follow standard INR monitoring.',
    },
  },

  CLOPIDOGREL: {
    primaryGene: 'CYP2C19',
    type: 'prodrug',
    description: 'Clopidogrel is a prodrug activated by CYP2C19 to its active thiol metabolite.',
    recommendations: {
      Safe: 'Standard clopidogrel dosing is appropriate.',
      'Adjust Dosage': 'Consider alternative antiplatelet agent. Reduced activation may lower efficacy.',
      Ineffective: 'Clopidogrel is likely ineffective. Use alternative therapy (e.g., prasugrel, ticagrelor).',
      Toxic: 'Elevated active metabolite risk. Monitor for increased bleeding. Consider dose reduction.',
      Unknown: 'No pharmacogenomic guidance available.',
    },
  },

  SIMVASTATIN: {
    primaryGene: 'SLCO1B1',
    type: 'transporter',
    description: 'SLCO1B1 encodes OATP1B1, which transports simvastatin into the liver for clearance.',
    recommendations: {
      Safe: 'Standard simvastatin dosing is acceptable.',
      'Adjust Dosage': 'Not applicable for transporter type.',
      Ineffective: 'Not applicable for transporter type.',
      Toxic: 'Reduced SLCO1B1 function impairs hepatic uptake, increasing simvastatin plasma levels and myopathy risk. Consider a lower dose or switch to pravastatin/rosuvastatin.',
      Unknown: 'No pharmacogenomic guidance available.',
    },
  },

  AZATHIOPRINE: {
    primaryGene: 'TPMT',
    type: 'detox',
    description: 'TPMT metabolizes azathioprine thiopurine metabolites; low activity causes toxic accumulation.',
    recommendations: {
      Safe: 'Standard azathioprine dosing is appropriate with routine monitoring.',
      'Adjust Dosage': 'Consider dose reduction (30–70% of standard). Monitor CBC for myelosuppression.',
      Ineffective: 'Not applicable for detox drugs.',
      Toxic: 'Avoid azathioprine or use only with significantly reduced doses under specialist supervision. TPMT deficiency causes life-threatening myelosuppression.',
      Unknown: 'No pharmacogenomic guidance available.',
    },
  },

  FLUOROURACIL: {
    primaryGene: 'DPYD',
    type: 'detox',
    description: 'DPYD degrades 5-fluorouracil; deficiency causes severe systemic toxicity.',
    recommendations: {
      Safe: 'Standard fluorouracil dosing is acceptable. Monitor for toxicity.',
      'Adjust Dosage': 'Reduce starting dose by 25–50%. DPYD partial deficiency increases toxicity risk.',
      Ineffective: 'Not applicable for detox drugs.',
      Toxic: 'Avoid fluorouracil. DPYD deficiency causes life-threatening mucositis, neutropenia, and neurotoxicity.',
      Unknown: 'No pharmacogenomic guidance available.',
    },
  },
};

/** List of supported drug names for validation */
const SUPPORTED_DRUGS = Object.keys(DRUG_CONFIG);

module.exports = { DRUG_CONFIG, SUPPORTED_DRUGS };
