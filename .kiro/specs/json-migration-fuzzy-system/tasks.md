# Implementation Plan: JSON Migration & Fuzzy Logic System

## Overview

Implementasi dibagi menjadi 5 fase berurutan:
1. **Fondasi** — Buat `jsonStore.js` sebagai lapisan penyimpanan tunggal
2. **Migrasi Service** — Refactor `authService.js` dan `api.js` agar menggunakan `jsonStore`
3. **Migrasi Halaman** — Update semua halaman yang masih memanggil backend Express
4. **Vercel Functions** — Buat serverless functions untuk AQI dan News
5. **Fuzzy Engine + UI** — Implementasi `fuzzyEngine.js` dan halaman `FuzzyAssessment`

Setiap task membangun di atas task sebelumnya. Tidak ada kode yang dibiarkan tergantung (orphaned).

---

## Tasks

- [x] 1. Buat `src/services/jsonStore.js` — lapisan penyimpanan localStorage
  - Buat file `src/services/jsonStore.js` dengan semua method yang didefinisikan di design
  - Implementasikan `seedInitialData()` yang menyisipkan dua akun seed dari `db.json` (admin@respira.id dan user@gmail.com) jika `respira_users` belum ada
  - Implementasikan `getUsers()` dan `saveUsers(users)` sebagai operasi baca/tulis dasar
  - Implementasikan `registerUser(userData)`: validasi email unik, validasi `licenseCode` untuk role `expert` (kode valid: `['DOKTER123', 'SPESIALIS456', 'RESIDEN789']`), buat UUID v4 dengan `crypto.randomUUID()`, simpan ke `respira_users`, kembalikan `{ success, user }` tanpa field password
  - Implementasikan `loginUser(email, password)`: cari user, cocokkan password, simpan ke `respira_current_user`, kembalikan `{ success, user }`
  - Implementasikan `logoutUser()`: hapus key `respira_current_user`
  - Implementasikan `getCurrentUser()`: baca dari `respira_current_user`
  - Implementasikan `updateCurrentUser(user)`: update `respira_current_user`
  - Implementasikan `getDiagnosisLogs(userId)`: filter by userId, sort descending by `createdAt`
  - Implementasikan `saveDiagnosisLog(payload)`: buat UUID, tambah ke `respira_diagnosis_logs`, terapkan batas 100 entri per user (hapus terlama jika melebihi)
  - Implementasikan `getAllDiagnosisLogs()`: kembalikan semua log tanpa filter
  - Implementasikan `getTodayCheckin(userId)`: filter by userId dan `checkDate === today`
  - Implementasikan `saveCheckin(userId, score)`: upsert — update jika sudah ada hari ini, buat baru jika belum
  - Implementasikan `getProfile(userId)`: kembalikan user object dari `respira_users` by id
  - Implementasikan `updateProfile(userId, profileData)`: update field profil pada user di `respira_users`, juga update `respira_current_user` jika userId cocok
  - Implementasikan `getAdminStats()`: hitung `totalToday`, `criticalCount`, `totalUsers`, `totalDiagnoses`, `diseaseDistribution`, `activityLog` (7 hari terakhir)
  - Bungkus semua operasi localStorage dalam `try/catch`; kembalikan `{ success: false, message }` untuk error, jangan lempar exception
  - Panggil `seedInitialData()` di awal setiap method yang membaca `respira_users` jika key belum ada
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 11.4, 12.4_

  - [ ]* 1.1 Tulis property test: Auth Round-Trip (register → login → getCurrentUser)
    - **Property 1: Auth Round-Trip — Register lalu Login**
    - **Validates: Requirements 1.2, 1.4**
    - Gunakan `fc.record({ name: fc.string(), email: fc.emailAddress(), password: fc.string({ minLength: 1 }), role: fc.constant('patient') })` sebagai arbitrary
    - Bersihkan localStorage sebelum setiap run

  - [ ]* 1.2 Tulis property test: Duplikasi email ditolak
    - **Property 2: Duplikasi Email Ditolak**
    - **Validates: Requirements 1.3**

  - [ ]* 1.3 Tulis property test: Logout menghapus sesi
    - **Property 3: Logout Menghapus Sesi**
    - **Validates: Requirements 1.6**

  - [ ]* 1.4 Tulis property test: Validasi kode lisensi expert
    - **Property 4: Validasi Kode Lisensi Expert**
    - **Validates: Requirements 1.8**

  - [ ]* 1.5 Tulis property test: Diagnosis Log Round-Trip
    - **Property 5: Diagnosis Log Round-Trip**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 1.6 Tulis property test: Filter dan urutan riwayat diagnosis
    - **Property 6: Filter dan Urutan Riwayat Diagnosis**
    - **Validates: Requirements 2.3**

  - [ ]* 1.7 Tulis property test: Batas maksimal 100 log per pengguna
    - **Property 7: Batas Maksimal 100 Log Per Pengguna**
    - **Validates: Requirements 2.5**

  - [ ]* 1.8 Tulis property test: Check-in harian round-trip
    - **Property 8: Check-in Harian Round-Trip**
    - **Validates: Requirements 3.1, 3.3**

  - [ ]* 1.9 Tulis property test: Idempotence check-in harian
    - **Property 9: Idempotence Check-in Harian**
    - **Validates: Requirements 3.4**

  - [ ]* 1.10 Tulis property test: Profil round-trip
    - **Property 10: Profil Round-Trip**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ]* 1.11 Tulis property test: Statistik admin akurat
    - **Property 11: Statistik Admin Akurat**
    - **Validates: Requirements 5.1, 5.2**

  - [ ]* 1.12 Tulis property test: JSON round-trip serialisasi
    - **Property 12: JSON Round-Trip (Serialisasi)**
    - **Validates: Requirements 12.4**

