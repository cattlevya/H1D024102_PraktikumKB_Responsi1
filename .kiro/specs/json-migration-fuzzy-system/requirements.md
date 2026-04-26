# Requirements Document

## Introduction

Fitur ini mencakup dua perubahan besar pada aplikasi RESPIRA.ID — sistem diagnosis kesehatan paru-paru berbasis React + Vite + Tailwind CSS dengan backend Node.js/Express:

1. **Migrasi Database ke JSON**: Menghapus ketergantungan pada database MySQL/PostgreSQL agar aplikasi dapat di-hosting sepenuhnya di Vercel (frontend) tanpa memerlukan server-side database. Semua data persisten (pengguna, riwayat diagnosis, check-in harian) akan disimpan menggunakan `localStorage` di sisi klien, dengan struktur data yang kompatibel dengan skema JSON yang sudah ada (`db.json`).

2. **Sistem Fuzzy Logic**: Menambahkan modul Fuzzy Logic System (FLS) yang terintegrasi dengan alur diagnosis yang sudah ada. Sistem fuzzy akan menilai tingkat keparahan gejala pernapasan berdasarkan input kuantitatif (frekuensi batuk, tingkat sesak napas, kadar SpO2) dan menghasilkan output berupa skor risiko kontinu serta klasifikasi risiko (Rendah, Sedang, Tinggi, Kritis).

---

## Glossary

- **RESPIRA.ID**: Nama aplikasi sistem diagnosis kesehatan paru-paru.
- **JSON_Store**: Lapisan penyimpanan data berbasis `localStorage` yang menggantikan database SQL.
- **Fuzzy_Engine**: Modul JavaScript murni yang mengimplementasikan logika fuzzy Mamdani untuk penilaian risiko pernapasan.
- **Membership_Function**: Fungsi matematika yang memetakan nilai input ke derajat keanggotaan (0–1) dalam himpunan fuzzy.
- **Defuzzification**: Proses mengubah output fuzzy (himpunan fuzzy) menjadi nilai numerik tunggal (crisp value).
- **SpO2**: Saturasi oksigen darah perifer, diukur dalam persen (%).
- **Risk_Score**: Nilai numerik kontinu (0–100) yang merepresentasikan tingkat risiko pernapasan hasil defuzzifikasi.
- **Risk_Level**: Klasifikasi kategoris dari Risk_Score: Rendah (0–30), Sedang (31–60), Tinggi (61–80), Kritis (81–100).
- **Decision_Tree**: Pohon keputusan berbasis teks yang sudah ada di `src/data/decisionTree.js`.
- **Auth_Service**: Layanan autentikasi yang saat ini menggunakan `authService.js` dan `api.js`.
- **Admin_Dashboard**: Halaman `AdminDashboard.jsx` yang menampilkan statistik sistem.
- **Diagnosis_Log**: Catatan hasil diagnosis yang disimpan per pengguna.
- **Daily_Checkin**: Data check-in harian pengguna berisi skor kesehatan paru.
- **Vercel**: Platform hosting target untuk frontend aplikasi.

---

## Requirements

### Requirement 1: Autentikasi Berbasis JSON_Store (Tanpa Backend)

**User Story:** Sebagai pengguna, saya ingin bisa mendaftar dan masuk ke aplikasi tanpa memerlukan server backend, sehingga aplikasi dapat berjalan sepenuhnya di Vercel.

#### Acceptance Criteria

1. THE JSON_Store SHALL menyimpan data pengguna (id, name, email, password, role, licenseCode) dalam `localStorage` dengan key `respira_users`.
2. WHEN pengguna melakukan registrasi dengan email yang belum terdaftar, THE Auth_Service SHALL membuat entri pengguna baru di JSON_Store dan mengembalikan objek pengguna tanpa field password.
3. IF pengguna melakukan registrasi dengan email yang sudah terdaftar, THEN THE Auth_Service SHALL mengembalikan pesan error `"Email sudah terdaftar."` tanpa membuat entri baru.
4. WHEN pengguna melakukan login dengan email dan password yang cocok, THE Auth_Service SHALL menyimpan data sesi pengguna di `localStorage` dengan key `respira_current_user` dan mengembalikan objek pengguna.
5. IF pengguna melakukan login dengan email atau password yang salah, THEN THE Auth_Service SHALL mengembalikan pesan error `"Email atau password salah."`.
6. WHEN pengguna melakukan logout, THE Auth_Service SHALL menghapus key `respira_current_user` dari `localStorage`.
7. THE JSON_Store SHALL menyertakan data seed awal (akun expert `admin@respira.id` dan akun patient `user@gmail.com`) jika `respira_users` belum ada di `localStorage`.
8. WHERE fitur role `expert` diaktifkan, THE Auth_Service SHALL memvalidasi `licenseCode` yang dimasukkan sesuai dengan daftar kode yang valid sebelum registrasi berhasil.

