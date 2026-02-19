# 💊 PharmaGuard — Pharmacogenomic Risk Prediction System

> **RIFT 2026 Hackathon** | HealthTech Track — Precision Medicine Algorithm (PS 2)
>
> AI-powered pharmacogenomic risk prediction API backed by Google Gemini, MongoDB, and deterministic CPIC-aligned rules.

---

## 🔗 Submission Links

| Item | Link |
|---|---|
| **Live Demo** | _[Add your deployed URL here]_ |
| **LinkedIn Video** | _[Add your LinkedIn video URL here]_ |
| **GitHub Repo** | _[Add your GitHub URL here]_ |

---

## 🧬 Architecture Overview

```
Client (multipart/form-data)
     │  vcf_file + drug_name
     ▼
POST /api/analyze
     │
     ├─▶ uploadMiddleware.js    (Multer: .vcf only, 5MB max, memory storage)
     ├─▶ Input Validation       (file present, drug_name non-empty)
     │
     ├─▶ vcfParser.js           (Parse VCF → geneMap per gene)
     │     Extract: rsID, GENE, STAR allele, GT genotype
     │     Filter: CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD
     │
     ├─▶ phenotypeEngine.js     (Diplotype → Activity Score → Phenotype)
     │     PM / IM / NM / RM / URM
     │
     ├─▶ riskEngine.js          (Deterministic risk prediction — NO LLM)
     │     prodrug / detox / transporter logic
     │     → Safe / Adjust Dosage / Ineffective / Toxic / Unknown
     │
     ├─▶ geminiService.js       (LLM explanation ONLY — not risk logic)
     │     gemini-1.5-pro → { summary, mechanism, clinical_impact }
     │     Falls back to rule-based templates if Gemini unavailable
     │
     ├─▶ Analysis.js (MongoDB)  (Persist result — non-blocking)
     │
     └─▶ Structured JSON Response
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js 4 |
| File Upload | Multer (memory storage) |
| LLM | Google Gemini (`gemini-1.5-pro`) |
| Database | MongoDB + Mongoose 8 |
| ID Generation | uuid v4 |
| Config | dotenv |

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key ([get one free](https://aistudio.google.com/app/apikey))

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd pharma-guard/backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env:
#   MONGO_URI=mongodb://localhost:27017/pharma_guard
#   GEMINI_API_KEY=AIza...

# 4. Start the server
npm start
# or development mode with auto-reload:
npm run dev
```

Server: `http://localhost:3000`

---

## 📡 API Reference

### `GET /health`
Health check.

```json
{ "status": "ok", "service": "PharmaGuard API", "version": "2.0.0" }
```

---

### `POST /api/analyze`

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `vcf_file` | File | ✅ | VCF v4.2 file, `.vcf` extension, max 5 MB |
| `drug_name` | String | ✅ | Single or comma-separated drug names |

**Supported Drugs:** `CODEINE`, `WARFARIN`, `CLOPIDOGREL`, `SIMVASTATIN`, `AZATHIOPRINE`, `FLUOROURACIL`

**Example (curl — single drug):**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "vcf_file=@uploads/sample_test_patient.vcf" \
  -F "drug_name=CODEINE"
```

**Example (curl — multiple drugs):**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "vcf_file=@uploads/sample_test_patient.vcf" \
  -F "drug_name=CODEINE,WARFARIN,FLUOROURACIL"
```

**Success Response (200):**
```json
{
  "patient_id": "PATIENT_A1B2C3D4",
  "drug": "CODEINE",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "risk_assessment": {
    "risk_label": "Adjust Dosage",
    "confidence_score": 0.9,
    "severity": "moderate"
  },
  "pharmacogenomic_profile": {
    "primary_gene": "CYP2D6",
    "diplotype": "*4/*10",
    "phenotype": "IM",
    "detected_variants": [
      { "rsid": "rs3892097" },
      { "rsid": "rs1065852" }
    ]
  },
  "clinical_recommendation": {
    "suggestion": "Consider dose reduction. Reduced CYP2D6 activity may lower morphine conversion."
  },
  "llm_generated_explanation": {
    "summary": "...",
    "mechanism": "...",
    "clinical_impact": "..."
  },
  "quality_metrics": {
    "vcf_parsing_success": true
  }
}
```

**Error Response:**
```json
{
  "error": true,
  "code": "MISSING_FILE",
  "message": "A VCF file is required. Upload it in the \"vcf_file\" field."
}
```

---

## 🧪 Risk Logic

| Drug Type | Activity Score | Risk Label |
|---|---|---|
| prodrug | 0 | Ineffective |
| prodrug | 0 < score < 1 | Adjust Dosage |
| prodrug | = 1 | Safe |
| prodrug | > 1 | Toxic |
| detox | 0 | Toxic |
| detox | 0 < score < 1 | Adjust Dosage |
| detox | ≥ 1 | Safe |
| transporter | < 1 | Toxic |
| transporter | ≥ 1 | Safe |

---

## 📁 Folder Structure

```
backend/
├── server.js                   ← Entry point, DB connection, graceful shutdown
├── app.js                      ← Express app, middleware, routes
├── routes/
│   └── analyze.js              ← POST /api/analyze orchestrator
├── services/
│   ├── vcfParser.js            ← VCF file parsing (zero dependencies)
│   ├── phenotypeEngine.js      ← Diplotype → phenotype → activity score
│   ├── riskEngine.js           ← Deterministic risk prediction
│   └── geminiService.js        ← Gemini LLM explanation + fallback
├── models/
│   └── Analysis.js             ← Mongoose schema for MongoDB
├── config/
│   ├── drugConfig.js           ← Drug → gene mappings + CPIC recommendations
│   └── phenotypeMap.js         ← Allele function values + phenotype ranges
├── middleware/
│   ├── uploadMiddleware.js     ← Multer VCF upload config
│   └── errorHandler.js         ← Global Express error handler
├── uploads/
│   └── sample_test_patient.vcf ← Sample VCF with all 6 genes
├── .env.example
└── package.json
```

---

## 🌐 Deployment (Render)

```bash
# In your Render dashboard:
# Build command:   npm install
# Start command:   node server.js
# Environment variables:
#   MONGO_URI=mongodb+srv://...
#   GEMINI_API_KEY=AIza...
#   PORT=10000
```

---

## 👥 Team Members

- _[Add team member names here]_

---

## 📜 License

MIT — Built for RIFT 2026 Hackathon. For research and educational purposes only.
This system does not constitute medical advice.
