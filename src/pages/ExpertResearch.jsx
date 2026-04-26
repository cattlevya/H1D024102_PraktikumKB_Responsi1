import React, { useState } from 'react';
import { Brain, Search, Check, X, FileText, Loader2, Sparkles, ArrowRight, GitMerge } from 'lucide-react';
import LogicManager from '../components/expert/LogicManager';
import { decisionTree } from '../data/decisionTree';
import { GoogleGenerativeAI } from '@google/generative-ai';

const ExpertResearch = () => {
    const [activeTab, setActiveTab] = useState('research');
    const [loading, setLoading] = useState(false);
    const [drafts, setDrafts] = useState([]);
    const [error, setError] = useState(null);

    const handleAutoResearch = async () => {
        setLoading(true);
        setError(null);
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error('VITE_GEMINI_API_KEY tidak dikonfigurasi.');

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const prompt = `Kamu adalah asisten riset medis. Berikan 3 temuan terbaru (2024-2025) tentang penyakit pernapasan (ISPA, Asma, PPOK, TBC, Pneumonia) dalam format JSON array. Setiap item harus memiliki field: name (string), type ("symptom" atau "rule"), clinical_evidence (string, maks 100 kata), suggested_action (string), source_journal (string). Balas HANYA dengan JSON array, tanpa teks lain.`;

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error('Format respons AI tidak valid.');

            const data = JSON.parse(jsonMatch[0]);
            setDrafts(prev => [...data, ...prev]);
        } catch (err) {
            console.error(err);
            setError('Gagal melakukan riset: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = (draft, index) => {
        // Simpan ke localStorage sebagai knowledge base lokal
        try {
            const existing = JSON.parse(localStorage.getItem('respira_knowledge_base') || '[]');
            existing.push({ ...draft, approvedAt: new Date().toISOString() });
            localStorage.setItem('respira_knowledge_base', JSON.stringify(existing));
            alert('Data berhasil ditambahkan ke basis pengetahuan lokal!');
            setDrafts(prev => prev.filter((_, i) => i !== index));
        } catch {
            alert('Gagal menyimpan data.');
        }
    };

    const handleReject = (index) => {
        if (window.confirm('Hapus draft riset ini?')) {
            setDrafts(prev => prev.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="text-center space-y-4 py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-2">
                    <Brain className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Expert Knowledge Center</h1>
                <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                    Pusat kendali pengetahuan medis AI. Kelola logika diagnosis secara manual atau gunakan AI untuk riset otomatis.
                </p>
            </div>

            {/* TABS */}
            <div className="flex justify-center mb-8">
                <div className="bg-slate-100 p-1 rounded-xl inline-flex">
                    <button
                        onClick={() => setActiveTab('research')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'research' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Autonomous Research
                    </button>
                    <button
                        onClick={() => setActiveTab('logic')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'logic' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Logic Management (Tree Editor)
                    </button>
                </div>
            </div>

            {activeTab === 'research' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Auto-Research Trigger */}
                    <div className="flex justify-center mb-12">
                        <button
                            onClick={handleAutoResearch}
                            disabled={loading}
                            className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out skew-x-12 -translate-x-full"></div>
                            <div className="flex items-center space-x-3 text-lg font-semibold">
                                {loading ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span>AI Sedang Memindai Jurnal Global...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-6 h-6" />
                                        <span>MULAI RISET OTOMATIS (2024-2025)</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </div>
                        </button>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-center border border-red-100 mb-8">
                            {error}
                        </div>
                    )}

                    {/* Drafts List */}
                    <div className="space-y-6">
                        {drafts.length > 0 && (
                            <div className="flex items-center space-x-2 text-slate-800 font-bold text-xl px-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <h2>Hasil Temuan ({drafts.length})</h2>
                            </div>
                        )}

                        {drafts.map((draft, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-300">
                                <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-6">
                                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                                        <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center ${draft.type === 'symptom' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                                            {draft.type === 'symptom' ? <GitMerge className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h3 className="font-bold text-slate-900 text-lg leading-tight">{draft.name || 'Temuan Baru'}</h3>
                                                <span className={`flex-shrink-0 px-2 py-0.5 text-xs rounded-full font-bold uppercase tracking-wider whitespace-nowrap ${draft.type === 'symptom' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                                                    {draft.type === 'symptom' ? 'Gejala Baru' : 'Aturan Logika'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium truncate">Sumber: {draft.source_journal || 'Analisis AI General'}</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-3 flex-shrink-0 w-full md:w-auto justify-end items-center">
                                        <button
                                            onClick={() => handleReject(index)}
                                            className="h-10 px-4 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-red-600 font-medium transition-colors flex items-center justify-center whitespace-nowrap"
                                        >
                                            <X className="w-4 h-4 mr-2" /> Tolak
                                        </button>
                                        <button
                                            onClick={() => handleApprove(draft, index)}
                                            className="h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center shadow-sm shadow-blue-200 whitespace-nowrap"
                                        >
                                            <Check className="w-4 h-4 mr-2" /> Setujui & Gabung
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Bukti Klinis & Analisis</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            {draft.clinical_evidence}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Usulan Implementasi</h4>
                                        <div className="bg-white p-3 rounded-lg border border-slate-200 overflow-x-auto">
                                            <p className="text-sm text-slate-800 font-medium mb-2">{draft.suggested_action}</p>
                                            {draft.proposed_node && (
                                                <div className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 whitespace-pre">
                                                    {JSON.stringify(draft.proposed_node, null, 2)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <LogicManager initialTree={decisionTree} />
                </div>
            )
            }
        </div >
    );
};

export default ExpertResearch;

