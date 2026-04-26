# Project Structure

```
/
├── index.html                  # Vite entry point
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── vercel.json                 # SPA rewrite rules for Vercel
├── railway.json                # Backend deploy config for Railway
├── db.json                     # Legacy seed data (reference only)
├── database.sql                # MySQL schema
│
├── server/                     # Express backend (Node.js, CommonJS)
│   ├── index.js                # All API routes defined here
│   ├── config/db.js            # MySQL connection pool
│   ├── package.json
│   └── setup_db.js / update_db.js  # DB migration scripts
│
└── src/                        # React frontend (ES modules, JSX)
    ├── main.jsx                # App entry — BrowserRouter + ErrorBoundary
    ├── App.jsx                 # Route definitions + role-based routing
    ├── index.css               # Global styles (Tailwind base)
    │
    ├── context/
    │   └── AuthContext.jsx     # Auth state — useAuth() hook
    │
    ├── services/
    │   ├── api.js              # Public API surface (use this in components)
    │   ├── authService.js      # Auth methods (used by AuthContext only)
    │   └── jsonStore.js        # localStorage persistence layer
    │
    ├── data/
    │   └── decisionTree.js     # Flat array of diagnosis tree nodes
    │
    ├── pages/                  # Route-level page components
    │   ├── AuthPage.jsx        # Login + Register
    │   ├── Dashboard.jsx       # Patient dashboard
    │   ├── DashboardExpert.jsx # Expert dashboard
    │   ├── Diagnosis.jsx       # Decision tree diagnosis flow
    │   ├── Riwayat.jsx         # Patient history
    │   ├── Kamus.jsx           # Medical glossary
    │   ├── Konsultasi.jsx      # Consultation
    │   ├── Profile.jsx         # Patient profile
    │   ├── ProfileExpert.jsx   # Expert profile
    │   ├── News.jsx            # Health news (Gemini)
    │   ├── ExpertResearch.jsx  # AI research tool
    │   ├── KnowledgeManager.jsx
    │   ├── TreeManager.jsx     # Visual decision tree editor
    │   └── AdminDashboard.jsx
    │
    └── components/
        ├── auth/
        │   └── ProtectedRoute.jsx   # Role-based route guard
        ├── common/
        │   └── ErrorBoundary.jsx
        ├── layout/
        │   └── AppShell.jsx         # Main layout wrapper (nav + content)
        ├── dashboard/
        │   ├── AirQualityWidget.jsx
        │   └── LungTestWidget.jsx
        ├── diagnosis/result/        # Diagnosis result sub-components
        │   ├── DiagnosisResultPage.jsx
        │   ├── DiagnosisHeaderCard.jsx
        │   ├── ClinicalAnalysis.jsx
        │   └── ActionPlanSidebar.jsx
        ├── expert/
        │   └── LogicManager.jsx
        ├── features/
        │   └── NewsFeed.jsx
        ├── modals/
        │   └── DailyTestModal.jsx
        ├── results/
        │   ├── ResultHeader.jsx
        │   └── ResultActionPlan.jsx
        ├── ui/
        │   ├── MultimediaCards.jsx  # ImageGrid, AudioPlayer
        │   └── Widgets.jsx
        └── visuals/
            ├── BioNetwork.jsx
            └── NeuralLungs.jsx
```

## Conventions

- **Pages** live in `src/pages/` and are imported directly in `App.jsx` routes
- **Reusable UI** lives in `src/components/`; organized by domain, not by type
- **Data access** always goes through `src/services/api.js` — never import `jsonStore` directly in components
- **Auth** is accessed via `useAuth()` from `AuthContext` — never read localStorage directly in components
- **Route protection** uses `<ProtectedRoute allowedRoles={[...]}>` wrapping `<AppShell>`
- All protected routes are wrapped in `<AppShell>` for consistent layout
- Role-based rendering: check `user.role === 'expert'` or `user.role === 'patient'`
- Decision tree nodes are identified by string `id`; navigation follows `option.next` pointers
- Node types: `'choice'`, `'image_selection'`, `'audio_selection'`, `'multi_choice'`, `'danger_check'`, `'result'`
