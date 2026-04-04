import React, { useState, useEffect } from 'react';
import { pricingService } from '../services/api';
import { IndianRupee, Plus, Trash2, Edit3, Loader2, X, Save, RefreshCw, Palette, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const PricingPage: React.FC = () => {
    const [prices, setPrices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);

    // Create form
    const [showCreate, setShowCreate] = useState(false);
    const [newSize, setNewSize] = useState('A4');
    const [newType, setNewType] = useState('bw');
    const [newSide, setNewSide] = useState('single');
    const [newPrice, setNewPrice] = useState('');
    const [creating, setCreating] = useState(false);

    // Edit
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadPrices(); }, []);

    const loadPrices = async () => {
        setLoading(true);
        try {
            const data = await pricingService.getAll();
            const pricingList = data?.DATA?.prices || data?.prices || (Array.isArray(data?.DATA) ? data.DATA : Array.isArray(data) ? data : []);
            setPrices(pricingList);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSeed = async () => {
        setSeeding(true);
        try {
            await pricingService.seed();
            loadPrices();
        } catch (e) { console.error(e); }
        finally { setSeeding(false); }
    };

    const handleCreate = async () => {
        if (!newPrice) return;
        setCreating(true);
        try {
            await pricingService.create({ size: newSize, type: newType, side: newSide, price: parseFloat(newPrice) });
            setShowCreate(false);
            setNewPrice('');
            loadPrices();
        } catch (e) { console.error(e); }
        finally { setCreating(false); }
    };

    const startEdit = (p: any) => {
        setEditingId(p._id);
        setEditPrice(p.price?.toString() || '');
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setSaving(true);
        try {
            await pricingService.edit({ price_id: editingId, price: parseFloat(editPrice) });
            setEditingId(null);
            loadPrices();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this pricing entry?')) return;
        try {
            await pricingService.delete(id);
            loadPrices();
        } catch (e) { console.error(e); }
    };

    // Group by size
    const grouped = prices.reduce((acc: Record<string, any[]>, p) => {
        const key = p.size || 'Other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-background gradient-bg p-6 lg:p-10">
            <header className="mb-8 max-w-[1400px] mx-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">P</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold font-heading">Pricing Management</h1>
                            <p className="text-text-muted text-xs">Configure print pricing per page</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 text-sm bg-primary hover:bg-primary/80 text-black font-semibold px-4 py-2 rounded-xl transition-all">
                            <Plus className="w-4 h-4" /> Add Price
                        </button>
                        <button onClick={handleSeed} disabled={seeding} className="flex items-center gap-2 text-sm bg-green-500 hover:bg-green-600 text-black font-semibold px-4 py-2 rounded-xl transition-all">
                            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Seed Defaults
                        </button>
                        <button onClick={loadPrices} disabled={loading} className="flex items-center gap-2 text-sm text-text-muted hover:text-white border border-white/10 px-4 py-2 rounded-xl transition-all">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto space-y-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted glass rounded-3xl">
                        <Loader2 className="w-8 h-8 animate-spin mb-3" />
                        <p>Loading pricing...</p>
                    </div>
                ) : prices.length === 0 ? (
                    <div className="text-center py-16 text-text-muted glass rounded-3xl">
                        <IndianRupee className="w-14 h-14 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">No pricing configured</p>
                        <p className="text-sm mt-1">Click "Seed Defaults" to add standard pricing</p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([size, items]) => (
                        <div key={size} className="glass p-6 rounded-3xl">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" /> {size}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {items.map((p: any) => (
                                    <motion.div
                                        key={p._id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-surface p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Palette className={`w-4 h-4 ${p.type === 'colour' || p.type === 'color' ? 'text-purple-400' : 'text-text-muted'}`} />
                                                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                                    {p.type === 'colour' || p.type === 'color' ? 'COLOUR' : 'B&W'} · {p.side === 'double' ? 'Double' : 'Single'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => startEdit(p)} className="p-1.5 hover:bg-primary/20 rounded-lg text-primary"><Edit3 className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => handleDelete(p._id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>

                                        {editingId === p._id ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center bg-background rounded-xl px-3 py-2 flex-1 border border-primary/50">
                                                    <IndianRupee className="w-4 h-4 text-primary mr-1" />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={editPrice}
                                                        onChange={e => setEditPrice(e.target.value)}
                                                        className="bg-transparent text-white text-lg font-bold w-full focus:outline-none"
                                                        autoFocus
                                                    />
                                                </div>
                                                <button onClick={handleSaveEdit} disabled={saving} className="p-2 bg-primary rounded-xl text-black">
                                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="p-2 bg-white/10 rounded-xl"><X className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <p className="text-3xl font-bold text-primary flex items-center gap-0.5">
                                                <IndianRupee className="w-5 h-5" />{p.price?.toFixed(2)}
                                                <span className="text-xs text-text-muted font-normal ml-1">/page</span>
                                            </p>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* Create Price Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-3xl p-8 w-full max-w-md border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Create Price Entry</h3>
                            <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Page Size</label>
                                <select value={newSize} onChange={e => setNewSize(e.target.value)} className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none appearance-none cursor-pointer">
                                    <option value="A4">A4</option>
                                    <option value="A3">A3</option>
                                    <option value="Letter">Letter</option>
                                    <option value="Legal">Legal</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Print Type</label>
                                <select value={newType} onChange={e => setNewType(e.target.value)} className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none appearance-none cursor-pointer">
                                    <option value="bw">Black & White</option>
                                    <option value="colour">Colour</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Side</label>
                                <select value={newSide} onChange={e => setNewSide(e.target.value)} className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none appearance-none cursor-pointer">
                                    <option value="single">Single</option>
                                    <option value="double">Double</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Price per Page (₹)</label>
                                <input type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="2.50" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary" />
                            </div>
                            <button onClick={handleCreate} disabled={creating} className="w-full bg-primary hover:bg-primary/80 text-black font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors mt-2">
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default PricingPage;
