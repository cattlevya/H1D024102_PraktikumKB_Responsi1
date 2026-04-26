# RESPIRA.ID — Product Overview

RESPIRA.ID is a web-based respiratory health diagnostic system targeting Indonesian users. It provides:

- **AI-assisted diagnosis** via a rule-based decision tree covering respiratory conditions (ISPA, Asma, PPOK, TB, Pneumonia, and more)
- **Two user roles**: `patient` (end users) and `expert` (medical professionals / doctors)
- **Daily health check-in** with a symptom score
- **Diagnosis history** with severity tracking
- **Air quality (AQI) widget** using OpenWeatherMap API
- **Health news feed** generated via Google Gemini AI
- **Expert tools**: knowledge manager, consultation history, AI-powered research suggestions, and a visual decision tree editor (ReactFlow)

The app is designed as a mobile-friendly SPA deployed on Vercel (frontend) and Railway (backend). The primary language of the UI and data is **Bahasa Indonesia**.

## User Roles
- `patient` — can run diagnoses, view history, check in daily, consult, view news
- `expert` — sees expert dashboard, manages knowledge base, views all consultation history, runs AI research

## Key Domain Concepts
- Diagnosis results have a `severity` field: `low`, `moderate`, `high`, `critical`
- The decision tree is a flat array of node objects with `id`, `type`, `options[].next` for navigation
- Valid expert license codes are hardcoded: `DOKTER123`, `SPESIALIS456`, `RESIDEN789`
