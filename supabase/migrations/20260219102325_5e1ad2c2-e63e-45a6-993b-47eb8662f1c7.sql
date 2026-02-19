
-- Patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);

-- VCF uploads
CREATE TABLE public.vcf_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES public.patients(patient_id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  upload_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vcf_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write vcf_uploads" ON public.vcf_uploads FOR ALL USING (true) WITH CHECK (true);

-- Drug analyses
CREATE TABLE public.drug_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES public.patients(patient_id),
  drug TEXT NOT NULL,
  risk_label TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  severity TEXT NOT NULL DEFAULT 'none',
  primary_gene TEXT,
  diplotype TEXT,
  phenotype TEXT,
  detected_variants JSONB DEFAULT '[]'::jsonb,
  recommendation TEXT,
  alternative_drugs JSONB DEFAULT '[]'::jsonb,
  cpic_alignment BOOLEAN DEFAULT true,
  llm_explanation JSONB DEFAULT '{}'::jsonb,
  full_result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.drug_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write drug_analyses" ON public.drug_analyses FOR ALL USING (true) WITH CHECK (true);

-- Risk trend metrics
CREATE TABLE public.risk_trend_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES public.patients(patient_id),
  drug_name TEXT NOT NULL,
  before_score NUMERIC NOT NULL,
  after_score NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.risk_trend_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write risk_trend_metrics" ON public.risk_trend_metrics FOR ALL USING (true) WITH CHECK (true);

-- Assistant conversations
CREATE TABLE public.assistant_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES public.patients(patient_id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write assistant_conversations" ON public.assistant_conversations FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket for VCF files
INSERT INTO storage.buckets (id, name, public) VALUES ('vcf-files', 'vcf-files', false);
CREATE POLICY "Allow public upload vcf" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vcf-files');
CREATE POLICY "Allow public read vcf" ON storage.objects FOR SELECT USING (bucket_id = 'vcf-files');
