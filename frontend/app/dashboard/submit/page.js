'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { CheckCircle, Upload, X, AlertCircle, ArrowLeft } from 'lucide-react';

const CATEGORIES = ['Safety', 'Policy', 'Facilities', 'HR', 'Other'];
const SEVERITIES = ['Low', 'Medium', 'High'];
const DEPARTMENTS = ['Engineering', 'HR', 'Finance', 'Operations', 'Marketing', 'IT', 'Legal', 'Sales', 'Customer Service', 'Other'];

export default function SubmitCasePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', category: '', department: '',
    location: '', severity: 'Medium', isAnonymous: false
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles].slice(0, 5));
  };

  const removeFile = (i) => setFiles(f => f.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category || !form.department || !form.severity) {
      setError('Please fill all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach(f => fd.append('attachments', f));
      const { data } = await api.post('/cases', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Case Submitted!</h2>
        <p className="text-muted-foreground mb-4">Your case has been received and will be assigned shortly.</p>
        <div className="neo-card p-5 mb-6 inline-block">
          <p className="text-sm text-muted-foreground mb-1">Tracking ID</p>
          <p className="text-2xl font-bold font-mono text-blue-600">{success.trackingId}</p>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Save this ID to track your case status at any time.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push('/dashboard/my-cases')} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            View My Cases
          </button>
          <button onClick={() => { setSuccess(null); setForm({ title: '', description: '', category: '', department: '', location: '', severity: 'Medium', isAnonymous: false }); setFiles([]); }}
            className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="page-header flex items-start justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <h1 className="page-title">Submit a Case</h1>
          <p className="page-subtitle">Raise a complaint or feedback. You can choose to stay anonymous.</p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          title="Close form"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-red-50 hover:border-red-200 hover:text-red-500 text-muted-foreground transition-all mt-1"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={submit} className="neo-card p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Anonymous toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-border">
          <div>
            <p className="font-medium text-sm">Submit Anonymously</p>
            <p className="text-xs text-muted-foreground mt-0.5">Your name will not be attached to this submission</p>
          </div>
          <button type="button" onClick={() => setForm(f => ({ ...f, isAnonymous: !f.isAnonymous }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.isAnonymous ? 'bg-blue-600' : 'bg-slate-200'}`}>
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form.isAnonymous ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Case Title <span className="text-red-500">*</span></label>
          <input name="title" value={form.title} onChange={handle} required
            placeholder="Brief description of the issue"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Description <span className="text-red-500">*</span></label>
          <textarea name="description" value={form.description} onChange={handle} required rows={4}
            placeholder="Provide as much detail as possible..."
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Category <span className="text-red-500">*</span></label>
            <select name="category" value={form.category} onChange={handle} required
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Severity <span className="text-red-500">*</span></label>
            <select name="severity" value={form.severity} onChange={handle} required
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white">
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Department <span className="text-red-500">*</span></label>
            <select name="department" value={form.department} onChange={handle} required
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white">
              <option value="">Select department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Location</label>
            <input name="location" value={form.location} onChange={handle}
              placeholder="Floor, building, site..."
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white" />
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Attachments <span className="text-muted-foreground font-normal">(optional, max 5)</span></label>
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
            <Upload size={18} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Click to upload images or PDFs</span>
            <input type="file" multiple accept="image/*,.pdf" onChange={handleFiles} className="hidden" />
          </label>
          {files.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm">
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="text-muted-foreground text-xs">{(f.size / 1024).toFixed(1)}KB</span>
                  <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg font-semibold text-sm transition-colors">
          {loading ? 'Submitting...' : 'Submit Case'}
        </button>
      </form>
    </div>
  );
}