---

### Requirement 2: Penyimpanan Riwayat Diagnosis di JSON_Store

**User Story:** Sebagai pasien, saya ingin riwayat diagnosis saya tersimpan secara lokal, sehingga saya bisa melihat kembali hasil diagnosis sebelumnya meskipun tidak ada koneksi ke server.

#### Acceptance Criteria

1. WHEN hasil diagnosis tercapai (node bertipe `result` pada Decision_Tree), THE JSON_Store SHALL menyimpan Diagnosis_Log baru dengan field: `id` (UUID), `userId`, `finalResult`, `confidenceScore`, `symptomsSummary`, `riskScore` (dari Fuzzy_Engine), `riskLevel`, dan `createdAt` (ISO timestamp).
2. THE JSON_Store SHALL menyimpan semua Diagnosis_Log dalam `localStorage` dengan key `respira_diagnosis_logs`.
3. WHEN pengguna membuka halaman riwayat, THE JSON_Store SHALL mengembalikan semua Diagnosis_Log milik pengguna yang sedang login, diurutkan berdasarkan `createdAt` secara descending.
4. IF `respira_diagnosis_logs` belum ada di `localStorage`, THEN THE JSON_Store SHALL menginisialisasi dengan array kosong `[]`.
5. THE JSON_Store SHALL membatasi penyimpanan Diagnosis_Log per pengguna maksimal 100 entri; WHEN batas tercapai, THE JSON_Store SHALL menghapus entri terlama sebelum menyimpan entri baru.

---

### Requirement 3: Penyimpanan Data Check-in Harian di JSON_Store

**User Story:** Sebagai pasien, saya ingin data check-in harian saya tersimpan secara lokal, sehingga skor kesehatan paru saya hari ini bisa ditampilkan di dashboard.

#### Acceptance Criteria

1. WHEN pengguna melakukan check-in harian dengan skor tertentu, THE JSON_Store SHALL menyimpan atau memperbarui entri check-in untuk tanggal hari ini dengan field: `id`, `userId`, `score`, dan `checkDate` (format `YYYY-MM-DD`).
2. THE JSON_Store SHALL menyimpan semua data check-in dalam `localStorage` dengan key `respira_checkins`.
3. WHEN sistem memuat dashboard, THE JSON_Store SHALL mengembalikan skor check-in hari ini untuk pengguna yang sedang login, atau `null` jika belum check-in.
4. IF pengguna sudah check-in hari ini dan melakukan check-in lagi, THEN THE JSON_Store SHALL memperbarui skor yang ada (bukan membuat entri baru).

---

### Requirement 4: Penyimpanan Profil Pengguna di JSON_Store

**User Story:** Sebagai pengguna, saya ingin bisa memperbarui profil saya (tinggi, berat, golongan darah, dll.) dan data tersebut tersimpan secara lokal.

#### Acceptance Criteria

1. WHEN pengguna memperbarui profil, THE JSON_Store SHALL memperbarui field profil pengguna (`height`, `weight`, `blood_type`, `birth_date`, `emergency_contact`) pada entri pengguna yang sesuai di `respira_users`.
2. WHEN pengguna membuka halaman profil, THE JSON_Store SHALL mengembalikan data profil lengkap pengguna yang sedang login dari `respira_users`.
3. WHERE pengguna berperan sebagai `expert`, THE JSON_Store SHALL juga menyimpan dan mengembalikan field tambahan: `institution`, `title_degree`, dan `sip_number`.

---

