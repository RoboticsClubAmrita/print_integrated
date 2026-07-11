import React, { useState, useEffect } from 'react';
import { hardwareService } from '../services/api';
import { Layers, MapPin, Plus, Printer, Trash2 } from 'lucide-react';
import { EmptyState, LedDot, PageHeader, Panel } from '../components/admin/ui';
import { clsx } from 'clsx';

/**
 * Hardware — the machines themselves. Locations on the left rail; the
 * selected hub's printers (machine rows) and stacks (physical pickup
 * slots) on the bench. Every status is an LED, never a paragraph.
 */
const LocationsPage: React.FC = () => {
    const [locations, setLocations] = useState<any[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<any>(null);
    const [printers, setPrinters] = useState<any[]>([]);
    const [stacks, setStacks] = useState<any[]>([]);

    const [newLocName, setNewLocName] = useState('');
    const [newLocAddress, setNewLocAddress] = useState('');
    const [newPrinterName, setNewPrinterName] = useState('');
    const [newStackName, setNewStackName] = useState('');

    useEffect(() => { loadLocations(); }, []);

    const loadLocations = async () => {
        try {
            const data = await hardwareService.getLocations();
            setLocations(data?.DATA || data || []);
        } catch (e) { console.error('Failed to load locations', e); }
    };

    const handleCreateLocation = async () => {
        if (!newLocName) return;
        try {
            await hardwareService.createLocation({ name: newLocName, address: newLocAddress });
            setNewLocName(''); setNewLocAddress('');
            loadLocations();
        } catch (e) { console.error(e); }
    };

    const handleDeleteLocation = async (id: string) => {
        try {
            await hardwareService.deleteLocation(id);
            if (selectedLocation?._id === id) setSelectedLocation(null);
            loadLocations();
        } catch (e) { console.error(e); }
    };

    const selectLocation = async (loc: any) => {
        setSelectedLocation(loc);
        await Promise.all([loadPrinters(loc._id), loadStacks(loc._id)]);
    };

    const loadPrinters = async (locId: string) => {
        try {
            const data = await hardwareService.getPrinters(locId);
            setPrinters(data?.DATA || data || []);
        } catch (e) { console.error(e); }
    };

    const handleCreatePrinter = async () => {
        if (!newPrinterName || !selectedLocation) return;
        try {
            await hardwareService.createPrinter({ name: newPrinterName, locationId: selectedLocation._id });
            setNewPrinterName('');
            loadPrinters(selectedLocation._id);
        } catch (e) { console.error(e); }
    };

    const handleUpdatePrinter = async (id: string, status: string) => {
        try {
            await hardwareService.updatePrinterStatus(id, status);
            loadPrinters(selectedLocation._id);
        } catch (e) { console.error(e); }
    };

    const handleDeletePrinter = async (id: string) => {
        try {
            await hardwareService.deletePrinter(id);
            loadPrinters(selectedLocation._id);
        } catch (e) { console.error(e); }
    };

    const loadStacks = async (locId: string) => {
        try {
            const data = await hardwareService.getStacks(locId);
            setStacks(data?.DATA || data || []);
        } catch (e) { console.error(e); }
    };

    const handleCreateStack = async () => {
        if (!newStackName || !selectedLocation) return;
        try {
            await hardwareService.createStack({ name: newStackName, locationId: selectedLocation._id });
            setNewStackName('');
            loadStacks(selectedLocation._id);
        } catch (e) { console.error(e); }
    };

    const handleUpdateStack = async (id: string, status: string) => {
        try {
            await hardwareService.updateStackStatus(id, status);
            loadStacks(selectedLocation._id);
        } catch (e) { console.error(e); }
    };

    const handleDeleteStack = async (id: string) => {
        try {
            await hardwareService.deleteStack(id);
            loadStacks(selectedLocation._id);
        } catch (e) { console.error(e); }
    };

    return (
        <>
            <PageHeader
                title="Hardware"
                meta={`${locations.length} ${locations.length === 1 ? 'LOCATION' : 'LOCATIONS'} ON THE FLOOR`}
            />

            <div className="grid grid-cols-12 items-start gap-5 lg:gap-6">
                {/* ————— hubs ————— */}
                <div className="col-span-12 lg:col-span-4">
                    <Panel title="Locations" icon={MapPin} bodyClassName="p-3">
                        {locations.length === 0 ? (
                            <p className="px-2 py-3 text-[12.5px] leading-relaxed text-text-muted">
                                No print hubs yet — add the first one below.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {locations.map(loc => {
                                    const active = selectedLocation?._id === loc._id;
                                    return (
                                        <li key={loc._id}>
                                            <button
                                                type="button"
                                                onClick={() => selectLocation(loc)}
                                                className={clsx(
                                                    'well well-hover group flex w-full items-center gap-3 px-4 py-3 text-left',
                                                    active && '!border-accent-secondary/35 !bg-accent-secondary/6',
                                                )}
                                            >
                                                {active && <LedDot tone="amber" />}
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-[13.5px] font-bold text-text">{loc.name}</span>
                                                    {loc.address && (
                                                        <span className="block truncate text-[11.5px] text-text-muted">{loc.address}</span>
                                                    )}
                                                </span>
                                                <span
                                                    role="button"
                                                    tabIndex={0}
                                                    title="Delete location"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteLocation(loc._id); }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault(); e.stopPropagation(); handleDeleteLocation(loc._id);
                                                        }
                                                    }}
                                                    className="icon-btn icon-btn--danger opacity-0 transition-opacity duration-150 focus-visible:opacity-100 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={14} />
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        <div className="mt-3 space-y-2.5 border-t border-white/6 px-1 pt-4 pb-1">
                            <input value={newLocName} onChange={e => setNewLocName(e.target.value)} placeholder="Location name" className="ctl" />
                            <input value={newLocAddress} onChange={e => setNewLocAddress(e.target.value)} placeholder="Address (optional)" className="ctl" />
                            <button onClick={handleCreateLocation} disabled={!newLocName} className="press-btn w-full">
                                <Plus size={15} strokeWidth={2.4} /> Add location
                            </button>
                        </div>
                    </Panel>
                </div>

                {/* ————— machines at the selected hub ————— */}
                {selectedLocation ? (
                    <div className="col-span-12 space-y-5 lg:col-span-8 lg:space-y-6">
                        <Panel title={`Printers · ${selectedLocation.name}`} icon={Printer}>
                            <div className="mb-4 flex gap-2.5">
                                <input
                                    value={newPrinterName}
                                    onChange={e => setNewPrinterName(e.target.value)}
                                    placeholder="Printer name, e.g. Printer-01"
                                    className="ctl flex-1"
                                />
                                <button onClick={handleCreatePrinter} disabled={!newPrinterName} className="press-btn shrink-0">
                                    <Plus size={15} strokeWidth={2.4} /> Add
                                </button>
                            </div>

                            {printers.length === 0 ? (
                                <p className="py-2 text-[12.5px] text-text-muted">No printers at this hub yet.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                    {printers.map(p => {
                                        const up = p.status === 'AVAILABLE';
                                        return (
                                            <div key={p._id} className="well group flex items-center gap-3 px-4 py-3">
                                                <LedDot tone={up ? 'ok' : 'bad'} />
                                                <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-text">{p.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdatePrinter(p._id, up ? 'NOT_AVAILABLE' : 'AVAILABLE')}
                                                    className={clsx('chip', up ? 'chip--ok' : 'chip--bad')}
                                                    title="Toggle availability"
                                                >
                                                    <span className="dot" />
                                                    {up ? 'AVAILABLE' : 'UNAVAILABLE'}
                                                    <span className="opacity-60 -mr-0.5">⇄</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePrinter(p._id)}
                                                    title="Delete printer"
                                                    className="icon-btn icon-btn--danger opacity-0 transition-opacity duration-150 focus-visible:opacity-100 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Panel>

                        <Panel title={`Stacks · ${selectedLocation.name}`} icon={Layers}>
                            <div className="mb-4 flex gap-2.5">
                                <input
                                    value={newStackName}
                                    onChange={e => setNewStackName(e.target.value)}
                                    placeholder="Stack name, e.g. Slot-1"
                                    className="ctl flex-1"
                                />
                                <button onClick={handleCreateStack} disabled={!newStackName} className="press-btn shrink-0">
                                    <Plus size={15} strokeWidth={2.4} /> Add
                                </button>
                            </div>

                            {stacks.length === 0 ? (
                                <p className="py-2 text-[12.5px] text-text-muted">No pickup stacks at this hub yet.</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                                    {stacks.map(s => {
                                        const free = s.status === 'AVAILABLE';
                                        return (
                                            <div key={s._id} className="group/slot relative">
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateStack(s._id, free ? 'OCCUPIED' : 'AVAILABLE')}
                                                    title="Toggle slot status"
                                                    className={clsx(
                                                        'well well-hover flex h-[86px] w-full flex-col items-center justify-center gap-1.5 px-2',
                                                        !free && '!border-accent-secondary/30 !bg-accent-secondary/5',
                                                    )}
                                                >
                                                    <span className="mono text-[12.5px] text-text">{s.name}</span>
                                                    <span className="flex items-center gap-1.5">
                                                        <LedDot tone={free ? 'ok' : 'amber'} />
                                                        <span className={clsx('text-[10.5px] font-bold tracking-[0.5px]', free ? 'text-text-muted' : 'text-accent-secondary/90')}>
                                                            {free ? 'FREE' : 'OCCUPIED'}
                                                        </span>
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteStack(s._id)}
                                                    title="Delete stack"
                                                    className="icon-btn icon-btn--danger !absolute right-1 top-1 !size-6 opacity-0 transition-opacity duration-150 focus-visible:opacity-100 group-hover/slot:opacity-100"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Panel>
                    </div>
                ) : (
                    <div className="col-span-12 lg:col-span-8">
                        <div className="panel">
                            <EmptyState
                                icon={Printer}
                                title="Pick a location to service its machines"
                                hint="Printers and pickup stacks live inside a hub — select one on the left, or add your first."
                            />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default LocationsPage;
