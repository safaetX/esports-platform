import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { LoadingState, EmptyState, Modal, Alert, PageHeader, GameBadge } from '../components/ui'
import { Trophy, Plus, Users, Clock } from 'lucide-react'
import { format, isPast } from 'date-fns'

function CreateTournamentModal({ open, onClose, games, onCreated }) {
  const [form, setForm] = useState({
    name: '', game_id: '', max_participants: 16,
    registration_deadline: '', description: '', prize_pool: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const payload = {
        ...form,
        game_id: parseInt(form.game_id),
        max_participants: parseInt(form.max_participants),
        registration_deadline: new Date(form.registration_deadline).toISOString(),
      }
      const { data } = await api.post('/tournaments/', payload)
      onCreated(data); onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create tournament')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Tournament">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Tournament Name</label>
          <input value={form.name} onChange={set('name')} className="input" placeholder="Valorant Cup 2025" required />
        </div>
        <div>
          <label className="label">Game</label>
          <select value={form.game_id} onChange={set('game_id')} className="input" required>
            <option value="">Select game…</option>
            {games.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Max Participants</label>
            <input type="number" value={form.max_participants} onChange={set('max_participants')} className="input" min={2} required />
          </div>
          <div>
            <label className="label">Prize Pool</label>
            <input value={form.prize_pool} onChange={set('prize_pool')} className="input" placeholder="$500 USD" />
          </div>
        </div>
        <div>
          <label className="label">Registration Deadline</label>
          <input type="datetime-local" value={form.registration_deadline} onChange={set('registration_deadline')} className="input" required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea value={form.description} onChange={set('description')} className="input resize-none" rows={3} placeholder="Tournament details…" />
        </div>
        <Alert type="error" message={error} />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating…' : 'Create Tournament'}
        </button>
      </form>
    </Modal>
  )
}

export default function TournamentsPage() {
  const { user } = useAuthStore()
  const [tournaments, setTournaments] = useState([])
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/tournaments/'), api.get('/games/')]).then(([t, g]) => {
      setTournaments(t.data); setGames(g.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tournaments"
        subtitle={`${tournaments.length} active tournaments`}
        action={user?.role === 'admin' && (
          <button className="btn-primary flex items-center gap-2" onClick={() => setModal(true)}>
            <Plus className="w-4 h-4" /> Create Tournament
          </button>
        )}
      />

      {tournaments.length === 0 ? (
        <EmptyState icon="🏆" title="No tournaments yet" description="Check back soon or ask an admin to create one." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tournaments.map(t => {
            const deadline = new Date(t.registration_deadline)
            const closed = isPast(deadline)
            const pct = Math.min(100, Math.round((t.registrations?.length ?? 0) / t.max_participants * 100))
            return (
              <Link key={t.id} to={`/tournaments/${t.id}`}
                className="card-glow p-5 block hover:border-neon-cyan/40 transition-all duration-200 hover:-translate-y-0.5">
                <div className="flex items-start justify-between mb-3">
                  <GameBadge game={t.game} />
                  {t.prize_pool && <span className="text-neon-green text-xs font-display font-700">💰 {t.prize_pool}</span>}
                </div>
                <h3 className="font-display font-700 text-white text-base mb-2 leading-tight">{t.name}</h3>
                {t.description && <p className="text-slate-400 text-xs mb-3 line-clamp-2">{t.description}</p>}

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.registrations?.length ?? 0} / {t.max_participants}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-cyan rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className={`flex items-center gap-1 text-xs font-display ${closed ? 'text-neon-pink' : 'text-slate-400'}`}>
                  <Clock className="w-3 h-3" />
                  {closed ? 'Registration closed' : `Closes ${format(deadline, 'MMM d, HH:mm')}`}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <CreateTournamentModal
        open={modal} onClose={() => setModal(false)} games={games}
        onCreated={t => setTournaments(prev => [t, ...prev])}
      />
    </div>
  )
}