import React, { useState, useEffect } from 'react';
import { pricingService, configService } from '../services/api';
import {
    CheckCircle2,
    Edit3,
    FileText,
    IndianRupee,
    Loader2,
    Plus,
    RefreshCw,
    Save,
    Settings,
    Sprout,
    Timer,
    Trash2,
    X,
} from 'lucide-react';
import { Dialog, EmptyState, Field, PageHeader, Panel, SkeletonRows, inr } from '../components/admin/ui';

/**
 * Pricing & Rules — the tariff the press charges, printed as tariff
 * tables (one per paper size, the way the storefront prints them), and
 * the business rules that govern penalties and scheduling.
 */
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

    // Business rules state
    const [configLoading, setConfigLoading] = useState(true);
    const [configSaving, setConfigSaving] = useState(false);
    const [configSaved, setConfigSaved] = useState(false);
    const [configError, setConfigError] = useState('');

    const [freeMinutes, setFreeMinutes] = useState('5');
    const [intervalMinutes, setIntervalMinutes] = useState('5');
    const [ratePerInterval, setRatePerInterval] = useState('10');
    const [maxDaysAhead, setMaxDaysAhead] = useState('30');
    const [minLeadMinutes, setMinLeadMinutes] = useState('10');

    useEffect(() => {
        loadPrices();
        loadConfig();
    }, []);

    const loadPrices = async () => {
        setLoading(true);
        try {
            const data = await pricingService.getAll();
            const pricingList = data?.DATA?.prices || data?.prices || (Array.isArray(data?.DATA) ? data.DATA : Array.isArray(data) ? data : []);
            setPrices(pricingList);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const loadConfig = async () => {
        setConfigLoading(true);
        setConfigError('');
        try {
            const data = await configService.get();
            const cfg = data?.DATA?.config || data?.config || {};
            setFreeMinutes(String(cfg.penalty?.freeMinutes ?? 5));
            setIntervalMinutes(String(cfg.penalty?.intervalMinutes ?? 5));
            setRatePerInterval(String(cfg.penalty?.ratePerInterval ?? 10));
            setMaxDaysAhead(String(cfg.scheduling?.maxDaysAhead ?? 30));
            setMinLeadMinutes(String(cfg.scheduling?.minLeadMinutes ?? 10));
        } catch (e: any) {
            console.error('Failed to load config', e);
            setConfigError(e.response?.data?.MESSAGE || 'Failed to load business rules');
        } finally {
            setConfigLoading(false);
        }
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

    const handleSaveConfig = async () => {
        setConfigSaving(true);
        setConfigSaved(false);
        setConfigError('');
        try {
            await configService.update({
                penalty: {
                    freeMinutes: Number(freeMinutes),
                    intervalMinutes: Number(intervalMinutes),
                    ratePerInterval: Number(ratePerInterval),
                },
                scheduling: {
                    maxDaysAhead: Number(maxDaysAhead),
                    minLeadMinutes: Number(minLeadMinutes),
                },
            });
            setConfigSaved(true);
            setTimeout(() => setConfigSaved(false), 2500);
        } catch (e: any) {
            console.error('Failed to save config', e);
            setConfigError(e.response?.data?.MESSAGE || 'Failed to save business rules');
        } finally {
            setConfigSaving(false);
        }
    };

    const grouped = prices.reduce((acc: Record<string, any[]>, p) => {
        const key = p.size || 'Other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
        return acc;
    }, {});

    const isColour = (p: any) => p.type === 'colour' || p.type === 'color';

    return (
        <>
            <PageHeader
                title="Pricing & Rules"
                meta={`${prices.length} TARIFF ${prices.length === 1 ? 'ENTRY' : 'ENTRIES'} · CHANGES APPLY IMMEDIATELY`}
                actions={
                    <>
                        <button onClick={loadPrices} disabled={loading} className="btn-ghost !px-3" title="Refresh tariff">
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={handleSeed} disabled={seeding} className="btn-ghost">
                            {seeding ? <Loader2 size={15} className="animate-spin" /> : <Sprout size={15} />} Seed defaults
                        </button>
                        <button onClick={() => setShowCreate(true)} className="press-btn">
                            <Plus size={15} strokeWidth={2.4} /> Add price
                        </button>
                    </>
                }
            />

            <div className="space-y-5">
                {/* ————— the tariff ————— */}
                {loading ? (
                    <div className="panel"><SkeletonRows rows={5} /></div>
                ) : prices.length === 0 ? (
                    <div className="panel">
                        <EmptyState
                            icon={IndianRupee}
                            title="No tariff configured"
                            hint="Seed the standard campus rates, or add each price entry by hand."
                            action={
                                <button onClick={handleSeed} disabled={seeding} className="press-btn">
                                    {seeding ? <Loader2 size={15} className="animate-spin" /> : <Sprout size={15} />} Seed defaults
                                </button>
                            }
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
                        {Object.entries(grouped).map(([size, items]) => (
                            <Panel key={size} title={`${size} tariff`} icon={FileText} bodyClassName="p-2">
                                {items.map((p: any) => (
                                    <div
                                        key={p._id}
                                        className="group flex items-center gap-3 border-b border-white/5 px-3.5 py-3 last:border-0"
                                    >
                                        <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-text">
                                            {isColour(p) ? 'Colour' : 'B&W'}
                                            <span className="text-text-muted"> · {p.side === 'double' ? 'Double-sided' : 'Single-sided'}</span>
                                        </span>

                                        {editingId === p._id ? (
                                            <span className="flex items-center gap-1.5">
                                                <span className="relative">
                                                    <span className="mono pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-text-muted">₹</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={editPrice}
                                                        onChange={e => setEditPrice(e.target.value)}
                                                        autoFocus
                                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                                                        className="ctl mono !h-8 w-24 !pl-7 !text-[13px]"
                                                    />
                                                </span>
                                                <button onClick={handleSaveEdit} disabled={saving} title="Save" className="icon-btn !text-accent">
                                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                </button>
                                                <button onClick={() => setEditingId(null)} title="Cancel" className="icon-btn">
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ) : (
                                            <>
                                                <span className="mono text-[15px] text-text">
                                                    {inr(p.price)}
                                                    <span className="ml-1 text-[10.5px] text-text-muted">/ {p.side === 'double' ? 'sheet' : 'page'}</span>
                                                </span>
                                                <span className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
                                                    <button onClick={() => startEdit(p)} title="Edit price" className="icon-btn">
                                                        <Edit3 size={13.5} />
                                                    </button>
                                                    <button onClick={() => handleDelete(p._id)} title="Delete entry" className="icon-btn icon-btn--danger">
                                                        <Trash2 size={13.5} />
                                                    </button>
                                                </span>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </Panel>
                        ))}
                    </div>
                )}

                {/* ————— business rules ————— */}
                <div className="flex items-center justify-between gap-4 pt-4">
                    <div>
                        <h2 className="flex items-center gap-2 text-[16px] font-extrabold tracking-[-0.3px] text-text">
                            <Settings size={16} className="text-text-muted" /> Business rules
                        </h2>
                        <p className="mt-1 text-[12.5px] text-text-muted">
                            Penalty and scheduling limits — live the moment you save, no deploy required.
                        </p>
                    </div>
                    <button onClick={loadConfig} disabled={configLoading} className="btn-ghost !h-9 !px-3 text-[12.5px]">
                        <RefreshCw size={13.5} className={configLoading ? 'animate-spin' : ''} /> Reload
                    </button>
                </div>

                {configLoading ? (
                    <div className="panel"><SkeletonRows rows={3} /></div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
                            <Panel title="Uncollected-materials penalty" icon={Timer}>
                                <p className="mb-4 text-[12px] leading-relaxed text-text-muted">
                                    A job sitting in a stack past the free window accrues a fee every interval.
                                    Running penalties keep the rule they started under — this only affects new accrual.
                                </p>
                                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                                    <Field label="Free window (min)">
                                        <input type="number" min="0" value={freeMinutes} onChange={e => setFreeMinutes(e.target.value)} className="ctl mono" />
                                    </Field>
                                    <Field label="Interval (min)">
                                        <input type="number" min="1" value={intervalMinutes} onChange={e => setIntervalMinutes(e.target.value)} className="ctl mono" />
                                    </Field>
                                    <Field label="Rate / interval (₹)">
                                        <input type="number" min="0" step="0.5" value={ratePerInterval} onChange={e => setRatePerInterval(e.target.value)} className="ctl mono" />
                                    </Field>
                                </div>
                            </Panel>

                            <Panel title="Print scheduling" icon={Settings}>
                                <p className="mb-4 text-[12px] leading-relaxed text-text-muted">
                                    How far ahead a job may be scheduled, and the minimum notice the press needs.
                                </p>
                                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                                    <Field label="Max days ahead">
                                        <input type="number" min="1" value={maxDaysAhead} onChange={e => setMaxDaysAhead(e.target.value)} className="ctl mono" />
                                    </Field>
                                    <Field label="Min lead time (min)">
                                        <input type="number" min="0" value={minLeadMinutes} onChange={e => setMinLeadMinutes(e.target.value)} className="ctl mono" />
                                    </Field>
                                </div>
                            </Panel>
                        </div>

                        {configError && (
                            <p className="chip--bad rounded-[12px] border px-4 py-3 text-[12.5px] font-semibold">{configError}</p>
                        )}

                        <button onClick={handleSaveConfig} disabled={configSaving} className="press-btn">
                            {configSaving ? <Loader2 size={15} className="animate-spin" /> : configSaved ? <CheckCircle2 size={15} /> : <Save size={15} />}
                            {configSaved ? 'Saved' : 'Save rules'}
                        </button>
                    </>
                )}
            </div>

            {/* Create */}
            {showCreate && (
                <Dialog
                    title="New price entry"
                    icon={IndianRupee}
                    onClose={() => setShowCreate(false)}
                    closeDisabled={creating}
                >
                    <div className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Page size">
                                <select value={newSize} onChange={e => setNewSize(e.target.value)} className="ctl pr-8">
                                    <option value="A4">A4</option><option value="A3">A3</option><option value="Letter">Letter</option><option value="Legal">Legal</option>
                                </select>
                            </Field>
                            <Field label="Print type">
                                <select value={newType} onChange={e => setNewType(e.target.value)} className="ctl pr-8">
                                    <option value="bw">Black & White</option><option value="colour">Colour</option>
                                </select>
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Side">
                                <select value={newSide} onChange={e => setNewSide(e.target.value)} className="ctl pr-8">
                                    <option value="single">Single</option><option value="double">Double</option>
                                </select>
                            </Field>
                            <Field label="Price per page (₹)">
                                <input type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="2.50" className="ctl mono" />
                            </Field>
                        </div>
                        <button onClick={handleCreate} disabled={creating || !newPrice} className="press-btn mt-1 w-full">
                            {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} strokeWidth={2.4} />} Create entry
                        </button>
                    </div>
                </Dialog>
            )}
        </>
    );
};

export default PricingPage;
