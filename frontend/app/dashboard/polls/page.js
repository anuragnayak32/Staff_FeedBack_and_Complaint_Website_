'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/utils';
import { BarChart2, Plus, Trash2, CheckCircle, Users, Home, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

// Custom tooltip for the bar chart
function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
        <p className="font-semibold text-foreground">{payload[0].payload.name}</p>
        <p className="text-blue-600 font-bold">{payload[0].value} vote{payload[0].value !== 1 ? 's' : ''}</p>
        <p className="text-muted-foreground text-xs">{payload[0].payload.pct}% of total</p>
      </div>
    );
  }
  return null;
}

// Bar chart component shown after voting
function PollResultsChart({ poll, userVotedIndex }) {
  const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);

  const chartData = poll.options.map((opt, i) => ({
    name: opt.text.length > 20 ? opt.text.slice(0, 18) + '…' : opt.text,
    fullName: opt.text,
    votes: opt.votes.length,
    pct: totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0,
    isUserChoice: i === userVotedIndex,
  }));

  const BAR_COLORS = ['#3b5bdb', '#7048e8', '#0c8599', '#2f9e44', '#e67700', '#c2255c'];

  return (
    <div className="mt-4">
      {/* Summary row */}
      <div className="flex items-center gap-2 mb-3">
        <Users size={14} className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">
          {totalVotes} total vote{totalVotes !== 1 ? 's' : ''}
        </span>
        {userVotedIndex !== -1 && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle size={12} /> Your vote: {poll.options[userVotedIndex]?.text}
            </span>
          </>
        )}
      </div>

      {/* Recharts Bar Chart */}
      <div className="bg-slate-50 rounded-xl p-4 border border-border">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            margin={{ top: 16, right: 16, left: -10, bottom: 4 }}
            barSize={42}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isUserChoice ? '#2f9e44' : BAR_COLORS[i % BAR_COLORS.length]}
                  opacity={entry.isUserChoice ? 1 : 0.75}
                />
              ))}
              <LabelList
                dataKey="pct"
                position="top"
                formatter={(v) => `${v}%`}
                style={{ fontSize: 11, fontWeight: 600, fill: '#475569' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-3">
        {chartData.map((entry, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: entry.isUserChoice ? '#2f9e44' : BAR_COLORS[i % BAR_COLORS.length] }}
            />
            <span className={entry.isUserChoice ? 'text-emerald-700 font-semibold' : ''}>
              {entry.fullName} — {entry.votes} vote{entry.votes !== 1 ? 's' : ''}
              {entry.isUserChoice && ' ✓'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PollCard({ poll, onVote, onDelete, userId, canManage, isStaff }) {
  const router = useRouter();
  const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
  const userVotedIndex = poll.options.findIndex(o =>
    o.votes.some(v => (v._id || v) === userId)
  );
  const alreadyVoted = userVotedIndex !== -1;

  // Staff: show chart only after voting
  // Secretariat / Admin: always show chart
  const showChart = alreadyVoted || canManage || !poll.isActive;

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
      {/* Header */}
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
          {alreadyVoted && (
            <span className="status-badge bg-emerald-100 text-emerald-700">
              <CheckCircle size={11} /> Voted
            </span>
          )}
          {canManage && (
            <button
              onClick={() => onDelete(poll._id)}
              className="text-muted-foreground hover:text-red-500 transition-colors p-1"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── VOTING UI (staff who haven't voted yet on active poll) ── */}
      {isStaff && poll.isActive && !alreadyVoted && (
        <>
          <div className="space-y-2">
            {poll.options.map((opt, i) => {
              const isPending = selected === i;
              return (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    isPending
                      ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                      : 'border-border hover:border-blue-300 hover:bg-blue-50/50 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        isPending ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                      }`}
                    >
                      {isPending && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    {opt.text}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Submit / Clear */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={selected === null || submitting}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit Vote'}
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
        </>
      )}

      {/* ── NON-STAFF notice on active unvoted poll ── */}
      {!isStaff && poll.isActive && !canManage && (
        <p className="text-xs text-muted-foreground italic mt-1">
          Only staff members can vote in polls.
        </p>
      )}

      {/* ── RESULTS CHART (shown after voting for staff, always for secretariat/admin) ── */}
      {showChart && (
        <>
          <PollResultsChart poll={poll} userVotedIndex={userVotedIndex} />

          {/* Go to Home button — shown after staff votes, or always for secretariat/admin */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {alreadyVoted ? 'Thanks for voting!' : 'Viewing results'}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Home size={14} /> Go to Home
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                title="Back to home"
                className="w-8 h-8 flex items-center justify-center rounded-full border border-border hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-all"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Hint for staff before voting */}
      {isStaff && poll.isActive && !alreadyVoted && (
        <p className="text-xs text-muted-foreground mt-3 italic">
          Results will be shown after you submit your vote.
        </p>
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
  const isStaff = user?.role === 'staff';

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
    <div className="w-full max-w-2xl">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Polls</h1>
          <p className="page-subtitle">
            {isStaff
              ? 'Vote on topics — results revealed after you vote.'
              : 'Create polls and monitor participation in real time.'}
          </p>
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
                    options: f.options.map((o, j) => j === i ? e.target.value : o),
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
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Active Polls
              </h2>
              {active.map(p => (
                <PollCard
                  key={p._id}
                  poll={p}
                  onVote={vote}
                  onDelete={deletePoll}
                  userId={user?._id}
                  canManage={canManage}
                  isStaff={isStaff}
                />
              ))}
            </>
          )}
          {closed.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-6">
                Closed Polls
              </h2>
              {closed.map(p => (
                <PollCard
                  key={p._id}
                  poll={p}
                  onVote={vote}
                  onDelete={deletePoll}
                  userId={user?._id}
                  canManage={canManage}
                  isStaff={isStaff}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
