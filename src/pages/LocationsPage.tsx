import React, { useState, useEffect } from 'react';
import { hardwareService } from '../services/api';
import { MapPin, Printer, Layers, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

const LocationsPage: React.FC = () => {
    const [locations, setLocations] = useState<any[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<any>(null);
    const [printers, setPrinters] = useState<any[]>([]);
    const [stacks, setStacks] = useState<any[]>([]);
    
    // Forms
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
        <div className="min-h-screen bg-background gradient-bg p-6 lg:p-10">
            <header className="mb-8 max-w-7xl mx-auto flex items-center gap-3">
                 <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                     <span className="text-white font-bold text-xl">P</span>
                 </div>
                 <h1 className="text-xl font-bold font-heading">Hardware & Locations</h1>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Locations Column */}
                <section className="glass p-6 rounded-3xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><MapPin className="text-primary"/> Locations</h2>
                    
                    <div className="mb-6 space-y-3">
                        <input value={newLocName} onChange={e => setNewLocName(e.target.value)} placeholder="Location Name" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary" />
                        <input value={newLocAddress} onChange={e => setNewLocAddress(e.target.value)} placeholder="Address (optional)" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary" />
                        <button onClick={handleCreateLocation} className="w-full bg-primary hover:bg-primary-dark text-black font-semibold rounded-xl py-2 flex items-center justify-center gap-2 transition-colors">
                            <Plus size={18} /> Add Location
                        </button>
                    </div>

                    <ul className="space-y-3">
                        {locations.map(loc => (
                            <li key={loc._id} onClick={() => selectLocation(loc)} className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedLocation?._id === loc._id ? 'bg-primary/20 border-primary' : 'bg-surface border-white/5 hover:border-white/10'}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold">{loc.name}</h3>
                                        {loc.address && <p className="text-xs text-text-muted">{loc.address}</p>}
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteLocation(loc._id); }} className="text-red-400 p-2 hover:bg-red-400/20 rounded-full transition-colors"><Trash2 size={16}/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Printers & Stacks Column */}
                {selectedLocation ? (
                    <section className="col-span-2 space-y-8">
                        <div className="glass p-6 rounded-3xl">
                             <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Printer className="text-purple-400"/> Printers at {selectedLocation.name}</h2>
                             
                             <div className="flex gap-3 mb-6">
                                 <input value={newPrinterName} onChange={e => setNewPrinterName(e.target.value)} placeholder="Printer Name (e.g. Printer-01)" className="flex-1 bg-surface border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-400" />
                                 <button onClick={handleCreatePrinter} className="bg-purple-500 hover:bg-purple-600 px-4 font-semibold rounded-xl transition-colors text-white flex gap-2 items-center"><Plus size={18} /> Add</button>
                             </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {printers.map(p => (
                                    <div key={p._id} className="bg-surface p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                             <span className="font-bold">{p.name}</span>
                                             <button onClick={() => handleDeletePrinter(p._id)} className="text-red-400 hover:text-red-300"><Trash2 size={16}/></button>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm cursor-pointer" onClick={() => handleUpdatePrinter(p._id, p.status === 'AVAILABLE' ? 'NOT_AVAILABLE' : 'AVAILABLE')}>
                                            {p.status === 'AVAILABLE' ? <span className="flex items-center gap-1 text-green-400"><CheckCircle size={14}/> Available</span> : <span className="flex items-center gap-1 text-red-400"><AlertCircle size={14}/> Not Available</span>}
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>

                        <div className="glass p-6 rounded-3xl">
                             <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Layers className="text-blue-400"/> Stacks at {selectedLocation.name}</h2>
                             
                             <div className="flex gap-3 mb-6">
                                 <input value={newStackName} onChange={e => setNewStackName(e.target.value)} placeholder="Stack Name/Number (e.g. Slot-1)" className="flex-1 bg-surface border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-400" />
                                 <button onClick={handleCreateStack} className="bg-blue-500 hover:bg-blue-600 px-4 font-semibold rounded-xl transition-colors text-white flex gap-2 items-center"><Plus size={18} /> Add</button>
                             </div>

                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {stacks.map(s => (
                                    <div key={s._id} className="bg-surface p-4 rounded-2xl border border-white/5 flex flex-col gap-3 text-center items-center">
                                        <span className="font-bold">{s.name}</span>
                                        <div className="flex justify-center w-full">
                                            <button onClick={() => handleUpdateStack(s._id, s.status === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE')} className={`px-3 py-1 text-xs rounded-full font-bold ${s.status === 'AVAILABLE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {s.status === 'AVAILABLE' ? 'Available' : 'Occupied'}
                                            </button>
                                        </div>
                                        <button onClick={() => handleDeleteStack(s._id)} className="text-red-400 hover:text-red-300 mt-2"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </section>
                ) : (
                    <div className="col-span-2 glass flex items-center justify-center p-12 rounded-3xl text-text-muted text-lg border-dashed">
                        Select a location to manage Printers and Stacks
                    </div>
                )}
            </main>
        </div>
    );
};

export default LocationsPage;
