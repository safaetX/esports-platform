import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { LoadingState, GameBadge, Alert, StatusBadge } from '../components/ui'
import { format, isPast } from 'date-fns'
import { Trophy, Users, Clock, ChevronLeft, Calendar, Star } from 'lucide-react'

export default function TournamentDetailPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [tournament, setTournament] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [regLoading, setRegLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = () => Promise.all([
    api.get(`/tournaments/${id}`),
    api.get(`/matches/?tournament_id=${id}`),
  ]).then(([t, m]) => { setTournament(t.data); setMatches(m.data) })
    .finally(() => setLoading(false))

  useEffect(() => { load() }, [id])

  const isRegistered = tournament?.registrations?.some(r => r.player_id === user?.id)
  const deadline = tournament ? new Date(tournament.registration_deadline) : null
  const closed = deadline ? isPast(deadline) : true

  const handleRegister = async () => {
    setError(''); setSuccess(''); setRegLoading(true)
    try {
      if (isRegistered) {
        await api.delete(`/tournaments/${id}/register`)
        setSuccess('Unregistered successfully')
      } else {
        await api.post(`/tournaments/${id}/register`, {})
        setSuccess('Registered successfully!')
      }
      await load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Action failed')
    } finally { setRegLoading(false) }
  }

  if (loading) return <LoadingState />
  if (!tournament) return <p className="text-slate-400">Tournament not found</p>

  return (
    <div className="animate-fade-in max-w-4xl">
      <Link to="/tournaments" className="inline-flex items-center gap-1 text-slate-400 hover:text-neon-cyan text-sm font-display mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Tournaments
      </Link>

      {/* Header */}
      <div className="card-glow p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GameBadge game={tournament.game} />
              {tournament.prize_pool && <span className="text-neon-green text-sm font-display font-700">💰 {tournament.prize_pool}</span>}
            </div>
            <h1 className="font-display font-800 text-2xl text-white mb-1">{tournament.name}</h1>
            {tournament.description && <p className="text-slate-400 text-sm">{tournament.description}</p>}
          </div>
          {user?.role === 'player' && (
            <button
              onClick={handleRegister}
              disabled={regLoading || (closed && !isRegistered)}
              className={isRegistered ? 'btn-danger' : 'btn-primary'}
            >
              {regLoading ? 'Loading…' : isRegistered ? 'Unregister' : closed ? 'Closed' : 'Register Now'}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-5 mt-5 pt-5 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Users className="w-4 h-4 text-neon-cyan" />
            <span>{tournament.registrations?.length ?? 0} / {tournament.max_participants} participants</span>
          </div>
          <div className={`flex items-center gap-2 text-sm ${closed ? 'text-neon-pink' : 'text-slate-400'}`}>
            <Clock className="w-4 h-4" />
            <span>{closed ? 'Registration closed' : `Deadline: ${format(deadline, 'PPP p')}`}</span>
          </div>
        </div>

        {(error || success) && (
          <div className="mt-4">
            <Alert type={success ? 'success' : 'error'} message={error || success} />
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full transition-all"
              style={{ width: `${Math.min(100, (tournament.registrations?.length ?? 0) / tournament.max_participants * 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Registrations */}
        <div className="card p-5">
          <h2 className="font-display font-700 text-white flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-neon-cyan" /> Participants ({tournament.registrations?.length ?? 0})
          </h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {tournament.registrations?.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-700/30">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-xs font-display font-700 text-slate-950">
                  {(r.player?.username || r.team?.name || '?')[0].toUpperCase()}
                </div>
                <span className="text-sm font-display text-white">{r.player?.username || r.team?.name || 'Unknown'}</span>
                {r.player_id === user?.id && <span className="ml-auto badge-cyan text-xs">You</span>}
              </div>
            ))}
            {(!tournament.registrations || tournament.registrations.length === 0) && (
              <p className="text-slate-500 text-sm text-center py-4">No participants yet</p>
            )}
          </div>
        </div>

        {/* Matches */}
        <div className="card p-5">
          <h2 className="font-display font-700 text-white flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-neon-cyan" /> Matches ({matches.length})
          </h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {matches.map(m => (
              <div key={m.id} className="p-3 rounded-lg bg-slate-700/30">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-sm font-display font-600 text-white">
                    <span>{m.team_a?.name ?? 'TBD'}</span>
                    <span className="text-neon-cyan">VS</span>
                    <span>{m.team_b?.name ?? 'TBD'}</span>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
                {m.result && (
                  <div className="flex items-center gap-1 text-sm font-mono font-600 text-neon-green">
                    <Star className="w-3 h-3" />
                    {m.result.score_team_a} – {m.result.score_team_b}
                  </div>
                )}
                <p className="text-xs text-slate-500">{m.round_name || 'Match'} · {format(new Date(m.match_date), 'MMM d, HH:mm')}</p>
              </div>
            ))}
            {matches.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No matches scheduled</p>}
          </div>
        </div>
      </div>
    </div>
  )
}