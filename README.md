# RESPIRA.ID — Sistem Pakar Kesehatan Pernapasan

Aplikasi web sistem pakar untuk diagnosis penyakit pernapasan berbasis decision tree dan logika fuzzy, dibangun dengan React + Vite dan dapat di-hosting sepenuhnya di Netlify tanpa backend server.

🔗 **Live Demo:** https://respira-id.netlify.app

---

## Fitur Utama

- **Diagnosis Berbasis Decision Tree** — Alur tanya-jawab klinis untuk mendeteksi penyakit pernapasan (ISPA, Asma, PPOK, TBC, Pneumonia, dan lainnya)
- **Sistem Fuzzy Logic (Mamdani)** — Penilaian risiko pernapasan otomatis berdasarkan jawaban diagnosis
- **Kualitas Udara Real-time** — Widget AQI menggunakan OpenWeatherMap API
- **Berita Kesehatan** — Artikel kesehatan pernapasan yang di-generate oleh Google Gemini AI
- **Dua Role Pengguna** — `patient` (pasien) dan `expert` (dokter/pakar)
- **Penyimpanan Lokal** — Semua data tersimpan di `localStorage`, tidak memerlukan database

---

## Implementasi Fuzzy Logic

Program ini mengimplementasikan Sistem Inferensi Fuzzy (Fuzzy Inference System) menggunakan metode **Mamdani** untuk menilai tingkat risiko pernapasan pasien secara otomatis dari hasil diagnosis.

### a. Variabel Input (Antecedent)

- **Frekuensi Batuk** `[0 - 20]` kali/hari → Himpunan: Rendah, Sedang, Tinggi
- **Tingkat Sesak Napas** `[0 - 10]` skala mMRC → Himpunan: Ringan, Sedang, Berat
- **Kadar SpO2** `[70 - 100]` % → Himpunan: Normal, Rendah, Sangat Rendah

### b. Variabel Output (Consequent)

- **Risiko Pernapasan** `[0 - 100]` → Himpunan: Rendah, Sedang, Tinggi, Kritis

### c. Aturan Fuzzy (Rules)

Terdapat 12 aturan fuzzy IF-THEN yang didefinisikan di `src/services/fuzzyEngine.js`:

| # | Batuk | Sesak | SpO2 | Output |
|---|---|---|---|---|
| R1 | Rendah | Ringan | Normal | Rendah |
| R2 | Rendah | Ringan | Rendah | Sedang |
| R3 | Rendah | Sedang | Normal | Sedang |
| R4 | Sedang | Sedang | Normal | Sedang |
| R5 | Sedang | Sedang | Rendah | Tinggi |
| R6 | Sedang | Berat | Rendah | Tinggi |
| R7 | Tinggi | Berat | Rendah | Kritis |
| R8 | Tinggi | Berat | Sangat Rendah | Kritis |
| R9 | Rendah | Ringan | Sangat Rendah | Tinggi |
| R10 | Sedang | Ringan | Sangat Rendah | Tinggi |
| R11 | Tinggi | Sedang | Normal | Tinggi |
| R12 | Tinggi | Sedang | Rendah | Kritis |

### d. Membership Function

- Menggunakan fungsi **trapesium** (`trapezoid`) untuk himpunan di tepi range (Rendah, Tinggi, Normal, Sangat Rendah)
- Menggunakan fungsi **segitiga** (`triangle`) untuk himpunan di tengah range (Sedang, Ringan, Berat, Rendah SpO2)

### e. Defuzzifikasi

Menggunakan metode **Centroid (Center of Gravity)** dengan sampling 200 titik pada range output [0, 100].

### f. Sumber Data Input

Input fuzzy diambil **otomatis dari jawaban decision tree** melalui `src/services/fuzzyMapper.js`, bukan dari input manual pengguna. Contoh pemetaan:
- User pilih "Saturasi Oksigen < 90%" → `spo2Level = 87`
- User pilih "Tidak bisa bicara kalimat penuh" → `breathlessnessLevel = 8.5`
- User pilih "Batuk kronis berdahak banyak" → `coughFrequency = 14`

---

## Struktur Project

```
/
├── api/                        # Vercel Serverless Functions (tidak dipakai di Netlify)
├── netlify/
│   └── functions/
│       ├── aqi.js              # Proxy OpenWeatherMap API
│       └── news.js             # Proxy Google Gemini AI
├── src/
│   ├── services/
│   │   ├── jsonStore.js        # Lapisan penyimpanan localStorage
│   │   ├── api.js              # Public API surface
│   │   ├── authService.js      # Autentikasi
│   │   ├── fuzzyEngine.js      # Implementasi Fuzzy Logic Mamdani
│   │   └── fuzzyMapper.js      # Pemetaan jawaban diagnosis ke input fuzzy
│   ├── pages/
│   │   ├── Diagnosis.jsx       # Alur diagnosis decision tree
│   │   ├── FuzzyAssessment.jsx # Dashboard riwayat risiko pernapasan
│   │   └── ...
│   └── data/
│       └── decisionTree.js     # Pohon keputusan diagnosis (flat array)
├── netlify.toml                # Konfigurasi build & redirect Netlify
└── vercel.json                 # Konfigurasi redirect (legacy)
```

---

## Akun Demo

| Role | Email | Password |
|---|---|---|
| Pasien | user@gmail.com | user123 |
| Dokter/Expert | admin@respira.id | admin |

Kode lisensi expert yang valid: `DOKTER123`, `SPESIALIS456`, `RESIDEN789`

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 19 + Vite 7 |
| Styling | Tailwind CSS v3 |
| Animasi | Framer Motion |
| Chart | Recharts |
| Flow Diagram | ReactFlow |
| AI | Google Gemini 2.0 Flash |
| Storage | localStorage (tanpa database) |
| Hosting | Netlify |

---

## Cara Menjalankan Lokal

```bash
# Clone repository
git clone https://github.com/username/respira-id.git
cd respira-id

# Install dependencies
npm install

# Buat file .env dari template
cp .env.example .env
# Isi VITE_OPENWEATHER_API_KEY dan VITE_GEMINI_API_KEY

# Jalankan development server
npm run dev
```

Buka `http://localhost:5173` di browser.

---

## Deploy ke Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy production
netlify deploy --prod
```

Set environment variables di Netlify Dashboard → Site Configuration → Environment Variables:

```
OPENWEATHER_API_KEY = your_openweathermap_api_key
GEMINI_API_KEY      = your_gemini_api_key
```

---

## localStorage Keys

| Key | Isi |
|---|---|
| `respira_users` | Semua pengguna terdaftar |
| `respira_current_user` | Sesi pengguna aktif |
| `respira_diagnosis_logs` | Semua log hasil diagnosis |
| `respira_checkins` | Data check-in harian |
