import React, { useState } from 'react';
import { Database, Plus, Trash2, Edit2, Save, GitMerge, Brain, FileText, Check, X, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import LogicManager from '../components/expert/LogicManager';
import { decisionTree } from '../data/decisionTree';
import { GoogleGenerativeAI } from '@google/generative-ai';

const KnowledgeManager = () => {
    const [activeTab, setActiveTab] = useState('logic');
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
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Expert Knowledge Center</h1>
                    <p className="text-slate-500">Pusat kendali logika diagnosis dan riset medis otonom.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[80vh]">
                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50">
                    <button
                        onClick={() => setActiveTab('logic')}
                        className={clsx(
                            "px-6 py-4 text-sm font-bold transition-colors border-b-2 flex items-center gap-2",
                            activeTab === 'logic' ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        )}
                    >
                        <Database className="w-4 h-4" />
                        Manajemen Logika (Decision Tree)
                    </button>
                    <button
                        onClick={() => setActiveTab('research')}
                        className={clsx(
                            "px-6 py-4 text-sm font-bold transition-colors border-b-2 flex items-center gap-2",
                            activeTab === 'research' ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        )}
                    >
                        <Brain className="w-4 h-4" />
                        Autonomous Research
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'logic' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <LogicManager initialTree={decisionTree} />
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                            {/* Auto-Research Trigger */}
                            <div className="flex justify-center py-8">
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
                                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-center border border-red-100">
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
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-start space-x-4">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${draft.type === 'symptom' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                                                    {draft.type === 'symptom' ? <GitMerge className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <h3 className="font-bold text-slate-900 text-lg">{draft.name || 'Temuan Baru'}</h3>
                                                        <span className={`px-2 py-0.5 text-xs rounded-full font-bold uppercase tracking-wider ${draft.type === 'symptom' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                                                            {draft.type === 'symptom' ? 'Gejala Baru' : 'Aturan Logika'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-500 font-medium">Sumber: {draft.source_journal || 'Analisis AI General'}</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={() => handleReject(index)}
                                                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-red-600 font-medium transition-colors flex items-center"
                                                >
                                                    <X className="w-4 h-4 mr-2" /> Tolak
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(draft, index)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center shadow-sm shadow-blue-200"
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
                                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                    <p className="text-sm text-slate-800 font-medium mb-2">{draft.suggested_action}</p>
                                                    {draft.proposed_node && (
                                                        <div className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default KnowledgeManager;

