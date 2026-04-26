/**
 * fuzzyEngine.js — Sistem Fuzzy Logic Mamdani untuk Penilaian Risiko Pernapasan
 *
 * Input:
 *   coughFrequency      — frekuensi batuk per hari (0–20)
 *   breathlessnessLevel — tingkat sesak napas (0–10)
 *   spo2Level           — kadar SpO2 / saturasi oksigen (70–100%)
 *
 * Output:
 *   riskScore  — skor risiko kontinu (0–100)
 *   riskLevel  — "Rendah" | "Sedang" | "Tinggi" | "Kritis"
 *
 * Metode: Mamdani + defuzzifikasi Centroid (Center of Gravity)
 * Pure ES module — tidak ada dependensi eksternal.
 */

// ─── Fungsi Keanggotaan Primitif ─────────────────────────────────────────────

/**
 * Fungsi keanggotaan trapezoid.
 * @param {number} x  - nilai input
 * @param {number} a  - kaki kiri bawah
 * @param {number} b  - kaki kiri atas (plateau mulai)
 * @param {number} c  - kaki kanan atas (plateau selesai)
 * @param {number} d  - kaki kanan bawah
 * @returns {number} derajat keanggotaan [0, 1]
 */
export function trapezoid(x, a, b, c, d) {
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x < b) {
    const denom = b - a;
    return denom === 0 ? 1 : Math.max(0, Math.min(1, (x - a) / denom));
  }
  // x > c
  const denom = d - c;
  return denom === 0 ? 1 : Math.max(0, Math.min(1, (d - x) / denom));
}

/**
 * Fungsi keanggotaan segitiga.
 * @param {number} x  - nilai input
 * @param {number} a  - kaki kiri
 * @param {number} b  - puncak
 * @param {number} c  - kaki kanan
 * @returns {number} derajat keanggotaan [0, 1]
 */
export function triangle(x, a, b, c) {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x < b) {
    const denom = b - a;
    return denom === 0 ? 1 : Math.max(0, Math.min(1, (x - a) / denom));
  }
  const denom = c - b;
  return denom === 0 ? 1 : Math.max(0, Math.min(1, (c - x) / denom));
}

// ─── Fuzzifikasi Input ────────────────────────────────────────────────────────

/**
 * Fuzzifikasi frekuensi batuk (0–20 kali/hari).
 */
export function fuzzifyCough(value) {
  return {
    rendah: trapezoid(value, -1, 0, 2, 5),   // [0,0,2,5] — diperluas ke -1 agar x=0 masuk
    sedang: triangle(value, 3, 8, 13),
    tinggi: trapezoid(value, 10, 15, 21, 21), // [10,15,20,20] — diperluas ke 21
  };
}

/**
 * Fuzzifikasi tingkat sesak napas (0–10).
 */
export function fuzzifyBreathlessness(value) {
  return {
    ringan: trapezoid(value, -1, 0, 2, 4),
    sedang: triangle(value, 3, 5, 7),
    berat: trapezoid(value, 6, 8, 11, 11),
  };
}

/**
 * Fuzzifikasi kadar SpO2 (70–100%).
 * Catatan: SpO2 tinggi = normal (risiko rendah), SpO2 rendah = risiko tinggi.
 */
export function fuzzifySpO2(value) {
  return {
    normal: trapezoid(value, 94, 96, 101, 101),
    rendah: triangle(value, 88, 93, 97),
    sangat_rendah: trapezoid(value, 69, 70, 85, 92),
  };
}

// ─── Aturan Inferensi Mamdani ─────────────────────────────────────────────────

/**
 * Himpunan fuzzy output — risikoPernapasan (0–100).
 * Setiap himpunan didefinisikan sebagai trapezoid [a, b, c, d].
 */
const OUTPUT_SETS = {
  rendah: [0, 0, 15, 30],
  sedang: [20, 35, 45, 60],
  tinggi: [50, 60, 70, 80],
  kritis: [70, 85, 100, 101], // diperluas ke 101 agar x=100 masuk
};

/**
 * 12 aturan inferensi Mamdani.
 * Setiap aturan: { antecedents: [[variabel, himpunan], ...], consequent: himpunan_output }
 * Operator AND = minimum dari semua anteseden.
 */