### Requirement 5: Admin Dashboard Berbasis JSON_Store

**User Story:** Sebagai admin/expert, saya ingin melihat statistik sistem yang dihitung dari data lokal, sehingga Admin_Dashboard tetap berfungsi tanpa koneksi database.

#### Acceptance Criteria

1. WHEN Admin_Dashboard dimuat, THE JSON_Store SHALL menghitung dan mengembalikan statistik berikut dari data lokal: total diagnosis hari ini, jumlah kasus kritis (berdasarkan `severity: 'critical'` atau `'high'`), total pengguna terdaftar, dan total seluruh diagnosis.
2. THE JSON_Store SHALL menghasilkan data distribusi penyakit berdasarkan pengelompokan `finalResult` dari semua Diagnosis_Log.
3. THE JSON_Store SHALL menghasilkan data aktivitas 7 hari terakhir berdasarkan `createdAt` dari Diagnosis_Log.
4. IF tidak ada Diagnosis_Log yang tersimpan, THEN THE JSON_Store SHALL mengembalikan nilai default (0 untuk semua counter, array kosong untuk chart data).

---

### Requirement 6: Penghapusan Ketergantungan Backend Server

**User Story:** Sebagai developer, saya ingin menghapus semua panggilan ke Express backend agar aplikasi dapat di-deploy ke Vercel sebagai pure frontend tanpa server.

#### Acceptance Criteria

1. THE Auth_Service SHALL menggantikan semua panggilan `fetch` ke `http://localhost:5000/api/*` dengan operasi langsung ke JSON_Store.
2. THE RESPIRA.ID SHALL mempertahankan fungsionalitas proxy AQI (Air Quality Index) menggunakan Vercel Serverless Functions sebagai pengganti Express route `/api/aqi`.
3. THE RESPIRA.ID SHALL mempertahankan fungsionalitas berita menggunakan Vercel Serverless Functions yang memanggil Gemini AI API sebagai pengganti Express route `/api/news`.
4. WHEN aplikasi di-build dengan `vite build`, THE RESPIRA.ID SHALL menghasilkan output yang dapat di-deploy ke Vercel tanpa error terkait koneksi database atau server backend.
5. THE RESPIRA.ID SHALL menghapus atau menonaktifkan folder `server/` dari proses build Vercel agar tidak menyebabkan konflik deployment.

---

### Requirement 7: Implementasi Fuzzy_Engine — Fuzzifikasi Input

**User Story:** Sebagai sistem, saya ingin mengubah nilai input gejala pernapasan (batuk, sesak, SpO2) menjadi derajat keanggotaan fuzzy, sehingga penilaian risiko bisa dilakukan secara gradual dan tidak biner.

#### Acceptance Criteria

1. THE Fuzzy_Engine SHALL menerima tiga input: `coughFrequency` (frekuensi batuk per hari, 0–20), `breathlessnessLevel` (tingkat sesak napas, skala 0–10), dan `spo2Level` (kadar SpO2, 70–100%).
2. THE Fuzzy_Engine SHALL menghitung derajat keanggotaan `coughFrequency` ke dalam tiga himpunan fuzzy: `rendah` (trapezoid: [0, 0, 2, 5]), `sedang` (segitiga: [3, 8, 13]), dan `tinggi` (trapezoid: [10, 15, 20, 20]).
3. THE Fuzzy_Engine SHALL menghitung derajat keanggotaan `breathlessnessLevel` ke dalam tiga himpunan fuzzy: `ringan` (trapezoid: [0, 0, 2, 4]), `sedang` (segitiga: [3, 5, 7]), dan `berat` (trapezoid: [6, 8, 10, 10]).
4. THE Fuzzy_Engine SHALL menghitung derajat keanggotaan `spo2Level` ke dalam tiga himpunan fuzzy: `normal` (trapezoid: [95, 100, 100, 100]), `rendah` (segitiga: [88, 93, 97]), dan `sangat_rendah` (trapezoid: [70, 70, 85, 92]).
5. IF nilai input berada di luar rentang yang didefinisikan, THEN THE Fuzzy_Engine SHALL mengembalikan error dengan pesan yang menjelaskan batas nilai yang valid.
6. THE Fuzzy_Engine SHALL mengimplementasikan fungsi keanggotaan trapezoid dengan formula: `max(0, min(1, min((x-a)/(b-a), (d-x)/(d-c))))` untuk parameter `[a, b, c, d]`.
7. THE Fuzzy_Engine SHALL mengimplementasikan fungsi keanggotaan segitiga dengan formula: `max(0, min((x-a)/(b-a), (c-x)/(c-b)))` untuk parameter `[a, b, c]`.

