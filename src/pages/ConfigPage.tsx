import React, { useState, useEffect } from 'react';
import { configService } from '../services/api';
import { Settings, Save, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';

const ConfigPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const [freeMinutes, setFreeMinutes] = useState('5');
    const [intervalMinutes, setIntervalMinutes] = useState('5');
    const [ratePerInterval, setRatePerInterval] = useState('10');
    const [maxDaysAhead, setMaxDaysAhead] = useState('30');
    const [minLeadMinutes, setMinLeadMinutes] = useState('10');

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        setError('');
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
            setError(e.response?.data?.MESSAGE || 'Failed to load business rules');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        setError('');
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
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (e: any) {
            console.error('Failed to save config', e);
            setError(e.response?.data?.MESSAGE || 'Failed to save business rules');
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition-colors duration-200";

    return (
        <div className="min-h-screen p-6 lg:p-8">
            <header className="mb-8 max-w-[800px] mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[28px] font-bold tracking-[-0.02em] text-text">Business Rules</h1>
                        <p className="text-sm text-text-muted mt-1">Penalty and scheduling limits — changes apply immediately, no deploy required.</p>
                    </div>
                    <button onClick={load} disabled={loading} className="flex items-center gap-2 text-sm text-text-muted hover:text-text border border-border px-4 py-2 rounded-lg transition-colors duration-200">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </header>

            <main className="max-w-[800px] mx-auto space-y-6">
                {loading ? (
                    <div className="card flex flex-col items-center justify-center py-20 text-text-muted">
                        <Loader2 className="w-8 h-8 animate-spin mb-3" />
                        <p>Loading business rules...</p>
                    </div>
                ) : (
                    <>
                        <div className="card p-6 space-y-5">
                            <h3 className="font-semibold flex items-center gap-2 text-text"><Settings className="w-4 h-4 text-primary" /> Uncollected-Materials Penalty</h3>
                            <p className="text-xs text-text-muted -mt-3">
                                A print job sitting in a stack past the free window accrues a fee every interval, at the rate below.
                                Existing penalties keep the rule that was active when they started accruing — this only affects new accrual going forward.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-text-muted mb-1.5">Free window (minutes)</label>
                                    <input type="number" min="0" value={freeMinutes} onChange={e => setFreeMinutes(e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-xs text-text-muted mb-1.5">Billing interval (minutes)</label>
                                    <input type="number" min="1" value={intervalMinutes} onChange={e => setIntervalMinutes(e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-xs text-text-muted mb-1.5">Rate per interval (₹)</label>
                                    <input type="number" min="0" step="0.5" value={ratePerInterval} onChange={e => setRatePerInterval(e.target.value)} className={inputClass} />
                                </div>
                            </div>
                        </div>

                        <div className="card p-6 space-y-5">
                            <h3 className="font-semibold flex items-center gap-2 text-text"><Settings className="w-4 h-4 text-primary" /> Print Scheduling</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-text-muted mb-1.5">Max days ahead a job can be scheduled</label>
                                    <input type="number" min="1" value={maxDaysAhead} onChange={e => setMaxDaysAhead(e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-xs text-text-muted mb-1.5">Minimum lead time (minutes)</label>
                                    <input type="number" min="0" value={minLeadMinutes} onChange={e => setMinLeadMinutes(e.target.value)} className={inputClass} />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg text-accent text-sm">{error}</div>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-medium py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 shadow-sm"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                            {saved ? 'Saved' : 'Save Changes'}
                        </button>
                    </>
                )}
            </main>
        </div>
    );
};

export default ConfigPage;