const RULES = [
  // R1: batuk rendah ∧ sesak ringan ∧ SpO2 normal → risiko rendah
  { id: 'R1', ant: [['cough', 'rendah'], ['breath', 'ringan'], ['spo2', 'normal']], con: 'rendah' },
  // R2: batuk rendah ∧ sesak ringan ∧ SpO2 rendah → risiko sedang
  { id: 'R2', ant: [['cough', 'rendah'], ['breath', 'ringan'], ['spo2', 'rendah']], con: 'sedang' },
  // R3: batuk rendah ∧ sesak sedang ∧ SpO2 normal → risiko sedang
  { id: 'R3', ant: [['cough', 'rendah'], ['breath', 'sedang'], ['spo2', 'normal']], con: 'sedang' },
  // R4: batuk sedang ∧ sesak sedang ∧ SpO2 normal → risiko sedang
  { id: 'R4', ant: [['cough', 'sedang'], ['breath', 'sedang'], ['spo2', 'normal']], con: 'sedang' },
  // R5: batuk sedang ∧ sesak sedang ∧ SpO2 rendah → risiko tinggi
  { id: 'R5', ant: [['cough', 'sedang'], ['breath', 'sedang'], ['spo2', 'rendah']], con: 'tinggi' },
  // R6: batuk sedang ∧ sesak berat ∧ SpO2 rendah → risiko tinggi
  { id: 'R6', ant: [['cough', 'sedang'], ['breath', 'berat'], ['spo2', 'rendah']], con: 'tinggi' },
  // R7: batuk tinggi ∧ sesak berat ∧ SpO2 rendah → risiko kritis
  { id: 'R7', ant: [['cough', 'tinggi'], ['breath', 'berat'], ['spo2', 'rendah']], con: 'kritis' },
  // R8: batuk tinggi ∧ sesak berat ∧ SpO2 sangat rendah → risiko kritis
  { id: 'R8', ant: [['cough', 'tinggi'], ['breath', 'berat'], ['spo2', 'sangat_rendah']], con: 'kritis' },
  // R9: batuk rendah ∧ sesak ringan ∧ SpO2 sangat rendah → risiko tinggi (SpO2 kritis override)
  { id: 'R9', ant: [['cough', 'rendah'], ['breath', 'ringan'], ['spo2', 'sangat_rendah']], con: 'tinggi' },
  // R10: batuk sedang ∧ sesak ringan ∧ SpO2 sangat rendah → risiko tinggi
  { id: 'R10', ant: [['cough', 'sedang'], ['breath', 'ringan'], ['spo2', 'sangat_rendah']], con: 'tinggi' },
  // R11: batuk tinggi ∧ sesak sedang ∧ SpO2 normal → risiko tinggi
  { id: 'R11', ant: [['cough', 'tinggi'], ['breath', 'sedang'], ['spo2', 'normal']], con: 'tinggi' },
  // R12: batuk tinggi ∧ sesak sedang ∧ SpO2 rendah → risiko kritis
  { id: 'R12', ant: [['cough', 'tinggi'], ['breath', 'sedang'], ['spo2', 'rendah']], con: 'kritis' },
];

/**
 * Terapkan semua aturan inferensi.
 * @param {object} coughMem   - derajat keanggotaan batuk
 * @param {object} breathMem  - derajat keanggotaan sesak
 * @param {object} spo2Mem    - derajat keanggotaan SpO2
 * @returns {Array} aturan aktif dengan kekuatannya
 */
export function applyRules(coughMem, breathMem, spo2Mem) {
  const membershipMap = {
    cough: coughMem,
    breath: breathMem,
    spo2: spo2Mem,
  };

  const activeRules = [];

  for (const rule of RULES) {
    // Hitung kekuatan aturan = minimum semua anteseden (operator AND)
    const strength = rule.ant.reduce((min, [variable, set]) => {
      const degree = membershipMap[variable]?.[set] ?? 0;
      return Math.min(min, degree);
    }, 1);

    if (strength > 0) {
      activeRules.push({
        rule: rule.id,
        strength,
        output: rule.con,
      });
    }
  }

  return activeRules;
}

// ─── Defuzzifikasi Centroid ───────────────────────────────────────────────────

/**
 * Defuzzifikasi menggunakan metode Centroid (Center of Gravity).
 * Agregasi output: untuk setiap himpunan output, ambil max dari semua aturan yang menuju ke sana.
 * Sampling 200 titik di range [0, 100].
 *
 * @param {Array} ruleResults - hasil dari applyRules()
 * @returns {number} crisp value (0–100)
 */
