import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { Edit3, Loader2, Plus, RefreshCw, Save, Search, Trash2, UserCheck, Users, UserX } from 'lucide-react';
import {
    Dialog,
    EmptyState,
    Field,
    LedDot,
    PageHeader,
    RoleChip,
    SkeletonRows,
    apiError,
    ErrorNote,
    fmtDate,
    inr,
} from '../components/admin/ui';
import { ExportMenu } from '../components/admin/ExportMenu';
import { stampedName, type ExportColumn } from '../utils/tableExport';

/** Matches the server's own minimum in userModule.addUser. */
const MIN_PASSWORD_LENGTH = 4;

const initials = (name?: string, email?: string) => {
    const src = (name || email || '?').trim();
    const parts = src.split(/\s+/);
    return (parts.length > 1 ? parts[0][0] + parts[1][0] : src.slice(0, 2)).toUpperCase();
};

/**
 * The downloadable register. Wider than the on-screen table on purpose — a
 * spreadsheet has no hover row to hide detail behind, so the flags the UI
 * folds into a status dot each get their own column.
 */
const EXPORT_COLUMNS: ExportColumn<any>[] = [
    { header: 'College ID', value: (u) => u.collegeId || '', width: 22 },
    { header: 'Name', value: (u) => u.name || '', width: 24 },
    { header: 'Email', value: (u) => u.email || '', width: 40 },
    { header: 'Phone', value: (u) => u.phone || '', width: 16 },
    { header: 'Role', value: (u) => (u.role || '').replace(/_/g, ' '), width: 14 },
    { header: 'Balance (INR)', value: (u) => Number(u.balance) || 0, width: 15, money: true },
    { header: 'Status', value: (u) => (u.isActive !== false ? 'Active' : 'Inactive'), width: 11 },
    { header: 'Verified', value: (u) => (u.isVerified ? 'Yes' : 'No'), width: 10 },
    { header: 'Blocked', value: (u) => (u.isBlocked ? 'Yes' : 'No'), width: 10 },
    {
        header: 'Registered',
        value: (u) => (u.createdAt ? fmtDate(u.createdAt) : ''),
        width: 16,
    },
];

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
    const [addError, setAddError] = useState<string | null>(null);
    const [editError, setEditError] = useState<string | null>(null);
    const [rowError, setRowError] = useState<string | null>(null);

    /**
     * Mirrors what POST /users/add actually enforces. College ID and phone are
     * mandatory server-side; presenting them as optional here is what made the
     * form silently refuse to submit.
     */
    const canCreate =
        newName.trim() !== '' &&
        newCollegeId.trim() !== '' &&
        newEmail.trim() !== '' &&
        newPhone.trim() !== '' &&
        newPassword.length >= MIN_PASSWORD_LENGTH;

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
        } catch (e) { setRowError(apiError(e, 'Could not load the user register.')); }
        finally { setLoading(false); }
    };

    const openEdit = (user: any) => {
        setEditError(null);
        setEditingUser(user);
        setEditName(user.name || '');
        setEditPhone(user.phone || '');
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;
        setEditError(null);
        setSaving(true);
        try {
            await userService.edit({ userId: editingUser._id, name: editName, phone: editPhone });
            setEditingUser(null);
            loadUsers();
        } catch (e) {
            setEditError(apiError(e, 'Could not save those changes.'));
        }
        finally { setSaving(false); }
    };

    const handleDeactivate = async (userId: string) => {
        setRowError(null);
        if (!confirm('Are you sure you want to deactivate this user? They will not be able to log in.')) return;
        try {
            await userService.delete(userId);
            loadUsers();
        } catch (e) { setRowError(apiError(e, 'Could not deactivate that user.')); }
    };

    const handleReactivate = async (userId: string) => {
        setRowError(null);
        if (!confirm('Reactivate this user? They will be able to log in again.')) return;
        try {
            await (userService as any).reactivate(userId);
            loadUsers();
        } catch (e) { setRowError(apiError(e, 'Could not reactivate that user.')); }
    };

    const handleHardDelete = async (userId: string, userName: string) => {
        setRowError(null);
        const firstConfirm = confirm(`⚠️ PERMANENT DELETE: Are you sure you want to permanently delete "${userName}"? This action CANNOT be undone.`);
        if (!firstConfirm) return;
        const secondConfirm = confirm(`🚨 FINAL WARNING: All data for "${userName}" will be permanently removed from the database. Type OK to confirm.`);
        if (!secondConfirm) return;
        try {
            await (userService as any).hardDelete(userId);
            loadUsers();
        } catch (e) { setRowError(apiError(e, 'Could not delete that user.')); }
    };

    const closeAddModal = () => {
        setShowAddModal(false);
        setAddError(null);
        setNewCollegeId(''); setNewName(''); setNewEmail(''); setNewPassword(''); setNewPhone(''); setNewRole('STUDENT');
    };

    const handleAddUser = async () => {
        if (!canCreate) return;
        setAddError(null);
        setAddingSaving(true);
        try {
            await userService.add({
                collegeId: newCollegeId.trim(), name: newName.trim(), email: newEmail.trim(),
                password: newPassword, phone: newPhone.trim(), role: newRole,
            });
            closeAddModal();
            loadUsers();
        } catch (e) {
            setAddError(apiError(e, 'Could not create the user.'));
        }
        finally { setAddingSaving(false); }
    };

    const roles = Array.from(new Set(users.map(u => u.role).filter(Boolean)));
    const outstanding = users.reduce((sum, u) => sum + (u.balance || 0), 0);

    return (
        <>
            <PageHeader
                title="Users"
                meta={`${users.length} REGISTERED · ${inr(outstanding)} OUTSTANDING`}
                actions={
                    <>
                        <button onClick={loadUsers} disabled={loading} className="btn-ghost !px-3" title="Refresh">
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <ExportMenu
                            columns={EXPORT_COLUMNS}
                            rows={filteredUsers}
                            filename={stampedName('printease-users')}
                            sheetName="Users"
                            disabled={loading}
                        />
                        <button onClick={() => setShowAddModal(true)} className="press-btn">
                            <Plus size={15} strokeWidth={2.4} /> Add user
                        </button>
                    </>
                }
            />

            <div className="space-y-5">
                {rowError && <ErrorNote onDismiss={() => setRowError(null)}>{rowError}</ErrorNote>}

                {/* Toolbar */}
                <div className="panel filter-bar px-3.5 py-3">
                    <div className="ctl--grow relative">
                        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search name, email or college ID…"
                            className="ctl !w-full !pl-10"
                        />
                    </div>
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="ctl" aria-label="Role">
                        <option value="ALL">All roles</option>
                        {roles.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                    </select>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="ctl" aria-label="Status">
                        <option value="ALL">All status</option>
                        <option value="ACTIVE">Active only</option>
                        <option value="INACTIVE">Inactive only</option>
                    </select>
                </div>

                {/* Register */}
                <div className="panel overflow-hidden">
                    {loading ? (
                        <SkeletonRows rows={7} />
                    ) : filteredUsers.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title="No users found"
                            hint="Try a different search or loosen the filters."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="tbl">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>College ID</th>
                                        <th>Phone</th>
                                        <th className="!text-right">Balance</th>
                                        <th className="!text-center">Role</th>
                                        <th>Status</th>
                                        <th className="!text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user._id} className="group">
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-white/8 bg-white/6 text-[10px] font-extrabold text-text-secondary">
                                                        {initials(user.name, user.email)}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-[13.5px] font-semibold text-text">{user.name || '—'}</p>
                                                        <p className="truncate text-[12px] text-text-muted">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="mono whitespace-nowrap text-[12px] text-text-secondary">{user.collegeId || '—'}</td>
                                            <td className="whitespace-nowrap text-text-secondary">{user.phone || '—'}</td>
                                            <td className="!text-right whitespace-nowrap">
                                                {user.balance > 0 ? (
                                                    <span className="chip chip--bad mono !text-[11px]">{inr(user.balance)}</span>
                                                ) : (
                                                    <span className="mono text-[12px] text-text-muted">₹0.00</span>
                                                )}
                                            </td>
                                            <td className="!text-center whitespace-nowrap"><RoleChip role={user.role} /></td>
                                            <td className="whitespace-nowrap">
                                                <span className="flex items-center gap-2 text-[12.5px] font-semibold">
                                                    <LedDot tone={user.isActive !== false ? 'ok' : 'bad'} />
                                                    <span className={user.isActive !== false ? 'text-text-secondary' : 'text-[#ff8d85]'}>
                                                        {user.isActive !== false ? 'Active' : 'Inactive'}
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="!text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
                                                    <button onClick={() => openEdit(user)} title="Edit" className="icon-btn">
                                                        <Edit3 size={14} />
                                                    </button>
                                                    {user.isActive !== false ? (
                                                        <button onClick={() => handleDeactivate(user._id)} title="Deactivate (soft delete)" className="icon-btn">
                                                            <UserX size={14} />
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleReactivate(user._id)} title="Reactivate" className="icon-btn">
                                                            <UserCheck size={14} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleHardDelete(user._id, user.name || user.email)} title="Permanently delete" className="icon-btn icon-btn--danger">
                                                        <Trash2 size={14} />
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
            </div>

            {/* Edit */}
            {editingUser && (
                <Dialog
                    title="Edit user"
                    icon={Edit3}
                    meta={editingUser.email}
                    onClose={() => setEditingUser(null)}
                    closeDisabled={saving}
                >
                    <div className="space-y-4">
                        {editError && <ErrorNote onDismiss={() => setEditError(null)}>{editError}</ErrorNote>}
                        <Field label="Name">
                            <input value={editName} onChange={e => setEditName(e.target.value)} className="ctl" />
                        </Field>
                        <Field label="Phone">
                            <input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="ctl" />
                        </Field>
                        <button onClick={handleSaveEdit} disabled={saving} className="press-btn w-full">
                            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save changes
                        </button>
                    </div>
                </Dialog>
            )}

            {/* Add */}
            {showAddModal && (
                <Dialog
                    title="Add new user"
                    icon={Plus}
                    onClose={closeAddModal}
                    closeDisabled={addingSaving}
                >
                    <div className="space-y-3.5">
                        {addError && <ErrorNote onDismiss={() => setAddError(null)}>{addError}</ErrorNote>}
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Full name *">
                                <input value={newName} onChange={e => setNewName(e.target.value)} className="ctl" />
                            </Field>
                            <Field label="College ID *">
                                <input value={newCollegeId} onChange={e => setNewCollegeId(e.target.value)} className="ctl" placeholder="CB.SC.U4CSE23330" />
                            </Field>
                        </div>
                        <Field label="Email *" hint="Any valid address — the account is created verified and active.">
                            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="ctl" />
                        </Field>
                        <Field label="Password *" hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="ctl" />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Phone *">
                                <input value={newPhone} onChange={e => setNewPhone(e.target.value)} className="ctl" placeholder="10-digit number" />
                            </Field>
                            <Field label="Role">
                                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="ctl pr-8">
                                    <option value="STUDENT">STUDENT</option>
                                    <option value="FACULTY">FACULTY</option>
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="SUPER_ADMIN">SUPER ADMIN</option>
                                </select>
                            </Field>
                        </div>
                        <button
                            onClick={handleAddUser}
                            disabled={addingSaving || !canCreate}
                            className="press-btn mt-1 w-full"
                        >
                            {addingSaving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} strokeWidth={2.4} />} Create user
                        </button>
                    </div>
                </Dialog>
            )}
        </>
    );
};

export default UsersPage;
