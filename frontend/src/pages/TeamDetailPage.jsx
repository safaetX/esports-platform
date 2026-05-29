import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { LoadingState, GameBadge, Modal, Alert } from '../components/ui'
import { Crown, Users, UserPlus, Trash2, ChevronLeft } from 'lucide-react'

function InviteModal({ open, onClose, team, onInvited }) {
  const [players, setPlayers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) api.get('/players/').then(r => setPlayers(r.data))
  }, [open])

  const invite = async (playerId) => {
    setError(''); setLoading(true)
    try {
      await api.post(`/teams/${team.id}/invites`, { invitee_id: playerId })
      onInvited(); onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to invite')
    } finally { setLoading(false) }
  }

  const memberIds = new Set(team.members?.map(m => m.player_id) || [])
  const filtered = players.filter(p =>
    !memberIds.has(p.id) &&
    p.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Modal open={open} onClose={onClose} title="Invite Player">
      <input value={search} onChange={e => setSearch(e.target.value)}
        className="input mb-3" placeholder="Search players…" />
      <Alert type="error" message={error} />
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filtered.map(p => (
          <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/40">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-neon-cyan/20 flex items-center justify-center text-xs font-display font-700 text-neon-cyan">
                {p.username[0].toUpperCase()}
              </div>
              <span className="text-sm font-display text-white">{p.username}</span>
            </div>
            <button onClick={() => invite(p.id)} disabled={loading}
              className="btn-primary text-xs py-1 px-3">Invite</button>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-slate-500 text-sm text-center py-3">No players found</p>}
      </div>
    </Modal>
  )
}

export default function TeamDetailPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inviteModal, setInviteModal] = useState(false)
  const [removing, setRemoving] = useState(null)

  const load = () => api.get(`/teams/${id}`).then(r => setTeam(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [id])

  const removeMember = async (playerId) => {
    setRemoving(playerId)
    try {
      await api.delete(`/teams/${id}/members/${playerId}`)
      await load()
    } finally { setRemoving(null) }
  }

  if (loading) return <LoadingState />
  if (!team) return <p className="text-slate-400">Team not found</p>

  const isCaptain = team.captain_id === user?.id
  const fullness = team.members?.length / (team.game?.team_size || 5)

  return (
    <div className="animate-fade-in max-w-2xl">
      <Link to="/teams" className="inline-flex items-center gap-1 text-slate-400 hover:text-neon-cyan text-sm font-display mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Teams
      </Link>

      {/* Team header */}
      <div className="card-glow p-6 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-neon-purple/30 to-neon-cyan/20 border border-slate-600/50 flex items-center justify-center text-3xl font-display font-800 text-white">
              {team.logo_url ? <img src={team.logo_url} className="w-full h-full object-cover rounded-xl" alt="" /> : team.name[0]}
            </div>
            <div>
              <h1 className="font-display font-800 text-2xl text-white">{team.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <GameBadge game={team.game} />
              </div>
            </div>
          </div>
          {isCaptain && (
            <button onClick={() => setInviteModal(true)} className="btn-primary flex items-center gap-2 text-sm">
              <UserPlus className="w-4 h-4" /> Invite
            </button>
          )}
        </div>

        {/* Size bar */}
        <div className="mt-5 pt-4 border-t border-slate-700/50">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {team.members?.length} / {team.game?.team_size} members</span>
            <span>{fullness >= 1 ? '✅ Full' : `${team.game?.team_size - team.members?.length} spots open`}</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full transition-all"
              style={{ width: `${Math.min(100, fullness * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="card p-5">
        <h2 className="font-display font-700 text-white mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-neon-cyan" /> Roster
        </h2>
        <div className="space-y-2">
          {team.members?.map(m => (
            <div key={m.id}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/30 to-neon-purple/20 flex items-center justify-center text-sm font-display font-700 text-neon-cyan">
                  {m.player?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-display font-600 text-white">{m.player?.username}</p>
                  <p className="text-xs text-slate-500">{m.player?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {m.role === 'captain'
                  ? <span className="badge-green"><Crown className="w-3 h-3" /> Captain</span>
                  : <span className="badge-slate">Member</span>
                }
                {isCaptain && m.player_id !== user.id && (
                  <button onClick={() => removeMember(m.player_id)} disabled={removing === m.player_id}
                    className="text-slate-500 hover:text-neon-pink transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <InviteModal
        open={inviteModal} onClose={() => setInviteModal(false)}
        team={team} onInvited={load}
      />
    </div>
  )
}