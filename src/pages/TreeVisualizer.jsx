import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { RefreshCw, Lock } from 'lucide-react';
import { decisionTree } from '../data/decisionTree';

// Custom Node Styles (Inline for simplicity, or could be separate components)
const nodeStyles = {
    input: {
        background: '#fff',
        color: '#1e293b',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
        padding: '10px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        fontWeight: 'bold',
        minWidth: '150px',
        textAlign: 'center',
    },
    default: {
        background: '#fff',
        color: '#334155',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '10px',
        boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.05)',
        minWidth: '150px',
        textAlign: 'center',
    },
    output: {
        background: '#eff6ff',
        color: '#1d4ed8',
        border: '1px solid #60a5fa',
        borderRadius: '8px',
        padding: '10px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        fontWeight: 'bold',
        minWidth: '150px',
        textAlign: 'center',
    }
};

const TreeVisualizer = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);

    const buildGraphFromTree = (tree) => {
        const nodeMap = new Map(tree.map(n => [n.id, n]));
        const positions = {};
        const levelMap = {};
        const queue = [{ id: 'start', level: 0, col: 0 }];
        const visited = new Set();
        const levelCols = {};

        while (queue.length > 0) {
            const { id, level } = queue.shift();
            if (visited.has(id)) continue;
            visited.add(id);

            if (!levelCols[level]) levelCols[level] = 0;
            positions[id] = { x: levelCols[level] * 220, y: level * 140 };
            levelCols[level]++;
            levelMap[id] = level;

            const node = nodeMap.get(id);
            if (node?.options) {
                node.options.forEach(opt => {
                    if (opt.next && !visited.has(opt.next)) {
                        queue.push({ id: opt.next, level: level + 1 });
                    }
                });
            }
        }

        const flowNodes = tree
            .filter(n => positions[n.id])
            .map(n => ({
                id: n.id,
                position: positions[n.id],
                data: { label: n.question || n.diagnosis || n.id },
                type: n.type === 'result' ? 'output' : n.id === 'start' ? 'input' : 'default',
                style: nodeStyles[n.type === 'result' ? 'output' : n.id === 'start' ? 'input' : 'default'],
                draggable: false,
                connectable: false,
            }));

        const flowEdges = [];
        tree.forEach(n => {
            if (n.options) {
                n.options.forEach((opt, idx) => {
                    if (opt.next && positions[opt.next]) {
                        flowEdges.push({
                            id: `${n.id}-${opt.next}-${idx}`,
                            source: n.id,
                            target: opt.next,
                            label: opt.label?.substring(0, 20),
                            type: 'smoothstep',
                            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
                            style: { stroke: '#94a3b8', strokeWidth: 2 },
                            labelStyle: { fill: '#64748b', fontWeight: 500, fontSize: 10 },
                        });
                    }
                });
            }
        });

        return { flowNodes, flowEdges };
    };

    const fetchTree = () => {
        setLoading(true);
        try {
            const { flowNodes, flowEdges } = buildGraphFromTree(decisionTree);
            setNodes(flowNodes);
            setEdges(flowEdges);
        } catch (err) {
            console.error('Failed to build tree', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTree();
    }, []);

    if (loading) return (
        <div className="h-full flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Memuat Peta Logika...</p>
            </div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between">
                <div className="flex items-center">
                    <div className="p-2 bg-blue-50 rounded-lg mr-3">
                        <Lock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-800">Visualisasi Logika Diagnosa</h1>
                        <p className="text-xs text-slate-500">Mode Baca-Saja (Read Only)</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={fetchTree} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors" title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 bg-slate-50 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                    attributionPosition="bottom-right"
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={true}
                    minZoom={0.5}
                    maxZoom={2}
                >
                    <Background color="#cbd5e1" gap={20} size={1} />
                    <Controls showInteractive={false} className="bg-white border border-slate-200 shadow-sm rounded-lg p-1" />
                    <MiniMap
                        nodeStrokeColor={(n) => {
                            if (n.type === 'input') return '#3b82f6';
                            if (n.type === 'output') return '#2563eb';
                            return '#cbd5e1';
                        }}
                        nodeColor={(n) => {
                            if (n.type === 'output') return '#eff6ff';
                            return '#fff';
                        }}
                        maskColor="rgba(241, 245, 249, 0.7)"
                        className="border border-slate-200 rounded-lg shadow-sm"
                    />
                </ReactFlow>
            </div>
        </div>
    );
};

export default TreeVisualizer;