export function defuzzifyCentroid(ruleResults) {
  if (ruleResults.length === 0) return 0;

  // Agregasi: max strength per himpunan output
  const outputStrengths = {};
  for (const { output, strength } of ruleResults) {
    outputStrengths[output] = Math.max(outputStrengths[output] || 0, strength);
  }

  // Sampling centroid
  const SAMPLES = 200;
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i <= SAMPLES; i++) {
    const x = (i / SAMPLES) * 100;

    // Hitung nilai membership agregat di titik x (max dari semua output sets yang aktif)
    let aggregated = 0;
    for (const [setName, strength] of Object.entries(outputStrengths)) {
      const [a, b, c, d] = OUTPUT_SETS[setName];
      const mu = trapezoid(x, a, b, c, d);
      // Clamp ke kekuatan aturan (metode Mamdani: min)
      aggregated = Math.max(aggregated, Math.min(mu, strength));
    }

    numerator += x * aggregated;
    denominator += aggregated;
  }

  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 10) / 10; // 1 desimal
}

// ─── Klasifikasi Risk Level ───────────────────────────────────────────────────

/**
 * Konversi riskScore ke label Risk Level.
 */
export function getRiskLevel(score) {
  if (score <= 30) return 'Rendah';
  if (score <= 60) return 'Sedang';
  if (score <= 80) return 'Tinggi';
  return 'Kritis';
}

/**
 * Deskripsi singkat per Risk Level dalam Bahasa Indonesia.
 */
export function getRiskDescription(riskLevel) {
  const descriptions = {
    Rendah:
      'Kondisi pernapasan Anda tampak baik. Pertahankan gaya hidup sehat dan lakukan pemeriksaan rutin.',
    Sedang:
      'Terdapat beberapa gejala yang perlu diperhatikan. Konsultasikan dengan dokter jika gejala berlanjut lebih dari 3 hari.',
    Tinggi:
      'Gejala pernapasan Anda cukup serius. Segera konsultasikan dengan dokter atau kunjungi fasilitas kesehatan terdekat.',
    Kritis:
      'PERHATIAN: Kondisi pernapasan Anda memerlukan penanganan medis segera. Hubungi layanan darurat atau pergi ke IGD.',
  };
  return descriptions[riskLevel] || '';
}

/**
 * Warna indikator per Risk Level (Tailwind CSS classes).
 */
export function getRiskColor(riskLevel) {
  const colors = {
    Rendah: { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500', hex: '#22c55e' },
    Sedang: { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'bg-yellow-500', hex: '#eab308' },
    Tinggi: { bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-500', hex: '#f97316' },
    Kritis: { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500', hex: '#ef4444' },
  };
  return colors[riskLevel] || colors.Rendah;
}

// ─── Entry Point Utama ────────────────────────────────────────────────────────

/**
 * Jalankan pipeline fuzzy lengkap.
 *
 * @param {{ coughFrequency: number, breathlessnessLevel: number, spo2Level: number }} inputs
 * @returns {object} FuzzyResult atau { success: false, message: string }
 */
export function assess(inputs) {
  const { coughFrequency, breathlessnessLevel, spo2Level } = inputs;

  // Validasi input
  if (coughFrequency < 0 || coughFrequency > 20) {
    return { success: false, message: 'Frekuensi batuk harus antara 0–20 kali/hari' };
  }
  if (breathlessnessLevel < 0 || breathlessnessLevel > 10) {
    return { success: false, message: 'Tingkat sesak harus antara 0–10' };
  }
  if (spo2Level < 70 || spo2Level > 100) {
    return { success: false, message: 'Nilai SpO2 harus antara 70–100%' };
  }

  // 1. Fuzzifikasi
  const coughMem = fuzzifyCough(coughFrequency);
  const breathMem = fuzzifyBreathlessness(breathlessnessLevel);
  const spo2Mem = fuzzifySpO2(spo2Level);

  // 2. Inferensi
  const appliedRules = applyRules(coughMem, breathMem, spo2Mem);

  // 3. Defuzzifikasi
  const riskScore = defuzzifyCentroid(appliedRules);

  // 4. Klasifikasi
  const riskLevel = getRiskLevel(riskScore);

  return {
    success: true,
    riskScore,
    riskLevel,
    membershipDegrees: {
      cough: coughMem,
      breathlessness: breathMem,
      spo2: spo2Mem,
    },
    appliedRules,
  };
}

// ─── Export sebagai objek (untuk kompatibilitas) ──────────────────────────────

export const fuzzyEngine = {
  trapezoid,
  triangle,
  fuzzifyCough,
  fuzzifyBreathlessness,
  fuzzifySpO2,
  applyRules,
  defuzzifyCentroid,
  getRiskLevel,
  getRiskDescription,
  getRiskColor,
  assess,
};

export default fuzzyEngine;
