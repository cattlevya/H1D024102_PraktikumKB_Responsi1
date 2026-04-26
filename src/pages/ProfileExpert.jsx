import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, User, Building, FileBadge, GraduationCap, Loader2, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

const ProfileExpert = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        institution: '',
        title_degree: '',
        sip_number: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (user?.id) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const result = await api.getProfile(user.id);
            if (result.success) {
                setFormData({
                    name: result.data.name || '',
                    email: result.data.email || '',
                    institution: result.data.institution || '',
                    title_degree: result.data.title_degree || '',
                    sip_number: result.data.sip_number || ''
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            const result = await api.updateProfile(user.id, {
                institution: formData.institution,
                title_degree: formData.title_degree,
                sip_number: formData.sip_number
            });
            if (result.success) {
                setMessage({ type: 'success', text: 'Profil pakar berhasil diperbarui.' });
            } else {
                setMessage({ type: 'error', text: 'Gagal menyimpan perubahan.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Terjadi kesalahan.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Memuat data...</div>;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Profil Pakar</h1>
                <p className="text-slate-500">Kelola informasi profesional dan kredensial Anda.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Read Only Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        disabled
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-6">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Data Profesional</h3>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Gelar Akademis & Profesi</label>
                                    <div className="relative">
                                        <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            name="title_degree"
                                            value={formData.title_degree}
                                            onChange={handleChange}
                                            placeholder="Contoh: Sp.P, Sp.PD-KP"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Instansi / Rumah Sakit</label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            name="institution"
                                            value={formData.institution}
                                            onChange={handleChange}
                                            placeholder="Nama Rumah Sakit / Klinik Praktik"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Nomor SIP (Surat Izin Praktik)</label>
                                    <div className="relative">
                                        <FileBadge className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            name="sip_number"
                                            value={formData.sip_number}
                                            onChange={handleChange}
                                            placeholder="Nomor SIP yang berlaku"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {message.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
                                {message.text}
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center shadow-lg shadow-blue-200"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                Simpan Perubahan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileExpert;
