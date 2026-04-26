/**
 * Netlify Function — /api/news
 * Generate berita kesehatan pernapasan via Google Gemini AI.
 * Env var: GEMINI_API_KEY (set di Netlify Dashboard > Site Settings > Environment Variables)
 */

const FALLBACK_NEWS = [
  {
    title: 'Pentingnya Deteksi Dini Penyakit Paru Obstruktif Kronik (PPOK)',
    summary:
      'PPOK adalah penyakit paru yang dapat dicegah dan diobati. Deteksi dini melalui spirometri sangat dianjurkan bagi perokok aktif di atas 40 tahun.',
    source: 'RESPIRA.ID Health Digest',
    date: new Date().toISOString().split('T')[0],
  },
  {
    title: 'Kualitas Udara dan Risiko Asma: Apa yang Perlu Anda Ketahui',
    summary:
      'Paparan polutan udara seperti PM2.5 dan ozon dapat memicu serangan asma. Pantau indeks kualitas udara harian dan hindari aktivitas luar ruangan saat AQI di atas 100.',
    source: 'RESPIRA.ID Health Digest',
    date: new Date().toISOString().split('T')[0],
  },
  {
    title: 'Latihan Pernapasan Diafragma untuk Kesehatan Paru Optimal',
    summary:
      'Latihan pernapasan diafragma selama 10 menit sehari terbukti meningkatkan kapasitas paru dan mengurangi sesak napas pada pasien PPOK dan asma.',
    source: 'RESPIRA.ID Health Digest',
    date: new Date().toISOString().split('T')[0],
  },
];

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: FALLBACK_NEWS }),
    };
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const prompt = `Kamu adalah jurnalis kesehatan Indonesia. Buat 3 artikel berita singkat tentang kesehatan pernapasan (ISPA, Asma, PPOK, TBC, Pneumonia, kualitas udara) yang relevan dan informatif. Format respons sebagai JSON array dengan field: title (string), summary (string, maks 80 kata), source (string, nama media), date (string, format YYYY-MM-DD). Tanggal hari ini: ${today}. Balas HANYA dengan JSON array, tanpa teks lain.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!res.ok) throw new Error(`Gemini error: ${res.status}`);

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Format tidak valid');

    const articles = JSON.parse(jsonMatch[0]);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: articles }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: FALLBACK_NEWS }),
    };
  }
};
