import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import { StatCard, LoadingState, GameBadge } from '../components/ui'
import { format } from 'date-fns'
import { Trophy, Users, Calendar, Zap } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [data, setData] = useState({ tournaments: [], matches: [], teams: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/tournaments/').catch(() => ({ data: [] })),
      api.get('/matches/?status=upcoming').catch(() => ({ data: [] })),
      api.get('/teams/').catch(() => ({ data: [] })),
    ]).then(([t, m, teams]) => {
      setData({ tournaments: t.data, matches: m.data.slice(0, 5), teams: teams.data })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />

  const upcomingMatches = data.matches.filter(m => m.status === 'upcoming').slice(0, 4)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="card-glow p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-2xl font-display font-800 text-slate-950">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div>
          <h2 className="font-display font-800 text-2xl text-white">
            Welcome back, <span className="neon-text">{user?.username}</span>
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {user?.role === 'admin' ? '⚡ Admin Panel — Full control' : '🎮 Ready to compete?'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tournaments" value={data.tournaments.length} icon="🏆" color="cyan" />
        <StatCard label="Teams" value={data.teams.length} icon="⚔️" color="purple" />
        <StatCard label="Upcoming" value={data.matches.length} icon="📅" color="green" />
        <StatCard label="Your Role" value={user?.role === 'admin' ? 'Admin' : 'Player'} icon={user?.role === 'admin' ? '⚡' : '🎮'} color="pink" />
      </div>

      {/* Content grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Tournaments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-700 text-white flex items-center gap-2"><Trophy className="w-4 h-4 text-neon-cyan" /> Tournaments</h3>
            <Link to="/tournaments" className="text-xs text-neon-cyan hover:underline font-display">View all →</Link>
          </div>
          <div className="space-y-3">
            {data.tournaments.slice(0, 4).map(t => (
              <Link key={t.id} to={`/tournaments/${t.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-all">
                <div>
                  <p className="text-sm font-display font-600 text-white">{t.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.registrations?.length ?? 0} / {t.max_participants} registered
                  </p>
                </div>
                <GameBadge game={t.game} />
              </Link>
            ))}
            {data.tournaments.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No tournaments yet</p>}
          </div>
        </div>

        {/* Upcoming Matches */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-700 text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-neon-cyan" /> Upcoming Matches</h3>
            <Link to="/schedule" className="text-xs text-neon-cyan hover:underline font-display">Schedule →</Link>
          </div>
          <div className="space-y-3">
            {upcomingMatches.map(m => (
              <div key={m.id} className="p-3 rounded-lg bg-slate-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-display font-600 text-white">{m.team_a?.name ?? 'TBD'}</span>
                    <span className="text-neon-cyan font-display font-700 text-xs">VS</span>
                    <span className="text-sm font-display font-600 text-white">{m.team_b?.name ?? 'TBD'}</span>
                  </div>
                  <span className="badge-cyan text-xs">{m.round_name || 'Match'}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {format(new Date(m.match_date), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
            ))}
            {upcomingMatches.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No upcoming matches</p>}
          </div>
        </div>
      </div>
    </div>
  )
}