---

### Requirement 8: Implementasi Fuzzy_Engine — Inferensi dan Defuzzifikasi

**User Story:** Sebagai sistem, saya ingin menerapkan aturan fuzzy dan menghasilkan skor risiko numerik, sehingga tingkat risiko pernapasan pasien dapat dikuantifikasi secara akurat.

#### Acceptance Criteria

1. THE Fuzzy_Engine SHALL menerapkan minimal 9 aturan inferensi fuzzy (metode Mamdani) yang mencakup kombinasi input untuk menghasilkan output `risikoPernapasan` dalam himpunan: `rendah` (0–30), `sedang` (20–60), `tinggi` (50–80), dan `kritis` (70–100).
2. WHEN semua input menunjukkan kondisi normal (batuk rendah, sesak ringan, SpO2 normal), THE Fuzzy_Engine SHALL menghasilkan Risk_Score ≤ 30 (Rendah).
3. WHEN SpO2 sangat rendah (< 85%) terlepas dari input lain, THE Fuzzy_Engine SHALL menghasilkan Risk_Score ≥ 70 (Tinggi atau Kritis).
4. THE Fuzzy_Engine SHALL menggunakan metode defuzzifikasi Centroid (Center of Gravity) untuk menghasilkan Risk_Score tunggal dari output fuzzy agregat.
5. THE Fuzzy_Engine SHALL mengembalikan objek hasil yang berisi: `riskScore` (number, 0–100), `riskLevel` (string: "Rendah" | "Sedang" | "Tinggi" | "Kritis"), `membershipDegrees` (objek derajat keanggotaan semua input), dan `appliedRules` (array aturan yang aktif beserta kekuatannya).
6. FOR ALL kombinasi input valid, THE Fuzzy_Engine SHALL menghasilkan Risk_Score yang sama ketika dipanggil dengan input yang sama (deterministic/idempotent).
7. THE Fuzzy_Engine SHALL diimplementasikan sebagai modul JavaScript murni (pure functions) tanpa dependensi eksternal, dapat dijalankan di browser maupun Node.js.

---

### Requirement 9: Integrasi Fuzzy_Engine dengan Alur Diagnosis

**User Story:** Sebagai pasien, saya ingin sistem fuzzy menilai gejala saya secara otomatis setelah saya menjawab pertanyaan diagnosis, sehingga saya mendapatkan skor risiko yang lebih akurat dan informatif.

#### Acceptance Criteria

1. WHEN alur diagnosis mencapai node bertipe `result`, THE Diagnosis SHALL secara otomatis menampilkan form input Fuzzy Assessment dengan tiga field: frekuensi batuk (0–20/hari), tingkat sesak (0–10), dan kadar SpO2 (70–100%).
2. WHEN pengguna mengisi dan mengirimkan form Fuzzy Assessment, THE Fuzzy_Engine SHALL menghitung Risk_Score dan Risk_Level, lalu hasilnya ditampilkan berdampingan dengan hasil Decision_Tree.
3. THE Diagnosis SHALL menampilkan Risk_Score sebagai gauge/progress bar visual dengan warna: hijau (Rendah), kuning (Sedang), oranye (Tinggi), merah (Kritis).
4. WHEN Diagnosis_Log disimpan ke JSON_Store, THE JSON_Store SHALL menyertakan `riskScore` dan `riskLevel` dari Fuzzy_Engine dalam entri log.
5. IF pengguna tidak mengisi form Fuzzy Assessment, THEN THE Diagnosis SHALL menyimpan Diagnosis_Log tanpa `riskScore` dan `riskLevel` (field bernilai `null`).
6. THE Diagnosis SHALL menampilkan penjelasan singkat tentang arti Risk_Level dalam bahasa Indonesia yang mudah dipahami pasien.

