# PharmaGuard Backend Setup

The PharmaGuard analysis engine has been migrated to a robust Python/FastAPI backend to ensure accurate, real-world pharmacogenomic processing.

## Prerequisites
- Python 3.8+
- Pip (Python Package Installer)

## Setup Instructions

1.  **Navigate to Project Root**:
    Open your terminal in `d:/PROJECT/RIFT HACKTHON/`.

2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
    (Installs `fastapi`, `uvicorn`, `pydantic`)

3.  **Run the Backend Server**:
    ```bash
    uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
    ```
    Or simply:
    ```bash
    python backend/main.py
    ```

4.  **Verify**:
    Open [http://localhost:8000](http://localhost:8000) in your browser. You should see `{"status": "ok", ...}`.

5.  **Run Frontend**:
    In a separate terminal:
    ```bash
    npm run dev
    ```

## Architecture
- **API**: FastAPI (`backend/main.py`)
- **Parser**: Custom VCF Parser (`backend/vcf_parser.py`)
- **Engine**: Pharmacogenomic Logic (`backend/pharmacogenomics.py`)
- **Frontend**: React/Vite (Communicates via `POST /analyze`)