- [ ] 2. Checkpoint — Pastikan jsonStore berfungsi sebelum migrasi service
  - Pastikan semua unit test dan property test untuk `jsonStore.js` lulus
  - Verifikasi seed data muncul dengan benar di localStorage saat pertama kali dijalankan
  - Tanyakan ke user jika ada pertanyaan sebelum melanjutkan

- [x] 3. Refactor `src/services/authService.js` — delegasikan ke jsonStore
  - Import `jsonStore` dari `../services/jsonStore`
  - Ganti method `login` agar memanggil `jsonStore.loginUser(email, password)` — hapus semua `fetch` ke backend
  - Ganti method `register` agar memanggil `jsonStore.registerUser(userData)` — hapus semua `fetch` ke backend
  - Ganti method `logout` agar memanggil `jsonStore.logoutUser()` — hapus `localStorage.removeItem('user')`
  - Ganti method `getCurrentUser` agar memanggil `jsonStore.getCurrentUser()` — hapus `localStorage.getItem('user')`
  - Hapus konstanta `API_URL` dari file ini
  - Pastikan return shape tetap kompatibel dengan `AuthContext.jsx` (`{ success, user }`)
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 6.1_

- [x] 4. Refactor `src/services/api.js` — ganti semua fetch backend dengan jsonStore
  - Import `jsonStore` dari `./jsonStore`
  - Ganti `login`, `register`, `logout`, `getCurrentUser` agar mendelegasikan ke `jsonStore` (konsisten dengan `authService.js`)
  - Ganti `getHistory(userId)` agar mengembalikan `{ success: true, data: jsonStore.getDiagnosisLogs(userId) }`
  - Ganti `saveDiagnosis(data)` agar memanggil `jsonStore.saveDiagnosisLog(data)` — petakan field dari format lama (`result`, `score`, `symptoms`) ke format baru (`finalResult`, `confidenceScore`, `symptomsSummary`)
  - Ganti `getScore(userId)` agar mengembalikan `{ success: true, score: jsonStore.getTodayCheckin(userId)?.score ?? null }`
  - Ganti `saveScore(userId, score)` agar memanggil `jsonStore.saveCheckin(userId, score)`
  - Ganti `checkTodayStatus(userId)` agar mengembalikan `{ success: true, hasCheckedIn: !!jsonStore.getTodayCheckin(userId) }`
  - Ganti `getProfile(userId)` agar mengembalikan `{ success: true, data: jsonStore.getProfile(userId) }`
  - Ganti `updateProfile(userId, data)` agar memanggil `jsonStore.updateProfile(userId, data)`
  - **Pertahankan** `getAQI(lat, lon)` — ubah URL dari `${API_URL}/aqi` ke `/api/aqi` (Vercel Function)
  - **Pertahankan** `getNews()` — ubah URL dari `${API_URL}/news` ke `/api/news` (Vercel Function)
  - Hapus konstanta `API_URL` dari file ini
  - _Requirements: 1.2, 1.4, 1.6, 2.1, 2.2, 2.3, 3.1, 3.3, 4.1, 4.2, 6.1, 6.2, 6.3_

