'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/utils';
import { BarChart2, Plus, Trash2, CheckCircle } from 'lucide-react';

function PollCard({ poll, onVote, onDelete, userId, canManage, isStaff }) {
  const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
  const userVotedIndex = poll.options.findIndex(o =>
    o.votes.some(v => (v._id || v) === userId)
  );
  const alreadyVoted = userVotedIndex !== -1;

  // Local pending selection (before submit)
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selected === null) return;
    setSubmitting(true);
    await onVote(poll._id, selected);
    setSubmitting(false);
    setSelected(null);
  };

  return (
    <div className="neo-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="font-semibold text-foreground mb-1">{poll.question}</p>
          <p className="text-xs text-muted-foreground">
            {timeAgo(poll.createdAt)} · {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {!poll.isActive && (
            <span className="status-badge bg-slate-100 text-slate-600">Closed</span>
          )}
          {alreadyVoted && <CheckCircle size={16} className="text-emerald-500" />}
          {canManage && (
            <button
              onClick={() => onDelete(poll._id)}
              className="text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {poll.options.map((opt, i) => {
          const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
          const isUserChoice = userVotedIndex === i;
          const isPending = selected === i;

          // After voted — show results
          if (alreadyVoted || !poll.isActive) {
            return (
              <div
                key={i}
                className={`relative overflow-hidden px-4 py-2.5 rounded-lg border text-sm ${
                  isUserChoice
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-border bg-slate-50'
                }`}
              >
                <div
                  className="absolute inset-0 left-0 bg-blue-200/40 rounded-lg transition-all"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between">
                  <span className={`font-medium ${isUserChoice ? 'text-blue-700' : 'text-foreground'}`}>
                    {opt.text}
                    {isUserChoice && (
                      <span className="ml-2 text-xs text-blue-500">(your vote)</span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">{pct}%</span>
                </div>
              </div>
            );
          }

          // Before voted — selectable radio-style options (staff only)
          return (
            <button
              key={i}
              onClick={() => isStaff && setSelected(i)}
              disabled={!isStaff}
              className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                !isStaff
                  ? 'border-border bg-slate-50 text-muted-foreground cursor-not-allowed'
                  : isPending
                  ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                  : 'border-border hover:border-blue-300 hover:bg-blue-50/50 text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  isPending ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                }`}>
                  {isPending && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                {opt.text}
              </div>
            </button>
          );
        })}
      </div>

      {/* Notice for non-staff */}
      {poll.isActive && !alreadyVoted && !isStaff && (
        <p className="mt-3 text-xs text-muted-foreground italic">
          Only staff members can vote in polls.
        </p>
      )}
      {poll.isActive && !alreadyVoted && isStaff && (
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={selected === null || submitting}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Vote'}
          </button>
          {selected !== null ? (
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear selection
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">Select an option to vote</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function PollsPage() {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ question: '', options: ['', ''] });
  const [creating, setCreating] = useState(false);

  const canManage = ['secretariat', 'admin'].includes(user?.role);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/polls');
      setPolls(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const vote = async (pollId, optionIndex) => {
    try {
      const { data } = await api.post(`/polls/${pollId}/vote`, { optionIndex });
      setPolls(ps => ps.map(p => p._id === pollId ? data : p));
    } catch (e) {
      alert(e.response?.data?.message || 'Vote failed');
    }
  };

  const deletePoll = async (id) => {
    if (!confirm('Delete this poll?')) return;
    await api.delete(`/polls/${id}`);
    setPolls(ps => ps.filter(p => p._id !== id));
  };

  const createPoll = async () => {
    const validOptions = form.options.filter(o => o.trim());
    if (!form.question || validOptions.length < 2) {
      alert('Question and at least 2 options required');
      return;
    }
    setCreating(true);
    try {
      const { data } = await api.post('/polls', {
        question: form.question,
        options: validOptions,
      });
      setPolls(ps => [data, ...ps]);
      setShowCreate(false);
      setForm({ question: '', options: ['', ''] });
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create poll');
    } finally {
      setCreating(false);
    }
  };

  const active = polls.filter(p => p.isActive);
  const closed = polls.filter(p => !p.isActive);

  return (
    <div className="max-w-2xl">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Polls</h1>
          <p className="page-subtitle">Vote on topics and see what your colleagues think.</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} /> Create Poll
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="neo-card p-5 mb-6 animate-fade-in">
          <h3 className="font-semibold mb-4">New Poll</h3>
          <input
            value={form.question}
            onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            placeholder="Poll question..."
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
          />
          <div className="space-y-2 mb-3">
            {form.options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={opt}
                  onChange={e => setForm(f => ({
                    ...f,
                    options: f.options.map((o, j) => j === i ? e.target.value : o)
                  }))}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none bg-white"
                />
                {form.options.length > 2 && (
                  <button
                    onClick={() => setForm(f => ({ ...f, options: f.options.filter((_, j) => j !== i) }))}
                    className="text-muted-foreground hover:text-red-500 px-2 transition-colors"
                  >✕</button>
                )}
              </div>
            ))}
            {form.options.length < 6 && (
              <button
                onClick={() => setForm(f => ({ ...f, options: [...f.options, ''] }))}
                className="text-sm text-blue-600 hover:underline"
              >
                + Add option
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={createPoll}
              disabled={creating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating...' : 'Create Poll'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-10 text-center text-muted-foreground">Loading polls...</div>
      ) : polls.length === 0 ? (
        <div className="neo-card p-12 text-center">
          <BarChart2 size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-medium">No polls yet</p>
          {canManage && (
            <p className="text-sm text-muted-foreground mt-1">Create the first poll for your staff.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active</h2>
              {active.map(p => (
                <PollCard
                  key={p._id}
                  poll={p}
                  onVote={vote}
                  onDelete={deletePoll}
                  userId={user?._id}
                  canManage={canManage}
                  isStaff={user?.role === 'staff'}
                />
              ))}
            </>
          )}
          {closed.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-6">Closed</h2>
              {closed.map(p => (
                <PollCard
                  key={p._id}
                  poll={p}
                  onVote={vote}
                  onDelete={deletePoll}
                  userId={user?._id}
                  canManage={canManage}
                  isStaff={user?.role === 'staff'}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}