import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { LoadingState, EmptyState, Modal, Alert, PageHeader, GameBadge } from '../components/ui'
import { Users, Plus, Crown, Bell } from 'lucide-react'

function CreateTeamModal({ open, onClose, games, onCreated }) {
  const [form, setForm] = useState({ name: '', game_id: '', logo_url: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { data } = await api.post('/teams/', { ...form, game_id: parseInt(form.game_id) })
      onCreated(data); onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create team')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Team">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Team Name</label>
          <input value={form.name} onChange={set('name')} className="input" placeholder="Team Alpha" required />
        </div>
        <div>
          <label className="label">Game</label>
          <select value={form.game_id} onChange={set('game_id')} className="input" required>
            <option value="">Select game…</option>
            {games.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Logo URL (optional)</label>
          <input value={form.logo_url} onChange={set('logo_url')} className="input" placeholder="https://…" />
        </div>
        <Alert type="error" message={error} />
        <p className="text-xs text-slate-500">You must have a game profile for the selected game.</p>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating…' : 'Create Team'}
        </button>
      </form>
    </Modal>
  )
}

function InvitesBadge({ count }) {
  if (!count) return null
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-neon-pink text-slate-950 text-xs font-display font-700">
      {count}
    </span>
  )
}

export default function TeamsPage() {
  const { user } = useAuthStore()
  const [teams, setTeams] = useState([])
  const [games, setGames] = useState([])
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [inviteModal, setInviteModal] = useState(false)
  const [responding, setResponding] = useState(null)

  const load = () => Promise.all([
    api.get('/teams/'),
    api.get('/games/'),
    user?.role === 'player' ? api.get('/teams/invites/me') : Promise.resolve({ data: [] }),
  ]).then(([t, g, inv]) => {
    setTeams(t.data); setGames(g.data); setInvites(inv.data)
  }).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const respondInvite = async (inviteId, action) => {
    setResponding(inviteId)
    try {
      await api.post(`/teams/invites/${inviteId}/respond`, { action })
      await load()
    } finally { setResponding(null) }
  }

  if (loading) return <LoadingState />

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Teams"
        subtitle={`${teams.length} teams registered`}
        action={
          <div className="flex items-center gap-3">
            {user?.role === 'player' && invites.length > 0 && (
              <button onClick={() => setInviteModal(true)}
                className="btn-ghost flex items-center gap-2">
                <Bell className="w-4 h-4" /> Invites <InvitesBadge count={invites.length} />
              </button>
            )}
            {user?.role === 'player' && (
              <button className="btn-primary flex items-center gap-2" onClick={() => setModal(true)}>
                <Plus className="w-4 h-4" /> Create Team
              </button>
            )}
          </div>
        }
      />

      {teams.length === 0 ? (
        <EmptyState icon="⚔️" title="No teams yet" description="Be the first to create a team!" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map(t => (
            <Link key={t.id} to={`/teams/${t.id}`}
              className="card-glow p-5 block hover:border-neon-cyan/40 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-purple/30 to-neon-cyan/20 border border-slate-600/50 flex items-center justify-center text-lg font-display font-700 text-white">
                  {t.logo_url ? <img src={t.logo_url} className="w-full h-full object-cover rounded-lg" alt="" /> : t.name[0]}
                </div>
                <div>
                  <h3 className="font-display font-700 text-white text-base leading-tight">{t.name}</h3>
                  <GameBadge game={t.game} />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-700/50">
                <div className="flex items-center gap-1">
                  <Crown className="w-3 h-3 text-neon-green" />
                  <span>{t.captain?.username ?? 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{t.members?.length ?? 0} / {t.game?.team_size ?? '?'} members</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Invites modal */}
      <Modal open={inviteModal} onClose={() => setInviteModal(false)} title={`Team Invites (${invites.length})`}>
        <div className="space-y-3">
          {invites.map(inv => (
            <div key={inv.id} className="p-4 rounded-lg bg-slate-700/40 border border-slate-600/50">
              <p className="font-display font-600 text-white mb-1">{inv.team?.name}</p>
              <GameBadge game={inv.team?.game} />
              <div className="flex gap-2 mt-3">
                <button onClick={() => respondInvite(inv.id, 'accept')} disabled={responding === inv.id}
                  className="btn-primary flex-1 text-sm py-1.5">
                  {responding === inv.id ? '…' : '✅ Accept'}
                </button>
                <button onClick={() => respondInvite(inv.id, 'reject')} disabled={responding === inv.id}
                  className="btn-ghost flex-1 text-sm py-1.5">
                  {responding === inv.id ? '…' : '❌ Reject'}
                </button>
              </div>
            </div>
          ))}
          {invites.length === 0 && <p className="text-slate-500 text-center py-4">No pending invites</p>}
        </div>
      </Modal>

      <CreateTeamModal
        open={modal} onClose={() => setModal(false)} games={games}
        onCreated={t => setTeams(prev => [t, ...prev])}
      />
    </div>
  )
}