- [ ] 5. Update halaman-halaman yang masih memanggil backend secara langsung
  - [x] 5.1 Update `src/pages/DashboardUser.jsx`
    - Hapus `fetch` langsung ke `${API_URL}/dashboard/${user.id}`
    - Ganti dengan tiga panggilan terpisah ke `api`: `api.getProfile(user.id)`, `api.getScore(user.id)`, `api.getHistory(user.id)`
    - Susun hasilnya ke dalam `dashboardData` state dengan shape yang sama (`userName`, `userProfile`, `latestScore`, `history`)
    - Hapus konstanta `API_URL` dari komponen ini
    - _Requirements: 3.3, 4.2, 2.3, 6.1_

  - [x] 5.2 Update `src/pages/DashboardExpert.jsx`
    - Hapus `fetch` langsung ke `${API_URL}/admin/stats`
    - Ganti dengan `const stats = jsonStore.getAdminStats()` (import langsung atau via `api`)
    - Petakan field dari format lama (`total_users`, `total_diagnoses`, `recent_activity`, `emergency_count`) ke format baru dari `getAdminStats()`
    - Hapus konstanta `API_URL` dari komponen ini
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1_

  - [x] 5.3 Update `src/pages/Riwayat.jsx`
    - Panggilan `api.getHistory(user.id)` sudah ada — pastikan field yang diakses di JSX cocok dengan format baru (`createdAt` bukan `created_at`, `finalResult` bukan `final_result`, `confidenceScore` bukan `confidence_score`, `symptomsSummary` bukan `symptoms_summary`)
    - Update semua referensi field di JSX agar sesuai dengan `DiagnosisLog` interface dari design
    - _Requirements: 2.3, 6.1_

  - [x] 5.4 Verifikasi `src/pages/Profile.jsx` dan `src/pages/ProfileExpert.jsx`
    - Panggilan `api.getProfile` dan `api.updateProfile` sudah ada — verifikasi field yang diakses cocok dengan `User` interface dari design
    - Jika ada field yang tidak cocok (misalnya `birth_date` vs `birthDate`), sesuaikan di `jsonStore.js` agar konsisten dengan format yang digunakan di UI
    - _Requirements: 4.1, 4.2, 4.3, 6.1_

- [ ] 6. Checkpoint — Verifikasi migrasi service dan halaman selesai
  - Pastikan tidak ada `fetch` ke `localhost:5000` tersisa di seluruh codebase (cari dengan grep)
  - Pastikan login, register, logout, riwayat, profil, dan dashboard berfungsi dengan data dari localStorage
  - Tanyakan ke user jika ada pertanyaan sebelum melanjutkan

