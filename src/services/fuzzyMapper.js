/**
 * fuzzyMapper.js
 * Memetakan jawaban dari decision tree (objek `answers`) ke input fuzzy engine.
 *
 * `answers` adalah objek { nodeId: selectedOption } yang dikumpulkan selama alur diagnosis.
 * Setiap option memiliki `value` (string) yang kita gunakan untuk inferensi.
 */

/**
 * Ekstrak input fuzzy dari jawaban diagnosis.
 *
 * @param {object} answers - { [nodeId]: { label, value, next } }
 * @param {object} resultNode - node hasil diagnosis (type: 'result')
 * @returns {{ coughFrequency: number, breathlessnessLevel: number, spo2Level: number, confidence: number }}
 *   confidence: 0–1, seberapa yakin mapping ini (1 = semua 3 variabel terpetakan dari jawaban eksplisit)
 */
export function mapAnswersToFuzzyInputs(answers, resultNode) {
  let coughFrequency = null;
  let breathlessnessLevel = null;
  let spo2Level = null;

  // ─── 1. SpO2 — dari triase (node 'start') ────────────────────────────────
  const startAnswer = answers['start'];
  if (startAnswer) {
    if (startAnswer.value === 'low_spo2') {
      // User memilih "Saturasi Oksigen < 90%"
      spo2Level = 87;
    } else if (startAnswer.value === 'cyanosis') {
      // Sianosis → SpO2 sangat rendah
      spo2Level = 78;
    } else if (startAnswer.value === 'tachypnea' || startAnswer.value === 'cant_speak') {
      // Napas sangat cepat / tidak bisa bicara → SpO2 rendah
      spo2Level = 88;
    } else if (startAnswer.value === 'safe') {
      // Tidak ada tanda bahaya → SpO2 normal
      spo2Level = 97;
    }
  }

  // ─── 2. Batuk — dari berbagai node batuk ─────────────────────────────────

  // Durasi batuk
  const coughDuration = answers['cough_duration']?.value;
  // Jenis dahak
  const sputumType = answers['cough_sputum_check']?.value || answers['cough_chronic_sputum_check']?.value;
  // Gejala penyerta
  const productiveSymptoms = answers['cough_productive_symptoms']?.value;
  // Apakah batuk lebih sering (dari aco_sputum_check)
  const coughMore = answers['aco_sputum_check']?.value;

  // Estimasi frekuensi batuk berdasarkan kombinasi jawaban
  if (coughDuration === 'chronic' && sputumType === 'productive') {
    coughFrequency = 14; // batuk kronis berdahak banyak → tinggi
  } else if (coughDuration === 'chronic') {
    coughFrequency = 10;
  } else if (coughDuration === 'subacute') {
    coughFrequency = 8;
  } else if (coughDuration === 'acute') {
    coughFrequency = 5;
  } else if (coughMore === 'productive') {
    coughFrequency = 12;
  } else if (coughMore === 'dry') {
    coughFrequency = 8;
  }

  // Jika batuk berdarah → frekuensi sedang-tinggi
  if (sputumType === 'blood') {
    coughFrequency = Math.max(coughFrequency ?? 0, 12);
  }

  // Jika keluhan utama bukan batuk → frekuensi rendah
  const mainComplaint = answers['main_complaint']?.value;
  if (mainComplaint === 'sesak' || mainComplaint === 'nyeri') {
    coughFrequency = coughFrequency ?? 2;
  }

  // ─── 3. Sesak Napas — dari berbagai node sesak ───────────────────────────

  const dyspneaOnset = answers['dyspnea_onset']?.value;
  const acoActivity = answers['aco_activity_check']?.value;
  const copdSeverity = answers['copd_severity_check']?.value;
  const dyspneaHeart = answers['dyspnea_heart_check']?.value;
  const dyspneaSwelling = answers['dyspnea_heart_swelling']?.value;

  if (acoActivity === 'severe') {
    // Tidak bisa bicara kalimat penuh → sesak berat
    breathlessnessLevel = 8.5;
  } else if (acoActivity === 'moderate') {
    breathlessnessLevel = 6;
  } else if (copdSeverity === 'severe') {
    // Hanya bisa di dalam rumah
    breathlessnessLevel = 8;
  } else if (copdSeverity === 'moderate') {
    breathlessnessLevel = 5;
  } else if (dyspneaOnset === 'acute') {
    breathlessnessLevel = 7;
  } else if (dyspneaOnset === 'chronic') {
    breathlessnessLevel = 5;
  } else if (dyspneaHeart === 'orthopnea') {
    breathlessnessLevel = 7;
  } else if (mainComplaint === 'sesak') {
    breathlessnessLevel = 6; // default jika sesak adalah keluhan utama
  }

  // Jika ada edema → sesak lebih berat
  if (dyspneaSwelling === 'edema' || answers['copd_overlap_check']?.value === 'edema') {
    breathlessnessLevel = Math.max(breathlessnessLevel ?? 0, 7);
  }

  // ─── 4. Inferensi dari node hasil (severity) ─────────────────────────────
  // Jika ada nilai yang masih null, gunakan severity dari result node sebagai fallback

  if (resultNode?.severity) {
    const severityDefaults = {
      critical: { cough: 18, breath: 9, spo2: 78 },
      high:     { cough: 14, breath: 7, spo2: 88 },
      moderate: { cough: 8,  breath: 5, spo2: 93 },
      low:      { cough: 3,  breath: 2, spo2: 97 },
    };
    const defaults = severityDefaults[resultNode.severity] || severityDefaults.moderate;

    if (coughFrequency === null) coughFrequency = defaults.cough;
    if (breathlessnessLevel === null) breathlessnessLevel = defaults.breath;
    if (spo2Level === null) spo2Level = defaults.spo2;
  }

  // ─── 5. Nilai akhir dengan batas valid ───────────────────────────────────
  const finalCough = Math.min(20, Math.max(0, coughFrequency ?? 5));
  const finalBreath = Math.min(10, Math.max(0, breathlessnessLevel ?? 3));
  const finalSpo2 = Math.min(100, Math.max(70, spo2Level ?? 95));

  // Hitung confidence: berapa banyak variabel yang terpetakan dari jawaban eksplisit
  const explicitCount = [
    coughFrequency !== null,
    breathlessnessLevel !== null,
    spo2Level !== null,
  ].filter(Boolean).length;
  const confidence = explicitCount / 3;

  return {
    coughFrequency: finalCough,
    breathlessnessLevel: finalBreath,
    spo2Level: finalSpo2,
    confidence,
    // Metadata untuk ditampilkan ke user
    sources: {
      cough: coughFrequency !== null ? 'dari jawaban diagnosis' : 'estimasi dari tingkat keparahan',
      breath: breathlessnessLevel !== null ? 'dari jawaban diagnosis' : 'estimasi dari tingkat keparahan',
      spo2: spo2Level !== null ? 'dari jawaban diagnosis' : 'estimasi dari tingkat keparahan',
    },
  };
}