---

### Requirement 10: Halaman Fuzzy Assessment Mandiri

**User Story:** Sebagai pasien, saya ingin bisa mengakses kalkulator risiko pernapasan berbasis fuzzy secara mandiri tanpa harus melalui alur diagnosis lengkap, sehingga saya bisa memantau kondisi saya sehari-hari.

#### Acceptance Criteria

1. THE RESPIRA.ID SHALL menyediakan halaman `/fuzzy-assessment` yang dapat diakses oleh pengguna dengan role `patient`.
2. THE Fuzzy Assessment Page SHALL menampilkan tiga input interaktif: slider untuk frekuensi batuk (0–20), slider untuk tingkat sesak (0–10), dan input numerik untuk SpO2 (70–100%).
3. WHEN pengguna mengubah nilai input, THE Fuzzy Assessment Page SHALL menampilkan hasil Risk_Score dan Risk_Level secara real-time (tanpa perlu menekan tombol submit).
4. THE Fuzzy Assessment Page SHALL menampilkan visualisasi membership function untuk setiap input, menunjukkan posisi nilai saat ini pada kurva fuzzy.
5. WHEN pengguna menyimpan hasil assessment, THE JSON_Store SHALL menyimpan hasil sebagai Diagnosis_Log dengan `finalResult` berisi deskripsi singkat kondisi berdasarkan Risk_Level.
6. THE Fuzzy Assessment Page SHALL menampilkan riwayat 5 assessment terakhir pengguna dalam bentuk tabel ringkas.

---

### Requirement 11: Validasi Input dan Penanganan Error

**User Story:** Sebagai pengguna, saya ingin sistem memberikan umpan balik yang jelas ketika saya memasukkan data yang tidak valid, sehingga saya tidak mendapatkan hasil yang salah.

#### Acceptance Criteria

1. IF nilai SpO2 yang dimasukkan kurang dari 70 atau lebih dari 100, THEN THE Fuzzy Assessment Page SHALL menampilkan pesan error `"Nilai SpO2 harus antara 70–100%"` dan menonaktifkan kalkulasi.
2. IF nilai frekuensi batuk yang dimasukkan kurang dari 0 atau lebih dari 20, THEN THE Fuzzy Assessment Page SHALL menampilkan pesan error `"Frekuensi batuk harus antara 0–20 kali/hari"`.
3. IF nilai tingkat sesak yang dimasukkan kurang dari 0 atau lebih dari 10, THEN THE Fuzzy Assessment Page SHALL menampilkan pesan error `"Tingkat sesak harus antara 0–10"`.
4. WHEN operasi baca/tulis ke JSON_Store gagal (misalnya `localStorage` penuh atau dinonaktifkan), THE JSON_Store SHALL mengembalikan objek error dengan field `success: false` dan `message` yang deskriptif, tanpa melempar exception yang tidak tertangani.
5. IF `localStorage` tidak tersedia di browser pengguna, THEN THE RESPIRA.ID SHALL menampilkan notifikasi bahwa fitur penyimpanan data tidak tersedia dan menyarankan pengguna untuk mengaktifkan `localStorage`.

---

### Requirement 12: Kompatibilitas dan Performa

**User Story:** Sebagai pengguna, saya ingin aplikasi tetap responsif dan cepat meskipun menggunakan penyimpanan lokal, sehingga pengalaman penggunaan tidak terganggu.

#### Acceptance Criteria

1. WHEN Fuzzy_Engine menghitung Risk_Score, THE Fuzzy_Engine SHALL menyelesaikan kalkulasi dalam waktu kurang dari 50 milidetik untuk setiap set input.
2. WHEN JSON_Store membaca atau menulis data, THE JSON_Store SHALL menyelesaikan operasi dalam waktu kurang dari 100 milidetik untuk dataset hingga 100 entri Diagnosis_Log.
3. THE RESPIRA.ID SHALL kompatibel dengan browser modern (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) yang mendukung `localStorage` dan ES2020.
4. THE JSON_Store SHALL menggunakan format JSON yang valid dan dapat di-parse ulang tanpa kehilangan data (round-trip property: `JSON.parse(JSON.stringify(data))` menghasilkan data yang ekuivalen).