- [x] 7. Buat Vercel Serverless Functions
  - [x] 7.1 Buat `api/aqi.js` — proxy ke OpenWeatherMap
    - Buat file `api/aqi.js` di root project (bukan di `src/`)
    - Implementasikan handler yang membaca `req.body` untuk `lat` dan `lon`
    - Fetch ke `https://api.openweathermap.org/data/2.5/air_pollution` dengan `OPENWEATHER_API_KEY` dari `process.env`
    - Parse response dan kembalikan `{ success: true, data: { aqi, pm25, co, city } }`
    - Implementasikan fallback data jika API gagal: `{ success: true, data: { aqi: 2, pm25: 15.5, co: 240, city: 'Mode Demo' } }`
    - Set CORS headers yang diperlukan
    - _Requirements: 6.2_

  - [x] 7.2 Buat `api/news.js` — proxy ke Gemini AI
    - Buat file `api/news.js` di root project
    - Implementasikan handler yang memanggil Gemini AI dengan `GEMINI_API_KEY` dari `process.env`
    - Gunakan `@google/generative-ai` (sudah ada di `package.json`) untuk generate berita kesehatan pernapasan
    - Kembalikan `{ success: true, data: [...newsItems] }` dengan format `{ title, summary, source, date }`
    - Implementasikan fallback data jika Gemini gagal (array 3 berita mock)
    - _Requirements: 6.3_

  - [x] 7.3 Update `vercel.json`
    - Tambahkan rewrite rules untuk `/api/aqi` dan `/api/news` sebelum catch-all rule
    - Format sesuai design: `{ "source": "/api/aqi", "destination": "/api/aqi" }` dst
    - _Requirements: 6.2, 6.3_

- [x] 8. Buat `src/services/fuzzyEngine.js` — implementasi Mamdani fuzzy logic
  - Buat file `src/services/fuzzyEngine.js` sebagai pure ES module tanpa dependensi eksternal
  - Implementasikan `trapezoid(x, a, b, c, d)`: `max(0, min(1, min((x-a)/(b-a), (d-x)/(d-c))))` — tangani edge case pembagian nol (a===b atau c===d)
  - Implementasikan `triangle(x, a, b, c)`: `max(0, min((x-a)/(b-a), (c-x)/(c-b)))` — tangani edge case pembagian nol
  - Implementasikan `fuzzifyCough(value)`: kembalikan `{ rendah, sedang, tinggi }` menggunakan parameter dari design
  - Implementasikan `fuzzifyBreathlessness(value)`: kembalikan `{ ringan, sedang, berat }`
  - Implementasikan `fuzzifySpO2(value)`: kembalikan `{ normal, rendah, sangat_rendah }`
  - Implementasikan `applyRules(coughMem, breathMem, spo2Mem)`: terapkan 12 aturan dari design menggunakan operator AND (minimum) untuk anteseden; kembalikan array `{ rule, strength, output }` — sertakan hanya aturan dengan `strength > 0`
  - Implementasikan `defuzzifyCentroid(ruleResults)`: agregasi output menggunakan max per himpunan output, lalu hitung centroid dengan sampling 100 titik di range [0, 100]
  - Implementasikan `assess(inputs)`: validasi input terlebih dahulu (kembalikan `{ success: false, message }` jika out-of-range), lalu jalankan pipeline fuzzifikasi → inferensi → defuzzifikasi; kembalikan `FuzzyResult` lengkap
  - Implementasikan `getRiskLevel(score)`: `score ≤ 30 → 'Rendah'`, `≤ 60 → 'Sedang'`, `≤ 80 → 'Tinggi'`, `> 80 → 'Kritis'`
  - Export semua fungsi sebagai named exports dan juga sebagai `export const fuzzyEngine = { ... }`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 12.1_

  - [ ]* 8.1 Tulis property test: Membership degree selalu dalam [0, 1]
    - **Property 13: Membership Degree Selalu dalam [0, 1]**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.6, 7.7**
    - Gunakan `fc.float({ min: 0, max: 20 })` untuk cough, `fc.float({ min: 0, max: 10 })` untuk breathlessness, `fc.float({ min: 70, max: 100 })` untuk SpO2

  - [ ]* 8.2 Tulis property test: Input di luar range menghasilkan error
    - **Property 14: Input di Luar Range Menghasilkan Error**
    - **Validates: Requirements 7.5, 11.1, 11.2, 11.3**

  - [ ]* 8.3 Tulis property test: SpO2 sangat rendah selalu menghasilkan risiko tinggi
    - **Property 15: SpO2 Sangat Rendah Selalu Menghasilkan Risiko Tinggi**
    - **Validates: Requirements 8.3**
    - Gunakan `fc.float({ min: 70, max: 84.9 })` untuk SpO2, kombinasikan dengan arbitrary cough dan breathlessness yang valid

  - [ ]* 8.4 Tulis property test: Determinisme fuzzy engine
    - **Property 16: Determinisme Fuzzy Engine**
    - **Validates: Requirements 8.6**

  - [ ]* 8.5 Tulis property test: Struktur output fuzzy engine lengkap
    - **Property 17: Struktur Output Fuzzy Engine Lengkap**
    - **Validates: Requirements 8.5**

  - [ ]* 8.6 Tulis property test: Performa fuzzy engine < 50ms
    - **Property 18: Performa Fuzzy Engine < 50ms**
    - **Validates: Requirements 12.1**

