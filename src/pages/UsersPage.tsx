import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { Users, Search, Shield, Mail, Phone, Trash2, Edit3, X, Loader2, CheckCircle, AlertCircle, Plus, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const ROLE_STYLES: Record<string, string> = {
    ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    SUPER_ADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
    STUDENT: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    FACULTY: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    // Edit modal
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editRole, setEditRole] = useState('');
    const [saving, setSaving] = useState(false);

    // Add user modal
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
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(u =>
                (u.name || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.collegeId || '').toLowerCase().includes(q)
            );
        }
        setFilteredUsers(result);
    }, [users, searchQuery, roleFilter]);

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
        setEditRole(user.role || 'STUDENT');
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

    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await userService.delete(userId);
            loadUsers();
        } catch (e) { console.error(e); }
    };

    const handleAddUser = async () => {
        if (!newName || !newEmail || !newPassword) return;
        setAddingSaving(true);
        try {
            await userService.add({
                collegeId: newCollegeId,
                name: newName,
                email: newEmail,
                password: newPassword,
                phone: newPhone,
                role: newRole,
            });
            setShowAddModal(false);
            setNewCollegeId(''); setNewName(''); setNewEmail(''); setNewPassword(''); setNewPhone(''); setNewRole('STUDENT');
            loadUsers();
        } catch (e) { console.error(e); }
        finally { setAddingSaving(false); }
    };

    const roles = Array.from(new Set(users.map(u => u.role).filter(Boolean)));

    return (
        <div className="min-h-screen bg-background gradient-bg p-6 lg:p-10">
            <header className="mb-8 max-w-[1400px] mx-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">P</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold font-heading">Users Management</h1>
                            <p className="text-text-muted text-xs">View, edit, and manage all registered users</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 text-sm bg-primary hover:bg-primary/80 text-black font-semibold px-4 py-2 rounded-xl transition-all">
                            <Plus className="w-4 h-4" /> Add User
                        </button>
                        <button onClick={loadUsers} disabled={loading} className="flex items-center gap-2 text-sm text-text-muted hover:text-white border border-white/10 px-4 py-2 rounded-xl transition-all">
                            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass p-4 rounded-2xl">
                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Users</p>
                        <p className="text-2xl font-bold text-primary">{users.length}</p>
                    </div>
                    {roles.slice(0, 3).map(role => (
                        <div key={role} className="glass p-4 rounded-2xl">
                            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">{role}</p>
                            <p className="text-2xl font-bold text-secondary">{users.filter(u => u.role === role).length}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="glass p-6 rounded-3xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="relative col-span-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by name, email, or college ID..."
                                className="w-full bg-surface border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary appearance-none cursor-pointer">
                            <option value="ALL">All Roles</option>
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div className="glass rounded-3xl overflow-hidden">
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
                                    <tr className="border-b border-white/5 text-text-muted text-xs uppercase tracking-wider">
                                        <th className="text-left p-4">Name</th>
                                        <th className="text-left p-4">Email</th>
                                        <th className="text-left p-4">College ID</th>
                                        <th className="text-left p-4">Phone</th>
                                        <th className="text-center p-4">Role</th>
                                        <th className="text-center p-4">Status</th>
                                        <th className="text-right p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user, i) => (
                                        <motion.tr
                                            key={user._id}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="p-4 font-medium">{user.name || '—'}</td>
                                            <td className="p-4 text-text-muted flex items-center gap-1.5"><Mail className="w-3 h-3" />{user.email}</td>
                                            <td className="p-4 font-mono text-xs text-text-muted">{user.collegeId || '—'}</td>
                                            <td className="p-4 text-text-muted">{user.phone || '—'}</td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border ${ROLE_STYLES[user.role] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                                    <Shield className="w-3 h-3 mr-1" />{user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {user.isActive ? (
                                                    <span className="text-green-400 flex items-center justify-center gap-1 text-xs"><CheckCircle className="w-3 h-3" />Active</span>
                                                ) : (
                                                    <span className="text-red-400 flex items-center justify-center gap-1 text-xs"><AlertCircle className="w-3 h-3" />Inactive</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEdit(user)} className="p-2 hover:bg-primary/20 rounded-lg text-primary transition-colors"><Edit3 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(user._id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditingUser(null)}>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-3xl p-8 w-full max-w-md border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Edit User</h3>
                            <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Name</label>
                                <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Phone</label>
                                <input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary" />
                            </div>
                            <button onClick={handleSaveEdit} disabled={saving} className="w-full bg-primary hover:bg-primary/80 text-black font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-3xl p-8 w-full max-w-md border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Add New User</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-3">
                            <input value={newCollegeId} onChange={e => setNewCollegeId(e.target.value)} placeholder="College ID" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary" />
                            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full Name *" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary" />
                            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email *" type="email" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary" />
                            <input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Password *" type="password" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary" />
                            <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Phone" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary" />
                            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary appearance-none cursor-pointer">
                                <option value="STUDENT">STUDENT</option>
                                <option value="FACULTY">FACULTY</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                            <button onClick={handleAddUser} disabled={addingSaving} className="w-full bg-primary hover:bg-primary/80 text-black font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors mt-2">
                                {addingSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create User
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
