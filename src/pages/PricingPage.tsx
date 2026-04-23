import React, { useState, useEffect } from 'react';
import { pricingService } from '../services/api';
import { IndianRupee, Plus, Trash2, Edit3, Loader2, X, Save, RefreshCw, Palette, FileText } from 'lucide-react';

const PricingPage: React.FC = () => {
    const [prices, setPrices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);

    const [showCreate, setShowCreate] = useState(false);
    const [newSize, setNewSize] = useState('A4');
    const [newType, setNewType] = useState('bw');
    const [newSide, setNewSide] = useState('single');
    const [newPrice, setNewPrice] = useState('');
    const [creating, setCreating] = useState(false);

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
        try { await pricingService.seed(); loadPrices(); }
        catch (e) { console.error(e); }
        finally { setSeeding(false); }
    };

    const handleCreate = async () => {
        if (!newPrice) return;
        setCreating(true);
        try {
            await pricingService.create({ size: newSize, type: newType, side: newSide, price: parseFloat(newPrice) });
            setShowCreate(false); setNewPrice(''); loadPrices();
        } catch (e) { console.error(e); }
        finally { setCreating(false); }
    };

    const startEdit = (p: any) => { setEditingId(p._id); setEditPrice(p.price?.toString() || ''); };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setSaving(true);
        try { await pricingService.edit({ price_id: editingId, price: parseFloat(editPrice) }); setEditingId(null); loadPrices(); }
        catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this pricing entry?')) return;
        try { await pricingService.delete(id); loadPrices(); }
        catch (e) { console.error(e); }
    };

    const grouped = prices.reduce((acc: Record<string, any[]>, p) => {
        const key = p.size || 'Other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
        return acc;
    }, {});

    const inputClass = "w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition-colors duration-200";

    return (
        <div className="min-h-screen bg-bg p-6 lg:p-8">
            <header className="mb-8 max-w-[1200px] mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[28px] font-bold tracking-[-0.02em] text-text">Pricing</h1>
                        <p className="text-sm text-text-muted mt-1">Configure print pricing rules by paper, mode, and side.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 text-sm bg-primary hover:bg-primary/90 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm">
                            <Plus className="w-4 h-4" /> Add Price
                        </button>
                        <button onClick={handleSeed} disabled={seeding} className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm">
                            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Seed Defaults
                        </button>
                        <button onClick={loadPrices} disabled={loading} className="flex items-center gap-2 text-sm text-text-muted hover:text-text border border-border px-3 py-2 rounded-lg transition-colors duration-200">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted card">
                        <Loader2 className="w-8 h-8 animate-spin mb-3" />
                        <p>Loading pricing...</p>
                    </div>
                ) : prices.length === 0 ? (
                    <div className="text-center py-16 text-text-muted card">
                        <IndianRupee className="w-14 h-14 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">No pricing configured</p>
                        <p className="text-sm mt-1">Click "Seed Defaults" to add standard pricing</p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([size, items]) => (
                        <div key={size} className="card p-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-text">
                                <FileText className="w-5 h-5 text-primary" /> {size}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {items.map((p: any) => (
                                    <div
                                        key={p._id}
                                        className="bg-bg-secondary p-5 rounded-xl border border-border hover:border-primary/30 transition-all duration-200"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Palette className={`w-4 h-4 ${p.type === 'colour' || p.type === 'color' ? 'text-purple-600 dark:text-purple-400' : 'text-text-muted'}`} />
                                                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                                    {p.type === 'colour' || p.type === 'color' ? 'COLOUR' : 'B&W'} &middot; {p.side === 'double' ? 'Double' : 'Single'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => startEdit(p)} className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-colors duration-200"><Edit3 className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => handleDelete(p._id)} className="p-1.5 hover:bg-accent/10 rounded-lg text-accent transition-colors duration-200"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>

                                        {editingId === p._id ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center bg-bg rounded-lg px-3 py-2 flex-1 border border-primary/50">
                                                    <IndianRupee className="w-4 h-4 text-primary mr-1" />
                                                    <input type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="bg-transparent text-text text-lg font-bold w-full focus:outline-none" autoFocus />
                                                </div>
                                                <button onClick={handleSaveEdit} disabled={saving} className="p-2 bg-primary rounded-lg text-white"><Save className="w-4 h-4" /></button>
                                                <button onClick={() => setEditingId(null)} className="p-2 bg-bg-secondary border border-border rounded-lg"><X className="w-4 h-4 text-text-muted" /></button>
                                            </div>
                                        ) : (
                                            <p className="text-3xl font-bold text-primary flex items-center gap-0.5">
                                                <IndianRupee className="w-5 h-5" />{p.price?.toFixed(2)}
                                                <span className="text-xs text-text-muted font-normal ml-1">/page</span>
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
                    <div className="card p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-text">Create Price Entry</h3>
                            <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-bg-secondary rounded-full"><X className="w-5 h-5 text-text-muted" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Page Size</label>
                                <select value={newSize} onChange={e => setNewSize(e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
                                    <option value="A4">A4</option><option value="A3">A3</option><option value="Letter">Letter</option><option value="Legal">Legal</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Print Type</label>
                                <select value={newType} onChange={e => setNewType(e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
                                    <option value="bw">Black & White</option><option value="colour">Colour</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Side</label>
                                <select value={newSide} onChange={e => setNewSide(e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
                                    <option value="single">Single</option><option value="double">Double</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Price per Page</label>
                                <input type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="2.50" className={inputClass} />
                            </div>
                            <button onClick={handleCreate} disabled={creating} className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded-lg py-3 flex items-center justify-center gap-2 transition-colors duration-200 shadow-sm mt-2">
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PricingPage;