- [ ] 9. Checkpoint — Pastikan fuzzyEngine berfungsi sebelum integrasi UI
  - Pastikan semua unit test dan property test untuk `fuzzyEngine.js` lulus
  - Verifikasi input normal (batuk=1, sesak=1, SpO2=98) menghasilkan riskScore ≤ 30
  - Verifikasi input kritis (batuk=18, sesak=9, SpO2=75) menghasilkan riskScore ≥ 70
  - Tanyakan ke user jika ada pertanyaan sebelum melanjutkan

- [ ] 10. Integrasikan Fuzzy Engine ke alur Diagnosis (`src/pages/Diagnosis.jsx`)
  - Import `fuzzyEngine` dari `../services/fuzzyEngine`
  - Tambahkan state `fuzzyInputs` (`{ coughFrequency: 5, breathlessnessLevel: 3, spo2Level: 95 }`) dan `fuzzyResult` (null)
  - Tambahkan state `showFuzzyForm` yang menjadi `true` saat `currentNode.type === 'result'`
  - Buat komponen inline `FuzzyAssessmentForm` di dalam `Diagnosis.jsx` (atau sebagai file terpisah `src/components/diagnosis/FuzzyAssessmentForm.jsx`) yang menampilkan tiga slider/input untuk fuzzy inputs
  - Tampilkan `FuzzyAssessmentForm` di bawah `ClinicalAnalysis` saat `isResult === true`
  - Saat user mengubah input fuzzy, panggil `fuzzyEngine.assess(fuzzyInputs)` secara real-time dan simpan hasilnya ke `fuzzyResult`
  - Tampilkan `riskScore` sebagai progress bar dengan warna dinamis (hijau/kuning/oranye/merah sesuai `riskLevel`)
  - Tampilkan `riskLevel` dan penjelasan singkat dalam bahasa Indonesia
  - Update `saveDiagnosis` call di `useEffect` agar menyertakan `riskScore` dan `riskLevel` dari `fuzzyResult` (atau `null` jika belum diisi)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 10.1 Tulis property test: Warna gauge sesuai risk level
    - **Property 19: Warna Gauge Sesuai Risk Level**
    - **Validates: Requirements 9.3**
    - Test komponen `RiskGauge` (atau inline gauge) dengan semua 4 nilai `riskLevel`

