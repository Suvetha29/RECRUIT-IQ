# RECRUIT-IQ

An AI-augmented Applicant Tracking System (ATS) built on a **FastAPI** REST backend and a **React SPA** frontend. RECRUIT-IQ implements automated resume screening, LLM-based content generation, speech-to-text interview evaluation, and a full role-based hiring pipeline with JWT-secured endpoints.

---

## ✨ Features

- 🤖 **LLM-generated job postings** — structured JSON generation (description/requirements/responsibilities) via Groq's inference API
- 👥 **Role-based access control (RBAC)** — `HR` and `CANDIDATE` enum roles gate route access via FastAPI dependency injection
- 💼 **Job lifecycle management** — CRUD operations on job postings with cascading deletes across dependent `Assessment`, `AssessmentResult`, and `Application` records
- 📝 **Application pipeline state machine** — applications transition through a defined `ApplicationStatus` enum (`PENDING → UNDER_REVIEW → SHORTLISTED → INTERVIEW → HIRED/REJECTED`)
- 📊 **Heuristic ATS scoring engine** — weighted composite score (skills 50% / keyword overlap 30% / experience match 20%) computed via regex-based NLP on extracted PDF text
- 🧪 **MCQ assessment engine** — JSON-serialized question banks stored per job, server-side answer validation, with a detailed per-question correctness breakdown endpoint
- 🎙️ **Async speech evaluation pipeline** — audio upload → Whisper ASR transcription → LLM-based qualitative evaluation → structured JSON scoring (hire/reject, strengths, weaknesses)
- 📅 **Automated video interview provisioning** — deterministic Jitsi Meet room generation 
- 📄 **Server-side PDF generation** — ReportLab-based document composition (Platypus flowables) for offer letters, dynamically templated per candidate/job
- 🔔 **Polling-based notification system** — client-side interval polling against a `Notification` table, with FK references to `job_id`/`application_id` for deep-linking
- 📧 **Multipart SMTP delivery** — `smtplib` + `email.mime` for both HTML-only and MIME `mixed` (PDF attachment) messages, dispatched asynchronously via Python `threading.Thread` to avoid blocking the request lifecycle
- 🔐 **Stateless JWT auth** — HS256-signed tokens via `python-jose`, `bcrypt` password hashing, `HTTPBearer` dependency-based route protection

---

## 🛠️ Tech Stack & Key Libraries

**Backend (Python 3.11):**

| Layer | Library | Purpose |
|---|---|---|
| Web framework | `fastapi` | ASGI request routing, dependency injection, auto-generated OpenAPI docs |
| ASGI server | `uvicorn` | Dev server with hot-reload (`--reload`) |
| ORM | `sqlalchemy` | Declarative models, session management, relationship mapping |
| Validation | `pydantic` | Request/response schema validation, `EmailStr` typing |
| Auth | `python-jose[cryptography]`, `bcrypt` | JWT encode/decode, password hashing |
| LLM inference | `groq` | Chat completions (`groq/compound-mini`) + audio transcription (`whisper-large-v3`) |
| PDF parsing | `PyPDF2` | Resume text extraction from uploaded PDFs |
| PDF generation | `reportlab` | Offer letter document composition |
| Env config | `python-dotenv` | `.env` variable loading |

**Frontend:**

| Layer | Library | Purpose |
|---|---|---|
| UI framework | `react` (functional components + hooks) | Component state via `useState`/`useEffect`/`useRef` |
| Routing | `react-router-dom` | Client-side routing, `useParams`/`useNavigate` |
| HTTP client | `axios` | Interceptor-based API client (`services/api.js`) with bearer token injection |
| Styling | Tailwind CSS + inline CSS-in-JS (scoped `<style>` blocks per component) |

---

