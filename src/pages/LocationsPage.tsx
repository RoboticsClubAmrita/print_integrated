import React, { useState, useEffect } from 'react';
import { hardwareService } from '../services/api';
import { MapPin, Printer, Layers, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

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

    const inputClass = "w-full bg-bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-text focus:outline-none focus:border-primary transition-colors duration-200";

    return (
        <div className="min-h-screen bg-bg p-6 lg:p-8">
            <header className="mb-8 max-w-[1200px] mx-auto">
                 <h1 className="text-[28px] font-bold tracking-[-0.02em] text-text">Hardware & Locations</h1>
                 <p className="text-sm text-text-muted mt-1">Manage locations, printers, and stack availability.</p>
            </header>

            <main className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Locations Column */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-text"><MapPin className="w-5 h-5 text-primary"/> Locations</h2>

                    <div className="mb-6 space-y-3">
                        <input value={newLocName} onChange={e => setNewLocName(e.target.value)} placeholder="Location Name" className={inputClass} />
                        <input value={newLocAddress} onChange={e => setNewLocAddress(e.target.value)} placeholder="Address (optional)" className={inputClass} />
                        <button onClick={handleCreateLocation} className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors duration-200 shadow-sm">
                            <Plus size={18} /> Add Location
                        </button>
                    </div>

                    <ul className="space-y-3">
                        {locations.map(loc => (
                            <li key={loc._id} onClick={() => selectLocation(loc)} className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${selectedLocation?._id === loc._id ? 'bg-primary/5 border-primary/40' : 'bg-bg-secondary border-border hover:border-primary/20'}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-text">{loc.name}</h3>
                                        {loc.address && <p className="text-xs text-text-muted">{loc.address}</p>}
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteLocation(loc._id); }} className="text-accent p-2 hover:bg-accent/10 rounded-lg transition-colors duration-200"><Trash2 size={16}/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Printers & Stacks */}
                {selectedLocation ? (
                    <section className="col-span-2 space-y-6">
                        <div className="card p-6">
                             <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-text"><Printer className="w-5 h-5 text-primary"/> Printers at {selectedLocation.name}</h2>

                             <div className="flex gap-3 mb-6">
                                 <input value={newPrinterName} onChange={e => setNewPrinterName(e.target.value)} placeholder="Printer Name (e.g. Printer-01)" className={`flex-1 ${inputClass}`} />
                                 <button onClick={handleCreatePrinter} className="bg-primary hover:bg-primary/90 px-4 font-medium rounded-lg transition-colors duration-200 text-white flex gap-2 items-center shadow-sm"><Plus size={18} /> Add</button>
                             </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {printers.map(p => (
                                    <div key={p._id} className="bg-bg-secondary p-4 rounded-xl border border-border flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                             <span className="font-semibold text-text">{p.name}</span>
                                             <button onClick={() => handleDeletePrinter(p._id)} className="text-accent hover:text-accent/80"><Trash2 size={16}/></button>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm cursor-pointer" onClick={() => handleUpdatePrinter(p._id, p.status === 'AVAILABLE' ? 'NOT_AVAILABLE' : 'AVAILABLE')}>
                                            {p.status === 'AVAILABLE' ? <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><CheckCircle size={14}/> Available</span> : <span className="flex items-center gap-1 text-accent"><AlertCircle size={14}/> Not Available</span>}
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>

                        <div className="card p-6">
                             <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-text"><Layers className="w-5 h-5 text-primary"/> Stacks at {selectedLocation.name}</h2>

                             <div className="flex gap-3 mb-6">
                                 <input value={newStackName} onChange={e => setNewStackName(e.target.value)} placeholder="Stack Name/Number (e.g. Slot-1)" className={`flex-1 ${inputClass}`} />
                                 <button onClick={handleCreateStack} className="bg-primary hover:bg-primary/90 px-4 font-medium rounded-lg transition-colors duration-200 text-white flex gap-2 items-center shadow-sm"><Plus size={18} /> Add</button>
                             </div>

                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {stacks.map(s => (
                                    <div key={s._id} className="bg-bg-secondary p-4 rounded-xl border border-border flex flex-col gap-3 text-center items-center">
                                        <span className="font-semibold text-text">{s.name}</span>
                                        <button onClick={() => handleUpdateStack(s._id, s.status === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE')} className={`px-3 py-1 text-xs rounded-md font-semibold ${s.status === 'AVAILABLE' ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                                            {s.status === 'AVAILABLE' ? 'Available' : 'Occupied'}
                                        </button>
                                        <button onClick={() => handleDeleteStack(s._id)} className="text-accent hover:text-accent/80 mt-1"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </section>
                ) : (
                    <div className="col-span-2 card flex items-center justify-center p-12 text-text-muted text-base border-dashed">
                        Select a location to manage Printers and Stacks
                    </div>
                )}
            </main>
        </div>
    );
};

export default LocationsPage;