- [x] 11. Buat halaman `src/pages/FuzzyAssessment.jsx` — kalkulator mandiri
  - Buat file `src/pages/FuzzyAssessment.jsx`
  - Implementasikan tiga input interaktif: slider untuk `coughFrequency` (0–20), slider untuk `breathlessnessLevel` (0–10), dan input numerik untuk `spo2Level` (70–100)
  - Implementasikan kalkulasi real-time: setiap kali input berubah, panggil `fuzzyEngine.assess()` dan update tampilan hasil
  - Tampilkan `RiskGauge` — progress bar dengan warna dinamis sesuai `riskLevel`
  - Tampilkan `MembershipChart` — visualisasi sederhana menggunakan Recharts yang menunjukkan derajat keanggotaan untuk setiap input (3 bar chart kecil, satu per variabel input)
  - Implementasikan validasi input: tampilkan pesan error yang sesuai jika nilai di luar range (Requirements 11.1, 11.2, 11.3)
  - Implementasikan tombol "Simpan Assessment" yang memanggil `jsonStore.saveDiagnosisLog()` dengan `finalResult` berisi deskripsi berdasarkan `riskLevel`
  - Implementasikan `AssessmentHistory` — tabel 5 assessment terakhir dari `jsonStore.getDiagnosisLogs(user.id)` yang memiliki `riskScore !== null`
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 11.1, 11.2, 11.3_

  - [ ]* 11.1 Tulis property test: Riwayat assessment menampilkan maksimal 5 terakhir
    - **Property 20: Riwayat Assessment Menampilkan Maksimal 5 Terakhir**
    - **Validates: Requirements 10.6**

- [x] 12. Tambahkan route `/fuzzy-assessment` ke `src/App.jsx`
  - Import `FuzzyAssessment` dari `./pages/FuzzyAssessment`
  - Tambahkan route baru setelah route `/riwayat`:
    ```jsx
    <Route path="/fuzzy-assessment" element={
      <ProtectedRoute allowedRoles={['patient']}>
        <AppShell>
          <FuzzyAssessment />
        </AppShell>
      </ProtectedRoute>
    } />
    ```
  - Tambahkan link navigasi ke `/fuzzy-assessment` di sidebar/navbar `AppShell` untuk user dengan role `patient`
  - _Requirements: 10.1_

- [ ] 13. Setup testing framework (Vitest + fast-check)
  - Install dev dependencies: `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `fast-check`
  - Update `vite.config.js` untuk menambahkan konfigurasi Vitest: `test: { environment: 'jsdom', globals: true, setupFiles: ['./src/__tests__/setup.js'] }`
  - Buat `src/__tests__/setup.js` dengan setup `@testing-library/jest-dom`
  - Buat struktur folder test: `src/__tests__/services/`, `src/__tests__/pages/`, `src/__tests__/components/`, `api/__tests__/`
  - Tambahkan script `"test": "vitest --run"` ke `package.json`
  - _Requirements: (infrastruktur testing)_

  > **Catatan**: Task 13 dapat dikerjakan lebih awal (sebelum task 1) jika ingin TDD. Namun karena testing adalah opsional per workflow, task ini ditempatkan di akhir sebagai referensi setup.

- [x] 14. Final checkpoint — Verifikasi keseluruhan sistem
  - Jalankan `vite build` dan pastikan tidak ada error
  - Pastikan tidak ada `fetch` ke `localhost:5000` di seluruh codebase
  - Pastikan login dengan seed account (`admin@respira.id` / `admin` dan `user@gmail.com` / `user123`) berfungsi
  - Pastikan alur diagnosis lengkap berfungsi dan menyimpan log ke localStorage
  - Pastikan halaman `/fuzzy-assessment` dapat diakses dan kalkulasi real-time berfungsi
  - Tanyakan ke user jika ada pertanyaan sebelum deployment

---

## Notes

- Task bertanda `*` adalah opsional (property-based tests) dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- Checkpoint memastikan validasi inkremental sebelum melanjutkan ke fase berikutnya
- Property tests menggunakan library `fast-check` dengan minimum 100 iterasi per property
- Semua kode menggunakan JavaScript (ES Modules), bukan TypeScript — sesuai dengan codebase yang ada
- `jsonStore.js` adalah satu-satunya file yang boleh mengakses `localStorage` secara langsung; semua komponen lain harus melalui `jsonStore` atau `api`
