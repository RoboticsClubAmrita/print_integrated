import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { Users, Search, Shield, Mail, Trash2, Edit3, X, Loader2, CheckCircle, AlertCircle, Plus, Save, UserX, UserCheck } from 'lucide-react';

const ROLE_STYLES: Record<string, string> = {
    ADMIN: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
    SUPER_ADMIN: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    STUDENT: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-500/10 dark:text-neutral-400',
    FACULTY: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
};

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [editingUser, setEditingUser] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [saving, setSaving] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [newCollegeId, setNewCollegeId] = useState('');
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newRole, setNewRole] = useState('STUDENT');
    const [addingSaving, setAddingSaving] = useState(false);

    useEffect(() => { loadUsers(); }, []);

    useEffect(() => {
        let result = [...users];
        if (roleFilter !== 'ALL') result = result.filter(u => u.role === roleFilter);
        if (statusFilter === 'ACTIVE') result = result.filter(u => u.isActive !== false);
        else if (statusFilter === 'INACTIVE') result = result.filter(u => u.isActive === false);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(u =>
                (u.name || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.collegeId || '').toLowerCase().includes(q)
            );
        }
        setFilteredUsers(result);
    }, [users, searchQuery, roleFilter, statusFilter]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await userService.getAll();
            setUsers(data?.DATA || data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openEdit = (user: any) => {
        setEditingUser(user);
        setEditName(user.name || '');
        setEditPhone(user.phone || '');
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;
        setSaving(true);
        try {
            await userService.edit({ userId: editingUser._id, name: editName, phone: editPhone });
            setEditingUser(null);
            loadUsers();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleDeactivate = async (userId: string) => {
        if (!confirm('Are you sure you want to deactivate this user? They will not be able to log in.')) return;
        try {
            await userService.delete(userId);
            loadUsers();
        } catch (e) { console.error(e); }
    };

    const handleReactivate = async (userId: string) => {
        if (!confirm('Reactivate this user? They will be able to log in again.')) return;
        try {
            await (userService as any).reactivate(userId);
            loadUsers();
        } catch (e) { console.error(e); }
    };

    const handleHardDelete = async (userId: string, userName: string) => {
        const firstConfirm = confirm(`⚠️ PERMANENT DELETE: Are you sure you want to permanently delete "${userName}"? This action CANNOT be undone.`);
        if (!firstConfirm) return;
        const secondConfirm = confirm(`🚨 FINAL WARNING: All data for "${userName}" will be permanently removed from the database. Type OK to confirm.`);
        if (!secondConfirm) return;
        try {
            await (userService as any).hardDelete(userId);
            loadUsers();
        } catch (e) { console.error(e); }
    };

    const handleAddUser = async () => {
        if (!newName || !newEmail || !newPassword) return;
        setAddingSaving(true);
        try {
            await userService.add({
                collegeId: newCollegeId, name: newName, email: newEmail,
                password: newPassword, phone: newPhone, role: newRole,
            });
            setShowAddModal(false);
            setNewCollegeId(''); setNewName(''); setNewEmail(''); setNewPassword(''); setNewPhone(''); setNewRole('STUDENT');
            loadUsers();
        } catch (e) { console.error(e); }
        finally { setAddingSaving(false); }
    };

    const roles = Array.from(new Set(users.map(u => u.role).filter(Boolean)));

    const inputClass = "w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition-colors duration-200";

    return (
        <div className="min-h-screen bg-bg p-6 lg:p-8">
            <header className="mb-8 max-w-[1200px] mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[28px] font-bold tracking-[-0.02em] text-text">Users</h1>
                        <p className="text-sm text-text-muted mt-1">View, edit, and manage registered users.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 text-sm bg-primary hover:bg-primary/90 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm">
                            <Plus className="w-4 h-4" /> Add User
                        </button>
                        <button onClick={loadUsers} disabled={loading} className="flex items-center gap-2 text-sm text-text-muted hover:text-text border border-border px-4 py-2 rounded-lg transition-colors duration-200">
                            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card p-4">
                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Users</p>
                        <p className="text-2xl font-bold text-primary">{users.length}</p>
                    </div>
                    {roles.slice(0, 3).map(role => (
                        <div key={role} className="card p-4">
                            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">{role}</p>
                            <p className="text-2xl font-bold text-text-secondary">{users.filter(u => u.role === role).length}</p>
                        </div>
                    ))}
                </div>

                <div className="card p-6">
                    <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Outstanding Balance (All Users)</p>
                    <p className="text-3xl font-bold text-accent">{'₹'}{users.reduce((sum, u) => sum + (u.balance || 0), 0).toFixed(2)}</p>
                </div>

                {/* Filters */}
                <div className="card p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="relative col-span-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name, email, or college ID..." className={`${inputClass} pl-10`} />
                        </div>
                        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
                            <option value="ALL">All Roles</option>
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Active Only</option>
                            <option value="INACTIVE">Inactive Only</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="card overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                            <Loader2 className="w-8 h-8 animate-spin mb-3" />
                            <p>Loading users...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-16 text-text-muted">
                            <Users className="w-14 h-14 mx-auto mb-3 opacity-20" />
                            <p className="font-medium">No users found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wider">
                                        <th className="text-left p-4">Name</th>
                                        <th className="text-left p-4">Email</th>
                                        <th className="text-left p-4">College ID</th>
                                        <th className="text-left p-4">Phone</th>
                                        <th className="text-right p-4">Balance</th>
                                        <th className="text-center p-4">Role</th>
                                        <th className="text-center p-4">Status</th>
                                        <th className="text-right p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user._id} className="border-b border-border hover:bg-bg-secondary transition-colors duration-200">
                                            <td className="p-4 font-medium text-text">{user.name || '—'}</td>
                                            <td className="p-4 text-text-secondary flex items-center gap-1.5"><Mail className="w-3 h-3 text-text-muted" />{user.email}</td>
                                            <td className="p-4 font-mono text-xs text-text-muted">{user.collegeId || '—'}</td>
                                            <td className="p-4 text-text-muted">{user.phone || '—'}</td>
                                            <td className="p-4 text-right">
                                                {user.balance > 0 ? (
                                                    <span className="bg-red-50 dark:bg-red-500/10 text-accent px-2 py-1 rounded-md text-xs font-bold">
                                                        {'₹'}{user.balance.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-green-600 dark:text-green-400 font-medium text-sm">{'₹'}0.00</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md ${ROLE_STYLES[user.role] || 'bg-gray-50 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400'}`}>
                                                    <Shield className="w-3 h-3 mr-1" />{user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {user.isActive ? (
                                                    <span className="text-green-600 dark:text-green-400 flex items-center justify-center gap-1 text-xs"><CheckCircle className="w-3 h-3" />Active</span>
                                                ) : (
                                                    <span className="text-accent flex items-center justify-center gap-1 text-xs"><AlertCircle className="w-3 h-3" />Inactive</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(user)} title="Edit" className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors duration-200">
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    {user.isActive !== false ? (
                                                        <button onClick={() => handleDeactivate(user._id)} title="Deactivate (Soft Delete)" className="p-2 hover:bg-amber-500/10 rounded-lg text-amber-500 transition-colors duration-200">
                                                            <UserX className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleReactivate(user._id)} title="Reactivate" className="p-2 hover:bg-green-500/10 rounded-lg text-green-500 transition-colors duration-200">
                                                            <UserCheck className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleHardDelete(user._id, user.name || user.email)} title="Permanently Delete" className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors duration-200">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditingUser(null)}>
                    <div className="card p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-text">Edit User</h3>
                            <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-bg-secondary rounded-full"><X className="w-5 h-5 text-text-muted" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Name</label>
                                <input value={editName} onChange={e => setEditName(e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Phone</label>
                                <input value={editPhone} onChange={e => setEditPhone(e.target.value)} className={inputClass} />
                            </div>
                            <button onClick={handleSaveEdit} disabled={saving} className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded-lg py-3 flex items-center justify-center gap-2 transition-colors duration-200 shadow-sm">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
                    <div className="card p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-text">Add New User</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-bg-secondary rounded-full"><X className="w-5 h-5 text-text-muted" /></button>
                        </div>
                        <div className="space-y-3">
                            <input value={newCollegeId} onChange={e => setNewCollegeId(e.target.value)} placeholder="College ID" className={inputClass} />
                            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full Name *" className={inputClass} />
                            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email *" type="email" className={inputClass} />
                            <input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Password *" type="password" className={inputClass} />
                            <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Phone" className={inputClass} />
                            <select value={newRole} onChange={e => setNewRole(e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
                                <option value="STUDENT">STUDENT</option>
                                <option value="FACULTY">FACULTY</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                            <button onClick={handleAddUser} disabled={addingSaving} className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded-lg py-3 flex items-center justify-center gap-2 transition-colors duration-200 shadow-sm mt-2">
                                {addingSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
