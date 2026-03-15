'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { StatusBadge, SeverityBadge } from '@/components/Badges';
import { CATEGORY_ICONS, formatDate, timeAgo, ROLE_LABELS } from '@/lib/utils';
import { ArrowLeft, User, Calendar, Tag, MapPin, MessageSquare, ChevronDown, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const STATUSES = ['New', 'Assigned', 'In Progress', 'Pending', 'Resolved', 'Escalated'];

export default function CaseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [c, setCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState([]);

  // Update form state
  const [updateForm, setUpdateForm] = useState({ status: '', note: '', resolution: '', actionTaken: '' });
  const [assignTo, setAssignTo] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/cases/${id}`);
        setCase(data);
        setUpdateForm(f => ({ ...f, status: data.status }));
        if (['secretariat', 'admin'].includes(user?.role)) {
          const mgrs = await api.get('/users/case-managers');
          setManagers(mgrs.data);
        }
      } catch { router.push('/dashboard/cases'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleAssign = async () => {
    if (!assignTo) return;
    setUpdating(true);
    try {
      const { data } = await api.put(`/cases/${id}/assign`, { assignedTo: assignTo });
      setCase(data);
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    finally { setUpdating(false); }
  };

  const handleStatusUpdate = async () => {
    setUpdating(true);
    setError('');
    try {
      const { data } = await api.put(`/cases/${id}/status`, updateForm);
      setCase(data);
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    finally { setUpdating(false); }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setUpdating(true);
    try {
      const { data } = await api.post(`/cases/${id}/notes`, { text: noteText });
      setCase(data);
      setNoteText('');
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    finally { setUpdating(false); }
  };

  if (loading) return <div className="p-12 text-center text-muted-foreground">Loading case...</div>;
  if (!c) return null;

  const canManage = ['secretariat', 'admin'].includes(user?.role);
  const canUpdate = user?.role === 'case_manager' && c.assignedTo?._id === user._id || canManage;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href={user?.role === 'staff' ? '/dashboard/my-cases' : '/dashboard/cases'}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={15} /> Back to cases
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-blue-600 font-bold text-lg">{c.trackingId}</span>
              <StatusBadge status={c.status} />
              <SeverityBadge severity={c.severity} />
              {c.isAnonymous && <span className="status-badge bg-slate-100 text-slate-600">Anonymous</span>}
            </div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Syne, sans-serif' }}>{c.title}</h1>
          </div>
          <span className="text-4xl">{CATEGORY_ICONS[c.category]}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Main content */}
        <div className="col-span-2 space-y-5">
          <div className="neo-card p-5">
            <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Description</h2>
            <p className="text-sm text-foreground leading-relaxed">{c.description}</p>
          </div>

          {c.attachments?.length > 0 && (
            <div className="neo-card p-5">
              <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Attachments</h2>
              <div className="space-y-2">
                {c.attachments.map((a, i) => (
                  <a key={i} href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/uploads/cases/${a.filename}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm hover:bg-blue-50 text-blue-600 hover:underline">
                    📎 {a.originalName}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Notes / Activity */}
          <div className="neo-card p-5">
            <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Activity & Notes</h2>
            {c.notes?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {c.notes.map((n, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                      {(n.addedByName || 'U').charAt(0)}
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-foreground">{n.addedByName || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-sm">{n.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(canManage || (user?.role === 'case_manager')) && (
              <div className="flex gap-2 mt-3">
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={2}
                  placeholder="Add a note..."
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none bg-white" />
                <button onClick={handleAddNote} disabled={!noteText.trim() || updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 self-end transition-colors">
                  Add
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar details */}
        <div className="space-y-4">
          <div className="neo-card p-4 space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Details</h3>
            {[
              { icon: Tag, label: 'Category', value: c.category },
              { icon: MapPin, label: 'Department', value: c.department },
              { icon: MapPin, label: 'Location', value: c.location || '—' },
              { icon: Calendar, label: 'Submitted', value: formatDate(c.createdAt) },
              { icon: User, label: 'Submitted by', value: c.isAnonymous ? 'Anonymous' : (c.submitterName || 'Unknown') },
              { icon: User, label: 'Assigned to', value: c.assignedTo?.name || 'Unassigned' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2.5">
                <Icon size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Assign (Secretariat/Admin) */}
          {canManage && c.status === 'New' && (
            <div className="neo-card p-4">
              <h3 className="font-semibold text-sm mb-3">Assign Case Manager</h3>
              <select value={assignTo} onChange={e => setAssignTo(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm mb-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                <option value="">Select manager...</option>
                {managers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
              <button onClick={handleAssign} disabled={!assignTo || updating}
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                Assign
              </button>
            </div>
          )}

          {/* Status update */}
          {(canManage || (user?.role === 'case_manager')) && c.status !== 'Resolved' && (
            <div className="neo-card p-4">
              <h3 className="font-semibold text-sm mb-3">Update Status</h3>
              {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
              <select value={updateForm.status} onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm mb-2 bg-white focus:outline-none">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {updateForm.status === 'Resolved' && (
                <>
                  <textarea value={updateForm.resolution} onChange={e => setUpdateForm(f => ({ ...f, resolution: e.target.value }))}
                    placeholder="Resolution summary..." rows={2}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm mb-2 resize-none bg-white focus:outline-none" />
                  <textarea value={updateForm.actionTaken} onChange={e => setUpdateForm(f => ({ ...f, actionTaken: e.target.value }))}
                    placeholder="Action taken..." rows={2}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm mb-2 resize-none bg-white focus:outline-none" />
                </>
              )}
              <button onClick={handleStatusUpdate} disabled={updating}
                className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
