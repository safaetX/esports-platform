import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { LoadingState, EmptyState, Modal, Alert, StatusBadge, GameBadge } from '../components/ui'
import { Calendar, Plus, Star, Edit, Trash2 } from 'lucide-react'
import { format, isPast } from 'date-fns'

function CreateMatchModal({ open, onClose, tournaments, teams, onCreated }) {
  const [form, setForm] = useState({ tournament_id: '', team_a_id: '', team_b_id: '', match_date: '', round_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const payload = {
        tournament_id: parseInt(form.tournament_id),
        team_a_id: parseInt(form.team_a_id),
        team_b_id: parseInt(form.team_b_id),
        match_date: new Date(form.match_date).toISOString(),
        round_name: form.round_name,
      }
      const { data } = await api.post('/matches/', payload)
      onCreated(data); onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create match')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Schedule Match">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Tournament</label>
          <select value={form.tournament_id} onChange={set('tournament_id')} className="input" required>
            <option value="">Select…</option>
            {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Team A</label>
            <select value={form.team_a_id} onChange={set('team_a_id')} className="input" required>
              <option value="">Select…</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Team B</label>
            <select value={form.team_b_id} onChange={set('team_b_id')} className="input" required>
              <option value="">Select…</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Match Date</label>
            <input type="datetime-local" value={form.match_date} onChange={set('match_date')} className="input" required />
          </div>
          <div>
            <label className="label">Round Name</label>
            <input value={form.round_name} onChange={set('round_name')} className="input" placeholder="Quarter Final" />
          </div>
        </div>
        <Alert type="error" message={error} />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Scheduling…' : 'Schedule Match'}
        </button>
      </form>
    </Modal>
  )
}

function ResultModal({ open, onClose, match, onSaved }) {
  const [form, setForm] = useState({ score_team_a: 0, score_team_b: 0, mvp_player_id: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    if (match?.result) {
      setForm({
        score_team_a: match.result.score_team_a,
        score_team_b: match.result.score_team_b,
        mvp_player_id: match.result.mvp_player_id || '',
      })
    }
  }, [match])

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const payload = {
        score_team_a: parseInt(form.score_team_a),
        score_team_b: parseInt(form.score_team_b),
        mvp_player_id: form.mvp_player_id ? parseInt(form.mvp_player_id) : null,
      }
      if (match.result) {
        await api.put(`/matches/${match.id}/result`, payload)
      } else {
        await api.post(`/matches/${match.id}/result`, payload)
      }
      onSaved(); onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save result')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Set Result: ${match?.team_a?.name} vs ${match?.team_b?.name}`}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">{match?.team_a?.name} Score</label>
            <input type="number" min={0} value={form.score_team_a} onChange={set('score_team_a')} className="input" required />
          </div>
          <div>
            <label className="label">{match?.team_b?.name} Score</label>
            <input type="number" min={0} value={form.score_team_b} onChange={set('score_team_b')} className="input" required />
          </div>
        </div>
        <div>
          <label className="label">MVP Player ID (optional)</label>
          <input type="number" value={form.mvp_player_id} onChange={set('mvp_player_id')} className="input" placeholder="Player ID" />
        </div>
        <Alert type="error" message={error} />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Saving…' : match?.result ? 'Update Result' : 'Set Result'}
        </button>
      </form>
    </Modal>
  )
}

export default function SchedulePage() {
  const { user } = useAuthStore()
  const [matches, setMatches] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [resultModal, setResultModal] = useState(null)
  const [tab, setTab] = useState('upcoming')

  const load = () => Promise.all([
    api.get('/matches/'),
    api.get('/tournaments/'),
    api.get('/teams/'),
  ]).then(([m, t, tm]) => {
    setMatches(m.data); setTournaments(t.data); setTeams(tm.data)
  }).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const deleteMatch = async (id) => {
    if (!confirm('Delete this match?')) return
    await api.delete(`/matches/${id}`)
    setMatches(prev => prev.filter(m => m.id !== id))
  }

  const upcoming = matches.filter(m => m.status === 'upcoming')
  const completed = matches.filter(m => m.status === 'completed')
  const displayed = tab === 'upcoming' ? upcoming : completed

  if (loading) return <LoadingState />

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="section-title">Schedule</h1>
          <p className="text-slate-400 text-sm mt-1">{upcoming.length} upcoming · {completed.length} completed</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn-primary flex items-center gap-2" onClick={() => setCreateModal(true)}>
            <Plus className="w-4 h-4" /> Schedule Match
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-slate-800/60 border border-slate-700/50 w-fit mb-6">
        {['upcoming', 'completed'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-display font-600 transition-all capitalize ${
              tab === t ? 'bg-neon-cyan text-slate-950' : 'text-slate-400 hover:text-white'
            }`}>
            {t} ({t === 'upcoming' ? upcoming.length : completed.length})
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <EmptyState icon={tab === 'upcoming' ? '📅' : '🏁'} title={`No ${tab} matches`} />
      ) : (
        <div className="space-y-4">
          {displayed.map(m => (
            <div key={m.id} className="card-glow p-5 flex flex-wrap items-center gap-4">
              {/* Teams */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-display font-700 text-white text-lg">{m.team_a?.name ?? 'TBD'}</span>
                  {m.result ? (
                    <div className="flex items-center gap-1 font-mono font-700">
                      <span className={m.result.score_team_a > m.result.score_team_b ? 'text-neon-green' : 'text-slate-400'}>
                        {m.result.score_team_a}
                      </span>
                      <span className="text-slate-500">—</span>
                      <span className={m.result.score_team_b > m.result.score_team_a ? 'text-neon-green' : 'text-slate-400'}>
                        {m.result.score_team_b}
                      </span>
                    </div>
                  ) : (
                    <span className="text-neon-cyan font-display font-700 text-xs px-2 py-0.5 rounded bg-neon-cyan/10">VS</span>
                  )}
                  <span className="font-display font-700 text-white text-lg">{m.team_b?.name ?? 'TBD'}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {m.round_name && <span className="badge-purple">{m.round_name}</span>}
                  <StatusBadge status={m.status} />
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(m.match_date), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>

                {m.result?.mvp && (
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-neon-green">
                    <Star className="w-3 h-3" /> MVP: {m.result.mvp.username}
                  </div>
                )}
              </div>

              {/* Admin controls */}
              {user?.role === 'admin' && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setResultModal(m)}
                    className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1">
                    <Edit className="w-3 h-3" />
                    {m.result ? 'Edit Result' : 'Set Result'}
                  </button>
                  <button onClick={() => deleteMatch(m.id)} className="btn-danger text-xs py-1.5 px-3">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateMatchModal
        open={createModal} onClose={() => setCreateModal(false)}
        tournaments={tournaments} teams={teams}
        onCreated={m => { setMatches(prev => [...prev, m]); setTab('upcoming') }}
      />

      {resultModal && (
        <ResultModal
          open={!!resultModal} match={resultModal}
          onClose={() => setResultModal(null)}
          onSaved={async () => { await load(); setResultModal(null) }}
        />
      )}
    </div>
  )
}