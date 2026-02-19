/**
 * models/Analysis.js
 *
 * Mongoose schema for storing pharmacogenomic analysis results in MongoDB.
 * Each document represents one drug analysis for one patient VCF upload.
 */

const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema(
  {
    // Unique patient identifier (UUID-based)
    patient_id: {
      type: String,
      required: true,
      index: true,
    },

    // Drug analyzed (uppercase)
    drug: {
      type: String,
      required: true,
      uppercase: true,
      enum: ['CODEINE', 'WARFARIN', 'CLOPIDOGREL', 'SIMVASTATIN', 'AZATHIOPRINE', 'FLUOROURACIL', 'UNKNOWN'],
    },

    // Primary pharmacogene for this drug
    gene: {
      type: String,
      required: true,
    },

    // Star-allele diplotype (e.g., "*4/*1")
    diplotype: {
      type: String,
      default: 'Unknown',
    },

    // Metabolizer phenotype
    phenotype: {
      type: String,
      enum: ['PM', 'IM', 'NM', 'RM', 'URM', 'Unknown'],
      default: 'Unknown',
    },

    // Risk label from deterministic engine
    risk: {
      type: String,
      enum: ['Safe', 'Adjust Dosage', 'Ineffective', 'Toxic', 'Unknown'],
      required: true,
    },

    // Severity string
    severity: {
      type: String,
      enum: ['none', 'low', 'moderate', 'high', 'critical'],
      required: true,
    },

    // Confidence score (0.0 – 1.0)
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },

    // Full structured response (stored for audit/replay)
    full_response: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: { createdAt: 'timestamp', updatedAt: 'updatedAt' },
  }
);

module.exports = mongoose.model('Analysis', AnalysisSchema);
