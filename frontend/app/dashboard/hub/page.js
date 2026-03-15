'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, timeAgo } from '@/lib/utils';
import { Globe, FileText, TrendingUp, BookOpen, Plus, Search, Trash2 } from 'lucide-react';

const TYPES = ['digest', 'impact', 'minutes'];
const TYPE_LABELS = { digest: 'Quarterly Digest', impact: 'Impact Tracking', minutes: 'Meeting Minutes' };
const TYPE_ICONS = { digest: BookOpen, impact: TrendingUp, minutes: FileText };

export default function HubPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(null);
  const [creating, setCreating] = useState(false);

  const canManage = ['secretariat', 'admin'].includes(user?.role);

  const [digestForm, setDigestForm] = useState({ title: '', content: '', quarter: 'Q1', year: new Date().getFullYear() });
  const [impactForm, setImpactForm] = useState({ title: '', whatWasRaised: '', actionTaken: '', whatChanged: '', department: '' });
  const [minutesFile, setMinutesFile] = useState(null);
  const [minutesTitle, setMinutesTitle] = useState('');
  const [minutesDate, setMinutesDate] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'all') params.type = activeTab;
      if (search) params.search = search;
      const { data } = await api.get('/hub', { params });
      setItems(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [activeTab, search]);

  const deleteItem = async (id) => {
    if (!confirm('Delete this item?')) return;
    await api.delete(`/hub/${id}`);
    setItems(prev => prev.filter(i => i._id !== id));
  };

  const createDigest = async () => {
    setCreating(true);
    try { const { data } = await api.post('/hub/digest', digestForm); setItems(prev => [data, ...prev]); setShowCreate(null); }
    catch (e) { alert(e.response?.data?.message); }
    finally { setCreating(false); }
  };

  const createImpact = async () => {
    setCreating(true);
    try { const { data } = await api.post('/hub/impact', impactForm); setItems(prev => [data, ...prev]); setShowCreate(null); }
    catch (e) { alert(e.response?.data?.message); }
    finally { setCreating(false); }
  };

  const uploadMinutes = async () => {
    if (!minutesFile || !minutesTitle) { alert('Title and file required'); return; }
    setCreating(true);
    const fd = new FormData();
    fd.append('file', minutesFile);
    fd.append('title', minutesTitle);
    if (minutesDate) fd.append('meetingDate', minutesDate);
    try {
      const { data } = await api.post('/hub/minutes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setItems(prev => [data, ...prev]);
      setShowCreate(null);
    } catch (e) { alert(e.response?.data?.message); }
    finally { setCreating(false); }
  };

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe size={22} className="text-blue-600" />
            <h1 className="page-title">Public Hub</h1>
          </div>
          <p className="page-subtitle">Transparency in action — see how staff feedback drives real change.</p>
        </div>
        {canManage && (
          <div className="relative">
            <button onClick={() => setShowCreate(showCreate ? null : 'menu')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus size={16} /> Add Content
            </button>
            {showCreate === 'menu' && (
              <div className="absolute right-0 top-full mt-2 w-48 neo-card py-1 z-20 shadow-lg animate-fade-in">
                {[['digest', '📰 Quarterly Digest'], ['impact', '📈 Impact Entry'], ['minutes', '📄 Meeting Minutes']].map(([type, label]) => (
                  <button key={type} onClick={() => setShowCreate(type)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors">{label}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Forms */}
      {showCreate === 'digest' && (
        <div className="neo-card p-5 mb-6 animate-fade-in">
          <h3 className="font-semibold mb-4">📰 New Quarterly Digest</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select value={digestForm.quarter} onChange={e => setDigestForm(f => ({ ...f, quarter: e.target.value }))}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none">
              {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q}>{q}</option>)}
            </select>
            <input type="number" value={digestForm.year} onChange={e => setDigestForm(f => ({ ...f, year: e.target.value }))}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none" placeholder="Year" />
          </div>
          <input value={digestForm.title} onChange={e => setDigestForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title" className="w-full px-3 py-2 border border-border rounded-lg text-sm mb-3 bg-white focus:outline-none" />
          <textarea value={digestForm.content} onChange={e => setDigestForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Summary of this quarter..." rows={4}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm mb-3 resize-none bg-white focus:outline-none" />
          <div className="flex gap-2">
            <button onClick={createDigest} disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">{creating ? 'Publishing...' : 'Publish'}</button>
            <button onClick={() => setShowCreate(null)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      {showCreate === 'impact' && (
        <div className="neo-card p-5 mb-6 animate-fade-in">
          <h3 className="font-semibold mb-4">📈 New Impact Entry</h3>
          {[
            ['title', 'Title'],
            ['whatWasRaised', 'What was raised'],
            ['actionTaken', 'What action was taken'],
            ['whatChanged', 'What changed'],
            ['department', 'Department'],
          ].map(([key, label]) => (
            <input key={key} value={impactForm[key]} onChange={e => setImpactForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={label} className="w-full px-3 py-2 border border-border rounded-lg text-sm mb-3 bg-white focus:outline-none" />
          ))}
          <div className="flex gap-2">
            <button onClick={createImpact} disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">{creating ? 'Publishing...' : 'Publish'}</button>
            <button onClick={() => setShowCreate(null)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      {showCreate === 'minutes' && (
        <div className="neo-card p-5 mb-6 animate-fade-in">
          <h3 className="font-semibold mb-4">📄 Upload Meeting Minutes</h3>
          <input value={minutesTitle} onChange={e => setMinutesTitle(e.target.value)} placeholder="Meeting title"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm mb-3 bg-white focus:outline-none" />
          <input type="date" value={minutesDate} onChange={e => setMinutesDate(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm mb-3 bg-white focus:outline-none" />
          <label className="flex items-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-blue-400 mb-3">
            <FileText size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{minutesFile ? minutesFile.name : 'Click to upload PDF'}</span>
            <input type="file" accept=".pdf" onChange={e => setMinutesFile(e.target.files[0])} className="hidden" />
          </label>
          <div className="flex gap-2">
            <button onClick={uploadMinutes} disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">{creating ? 'Uploading...' : 'Upload'}</button>
            <button onClick={() => setShowCreate(null)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex border border-border rounded-lg overflow-hidden bg-white">
          {['all', ...TYPES].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:text-foreground hover:bg-slate-50'}`}>
              {tab === 'all' ? 'All' : TYPE_LABELS[tab]}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hub..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none" />
        </div>
      </div>

      {/* Items grid */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading...</div>
      ) : items.length === 0 ? (
        <div className="neo-card p-12 text-center">
          <Globe size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-medium">Nothing published yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map(item => {
            const Icon = TYPE_ICONS[item.type] || FileText;
            return (
              <div key={item._id} className="neo-card-hover p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">{TYPE_LABELS[item.type]}</span>
                      {item.quarter && <span className="text-xs text-muted-foreground">{item.quarter} {item.year}</span>}
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    {item.type === 'digest' && item.content && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
                    )}
                    {item.type === 'impact' && (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[['Raised', item.whatWasRaised], ['Action', item.actionTaken], ['Changed', item.whatChanged]].map(([label, val]) => (
                          <div key={label} className="bg-slate-50 rounded-lg p-2.5">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
                            <p className="text-xs text-foreground">{val}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {item.type === 'minutes' && (
                      <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/uploads/minutes/${item.filename}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1">
                        📄 Download PDF
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(item.createdAt)}</p>
                  </div>
                  {canManage && (
                    <button onClick={() => deleteItem(item._id)} className="text-muted-foreground hover:text-red-500 transition-colors mt-1">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
