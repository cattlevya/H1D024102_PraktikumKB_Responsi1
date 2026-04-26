import React, { useState, useEffect } from 'react';
import { Edit2, Search, Save, X, Plus, Trash2, GitBranch } from 'lucide-react';
import { Card, Button, Badge } from '../components/ui/Widgets';
import { decisionTree } from '../data/decisionTree';

const TreeManager = () => {
    const [nodes, setNodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingNode, setEditingNode] = useState(null);

    useEffect(() => {
        // Gunakan decisionTree lokal — tidak perlu backend
        try {
            setNodes(decisionTree || []);
        } catch (err) {
            console.error("Failed to load tree", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const filteredNodes = nodes.filter(node =>
        (node.question || node.diagnosis || node.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditClick = (node) => {
        setEditingNode({ ...node });
    };

    const handleSave = () => {
        setNodes(prev => prev.map(n => n.id === editingNode.id ? editingNode : n));
        setEditingNode(null);
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Memuat Data Logika...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Manajemen Logika Diagnosa</h1>
                    <p className="text-slate-500">Edit pertanyaan dan alur diagnosa dalam format tabel.</p>
                </div>
                <Button className="bg-blue-600 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Tambah Node Baru
                </Button>
            </div>

            {/* Search & Filter */}
            <Card className="p-4 flex items-center space-x-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Cari ID Node, Pertanyaan, atau Gejala..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </Card>

            {/* Data Table */}
            <Card className="overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="p-4 font-bold w-24">ID Node</th>
                            <th className="p-4 font-bold w-32">Tipe</th>
                            <th className="p-4 font-bold">Pertanyaan / Label</th>
                            <th className="p-4 font-bold text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredNodes.map(node => (
                            <tr key={node.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-4 font-mono text-xs text-slate-500">{node.id}</td>
                                <td className="p-4">
                                    <Badge variant={node.type === 'danger_check' ? 'blue' : node.type === 'result' ? 'red' : 'gray'}>
                                        {node.type === 'danger_check' ? 'Triase' : node.type === 'result' ? 'Diagnosa' : 'Pertanyaan'}
                                    </Badge>
                                </td>
                                <td className="p-4">
                                    <p className="font-medium text-slate-800">{node.question || node.diagnosis || '-'}</p>
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => handleEditClick(node)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredNodes.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                        Tidak ada data ditemukan.
                    </div>
                )}
            </Card>

            {/* Edit Modal */}
            {editingNode && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-900">Edit Node: {editingNode.id}</h3>
                            <button onClick={() => setEditingNode(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Label / Pertanyaan</label>
                                <textarea
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    rows="3"
                                    value={editingNode.question || editingNode.diagnosis || ''}
                                    onChange={(e) => setEditingNode({ ...editingNode, question: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Node</label>
                                <select
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                    value={editingNode.type}
                                    onChange={(e) => setEditingNode({ ...editingNode, type: e.target.value })}
                                >
                                    <option value="default">Pertanyaan (Default)</option>
                                    <option value="input">Start Node</option>
                                    <option value="output">Hasil Diagnosa</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
                            <Button variant="secondary" onClick={() => setEditingNode(null)}>Batal</Button>
                            <Button className="bg-blue-600 text-white" onClick={handleSave}>
                                <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TreeManager;