## 📋 Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Python | 3.11.x | Use 3.11.9 on Windows — later 3.11.x patches (3.11.10+) no longer ship binary installers (security-fix-only branch) |
| Node.js | 18.x LTS+ | Ships `npm` |
| Git | any recent | — |
| Groq API key | — | Free tier, rate-limited (no billing required) — [console.groq.com](https://console.groq.com) |
| Gmail App Password | — | Requires 2FA enabled on the Google account |

---

## 🚀 Setup

### 1. Clone

```bash
git clone https://github.com/yourusername/RECRUIT-IQ.git
cd RECRUIT-IQ
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
```

```bash
python -m uvicorn main:app --reload

```
### 3. Frontend

```bash
cd frontend
npm install
npm start
```
---

## 🗄️ Data Model (SQLAlchemy)

| Table | Key columns | Notes |
|---|---|---|
| `users` | `role` (enum: `hr`/`candidate`), `hashed_password` | 1:N with `jobs` (as recruiter), 1:N with `applications` (as candidate) |
| `jobs` | `status` (enum: `open`/`closed`), `recruiter_id` (FK → users) | 1:1 with `assessment`, 1:N with `applications` |
| `applications` | `status` (7-state enum), `ats_score`, `ai_score`, `recording_path`, `transcript` | Central entity linking candidate ↔ job; stores both ATS (resume) and AI (interview) evaluation results |
| `assessments` | `questions` (JSON column), `passing_score` | One assessment per job (unique constraint on `job_id`) |
| `assessment_results` | `answers` (JSON — array of selected option indices), `score`, `passed` | 1:1 with `applications` |
| `notifications` | `job_id`, `application_id` (nullable FKs for deep-linking) | Polled by frontend `NotificationBell` component every 30s |

---

## 🔌 Key API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Creates user, returns JWT |
| `POST` | `/api/auth/login` | — | Validates bcrypt hash, returns JWT |
| `POST` | `/api/jobs/generate` | HR | LLM-generated job content (JSON-mode prompt) |
| `POST` | `/api/applications/apply` | Candidate | Multipart form upload (resume PDF), triggers `calculate_ats_score()` synchronously |
| `GET` | `/api/applications/job/{job_id}` | HR | Applicants sorted by `ats_score DESC` |
| `PATCH` | `/api/applications/{id}/status` | HR | State transition + async email dispatch (`Thread`) + notification creation |
| `POST` | `/api/assessments/create` | HR | Upserts MCQ question bank as JSON |
| `POST` | `/api/assessments/submit` | Candidate | Server-side scoring against stored `correct_answer` indices |
| `GET` | `/api/assessments/results/{application_id}/detailed` | HR | Per-question correctness diff (candidate answer vs. correct answer) |
| `POST` | `/api/evaluation/upload` | HR | Audio → Whisper transcription → LLM evaluation pipeline |
| `POST` | `/api/evaluation/offer-letter/{application_id}` | HR | ReportLab PDF generation + `FileResponse` + async email w/ MIME attachment |

Full interactive spec available at `/docs` (Swagger UI) once the backend is running.

---

## 🧠 ATS Scoring Algorithm

`calculate_ats_score()` in `main.py` computes:

```
overall_score = (keyword_match_pct × 0.30)
              + (skill_match_pct   × 0.50)
              + (experience_match_pct × 0.20)
```

- **Keyword match**: set intersection of tokenized words (regex `\b[a-zA-Z]{3,}\b`, stop-words filtered) between resume and concatenated job fields
- **Skill match**: substring lookup against a fixed `common_skills` taxonomy (~40 terms)
- **Experience match**: regex extraction of `"\d+\+?\s*years?"` patterns from both resume and job text, ratio-capped at 100%

> This is a deterministic, explainable heuristic — not an ML/embedding-based similarity model. It is sensitive to exact keyword presence; synonyms or implied skills (e.g., "Django" implying Python) are not resolved.

---

## 📁 Project Structure

```
RECRUIT-IQ/
├── backend/
│   ├── main.py                  # App factory, auth, job/application CRUD, ATS engine
│   ├── models.py                # SQLAlchemy declarative models + enums
│   ├── database.py               # Engine/SessionLocal/Base + get_db dependency
│   ├── schemas.py
│   ├── routes/
│   │   ├── assessment.py        # MCQ creation/submission/scoring
│   │   ├── evaluation.py        # Whisper + LLM pipeline, offer letter PDF gen
│   │   ├── notifications.py     # Notification CRUD + create_notification() helper
│   │   ├── email_service.py     # SMTP dispatch (HTML + MIME multipart)
│   │   └── auth_deps.py         # get_current_user / get_current_hr_user / get_current_candidate
│   └── uploads/                 # resumes/, recordings/, offer_letters/ (gitignored)
└── frontend/
    └── src/components/
        ├── hr/                  # HRApplications, HRAssessment, AllApplicants, HRKanban
        ├── candidate/           # ApplyJob, MyApplications
        ├── assessment/          # Timed MCQ-taking UI
        └── common/              # NotificationBell (polling + role-aware routing)
```

---

## 🩹 Troubleshooting

| Symptom | Root cause | Fix |
|---|---|---|
| `python`/`pip` unrecognized | PATH not updated post-install | Reinstall with "Add python.exe to PATH" checked, or manually append `%USERPROFILE%\AppData\Local\Programs\Python\Python311\` and `\Scripts\` to user PATH |
| `npm.ps1 cannot be loaded` | PowerShell script execution disabled | `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| `ModuleNotFoundError` on boot | Incomplete `requirements.txt` | `pip install <package>` per traceback; common gaps: `groq`, `reportlab`, `pydantic[email]` |
| `model_not_found` (404) from Groq | Model deprecated/enterprise-gated | Check `console.groq.com/docs/models`; self-serve models show explicit per-token pricing (not "Contact Sales") |
| Emails silently not sending, no exception | Missing `SMTP_USER`/`SMTP_PASSWORD` in `.env` | `_send_email()` early-returns with a logged warning rather than raising — check terminal output |
| `no such column: notifications.job_id` | SQLite schema drift after model change | `Base.metadata.create_all()` only creates missing tables, not columns — delete the `.db` file to force a rebuild (dev only, destructive) |
| `401 Unauthorized` after backend restart | `SECRET_KEY` changed or fell back to default | Pin `SECRET_KEY` explicitly in `.env`; re-authenticate to mint a token signed with the current key |
| `403 Forbidden` on `/api/applications/my` | Endpoint gated by `get_current_candidate` | Expected behavior when called with an HR-role token |
| Low ATS score despite a strong resume | `PyPDF2` not installed → empty extracted text | `pip install PyPDF2`; verify via a debug `print(len(resume_text))` |

---

## 📄 License

Open source, for personal and educational use.
