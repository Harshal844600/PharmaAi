# PharmaAI 🧬

<p align="center">
  <img src="https://img.shields.io/badge/React-TypeScript-blue" alt="React TypeScript">
  <img src="https://img.shields.io/badge/Node.js-Express-green" alt="Node.js Express">
  <img src="https://img.shields.io/badge/AI-Gemini%20%26%20Groq-purple" alt="AI Gemini Groq">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

> AI-powered pharmacogenomics analysis platform that helps healthcare professionals predict drug responses based on patient genetic profiles.

## ✨ Features

- **Genetic Analysis**: Upload VCF files and analyze patient genetic variants
- **Drug Response Prediction**: Get AI-powered predictions for drug efficacy and side effects
- **Risk Assessment**: Evaluate patient-specific drug risks based on pharmacogenomics
- **AI Assistant**: Chat with an AI assistant for drug information and recommendations
- **Phenotype Mapping**: Automatically map genetic variants to drug metabolizer phenotypes
- **Interactive Results**: Visual risk graphs and detailed analysis reports

## 🛠️ Tech Stack

### Frontend
- [React](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Recharts](https://recharts.org/) - Data visualization

### Backend
- [Node.js](https://nodejs.org/) - Runtime
- [Express](https://expressjs.com/) - Web framework
- [Groq](https://groq.com/) - AI inference
- [Google Gemini](https://gemini.google.com/) - AI model

### Database & Services
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [VCF Parser](https://www.npmjs.com/package/vcf.js) - Genetic data parsing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or bun
- Git

### Installation

1. **Clone the repository**
   
```
bash
   git clone https://github.com/Harshal844600/PharmaAi.git
   cd PharmaAi
   
```

2. **Install frontend dependencies**
   
```
bash
   npm install
   
```

3. **Install backend dependencies**
   
```
bash
   cd backend
   npm install
   
```

4. **Environment Setup**

   Create a `.env` file in the `backend` directory:
   
```
env
   PORT=3001
   GROQ_API_KEY=your_groq_api_key
   GEMINI_API_KEY=your_gemini_api_key
   
```

### Running the Application

1. **Start the backend server**
   
```
bash
   cd backend
   npm run dev
   
```

2. **Start the frontend development server**
   
```
bash
   npm run dev
   
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## 📖 Usage

### Upload Genetic Data
1. Navigate to the home page
2. Click on "Upload VCF File" or drag and drop your VCF file
3. Wait for the genetic analysis to complete

### Get Drug Recommendations
1. Select the drug you're interested in from the drug selector
2. View AI-generated risk assessments and recommendations
3. Check the detailed analysis for more information

### Chat with AI Assistant
1. Click on the AI Assistant icon
2. Ask questions about drugs, genetics, or drug interactions
3. Get instant answers from the AI

## 📁 Project Structure

```
PharmaAi/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── lib/                # Utility functions
│   ├── hooks/              # Custom React hooks
│   └── integrations/       # Third-party integrations
├── backend/                # Backend source code
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── middleware/         # Express middleware
│   └── config/             # Configuration files
├── public/                 # Static assets
└── supabase/               # Supabase configuration
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Lovable](https://lovable.dev/) for the initial project template
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Groq](https://groq.com/) and [Google Gemini](https://gemini.google.com/) for AI capabilities

---

<p align="center">Made with ❤️ for Pharmacogenomics</p>
