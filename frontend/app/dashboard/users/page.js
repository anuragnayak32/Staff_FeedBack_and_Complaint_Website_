'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { ROLE_LABELS, ROLE_COLORS, formatDate, cn } from '@/lib/utils';
import { Plus, Pencil, Trash2, Search, X, Shield } from 'lucide-react';

const DEPARTMENTS = ['Engineering', 'HR', 'Finance', 'Operations', 'Marketing', 'IT', 'Legal', 'Sales', 'Customer Service', 'Other'];

function UserModal({ user: editUser, onClose, onSave }) {
  const isNew = !editUser?._id;
  const [form, setForm] = useState({
    name: editUser?.name || '', email: editUser?.email || '',
    role: editUser?.role || 'secretariat', department: editUser?.department || '',
    password: '', isActive: editUser?.isActive !== false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    if (!form.name || !form.email) { setError('Name and email required'); return; }
    if (isNew && !form.password) { setError('Password required for new users'); return; }
    setSaving(true); setError('');
    try {
      if (isNew) {
        const { data } = await api.post('/users', form);
        onSave(data, true);
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        const { data } = await api.put(`/users/${editUser._id}`, payload);
        onSave(data, false);
      }
      onClose();
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-md shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
            {isNew ? 'Create User' : 'Edit User'}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {[
            { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Smith' },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'jane@company.com' },
            { name: 'password', label: isNew ? 'Password *' : 'New Password (leave blank to keep)', type: 'password', placeholder: '••••••••' },
          ].map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium mb-1.5">{label}</label>
              <input name={name} type={type} value={form[name]} onChange={handle} placeholder={placeholder}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1.5">Role</label>
            <select name="role" value={form.role} onChange={handle}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none">
              <option value="secretariat">Secretariat</option>
              <option value="case_manager">Case Manager</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Department</label>
            <select name="department" value={form.department} onChange={handle}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none">
              <option value="">Select department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {!isNew && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium">Active Account</span>
              <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-blue-600' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-border sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : isNew ? 'Create User' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modal, setModal] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/dashboard');
  }, [user]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const { data } = await api.get('/users', { params });
      setUsers(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [roleFilter, search]);

  const deleteUser = async (id, name) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    await api.delete(`/users/${id}`);
    setUsers(us => us.filter(u => u._id !== id));
  };

  const handleSave = (savedUser, isNew) => {
    if (isNew) setUsers(us => [savedUser, ...us]);
    else setUsers(us => us.map(u => u._id === savedUser._id ? savedUser : u));
  };

  const counts = {
    '': users.length,
    staff: users.filter(u => u.role === 'staff').length,
    secretariat: users.filter(u => u.role === 'secretariat').length,
    case_manager: users.filter(u => u.role === 'case_manager').length,
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={20} className="text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>Users</h1>
          </div>
          <p className="text-muted-foreground text-sm">Manage all user accounts.</p>
        </div>
        <button onClick={() => setModal({ _id: null })}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={15} /> <span className="hidden sm:inline">Create User</span><span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Role filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: '', label: 'All' },
          { key: 'staff', label: 'Staff' },
          { key: 'secretariat', label: 'Secretariat' },
          { key: 'case_manager', label: 'Case Managers' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setRoleFilter(key)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              roleFilter === key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-border text-muted-foreground hover:border-blue-300 hover:text-blue-600'
            )}>
            {label} ({counts[key] ?? 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
          className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
      </div>

      {/* Users — card list on mobile, table on desktop */}
      <div className="neo-card overflow-hidden">
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-border">
              <tr>
                {['User', 'Role', 'Department', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">No users found</td></tr>
              ) : users.map(u => (
                <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={cn('status-badge', ROLE_COLORS[u.role])}>{ROLE_LABELS[u.role]}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{u.department || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('status-badge', u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                      {u.isActive ? '● Active' : '● Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== 'admin' && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal(u)} className="p-1.5 rounded-lg hover:bg-blue-100 text-muted-foreground hover:text-blue-600 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteUser(u._id, u.name)} className="p-1.5 rounded-lg hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No users found</div>
          ) : users.map(u => (
            <div key={u._id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                {u.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="font-medium text-sm">{u.name}</p>
                  <span className={cn('status-badge text-xs', ROLE_COLORS[u.role])}>{ROLE_LABELS[u.role]}</span>
                  <span className={cn('status-badge text-xs', u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                {u.department && <p className="text-xs text-muted-foreground">{u.department}</p>}
              </div>
              {u.role !== 'admin' && (
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => setModal(u)} className="p-2 rounded-lg hover:bg-blue-100 text-muted-foreground hover:text-blue-600 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteUser(u._id, u.name)} className="p-2 rounded-lg hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {modal !== null && (
        <UserModal
          user={modal._id ? modal : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
