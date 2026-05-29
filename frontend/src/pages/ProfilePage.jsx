import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
  Pencil, Trophy, Swords, Users, Calendar, Star,
  Plus, Trash2, Crown, UserPlus, Settings,
} from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useProfile } from '../hooks/useProfile'
import {
  PageHeader, StatCard, SkeletonCard, Alert, StatusBadge, GameBadge, EmptyState,
} from '../components/ui'
import Avatar from '../components/profile/Avatar'
import EditProfileModal from '../components/profile/EditProfileModal'
import GameProfileModal from '../components/profile/GameProfileModal'
import AccountSettings from '../components/profile/AccountSettings'

function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card-glow p-6 flex gap-6">
        <div className="w-28 h-28 rounded-2xl bg-slate-700/50 animate-pulse shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-8 w-48 bg-slate-700/50 rounded animate-pulse" />
          <div className="h-4 w-64 bg-slate-700/50 rounded animate-pulse" />
          <div className="h-4 w-40 bg-slate-700/50 rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { refreshUser } = useAuthStore()
  const {
    profile, stats, gameProfiles, team, tournaments, matches, games,
    loading, error, reload, setGameProfiles, setProfile,
  } = useProfile()

  const [editOpen, setEditOpen] = useState(false)
  const [gameModal, setGameModal] = useState({ open: false, profile: null })

  const isPlayer = profile?.role === 'player'
  const recentMatches = matches.slice(0, 5)

  const handleProfileSaved = (data) => {
    setProfile(data)
    refreshUser()
  }

  const handleGameSaved = async (data, action) => {
    if (action === 'create') {
      setGameProfiles((prev) => [...prev, data])
    } else {
      setGameProfiles((prev) => prev.map((p) => (p.id === data.id ? data : p)))
    }
    await reload()
  }

  const deleteGameProfile = async (id) => {
    if (!window.confirm('Delete this game profile?')) return
    try {
      await api.delete(`/players/me/game-profiles/${id}`)
      setGameProfiles((prev) => prev.filter((p) => p.id !== id))
      toast.success('Game profile deleted')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete')
    }
  }

  if (loading) return <ProfileSkeleton />
  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Profile" />
        <Alert type="error" message={error} />
        <button onClick={reload} className="btn-primary">Retry</button>
      </div>
    )
  }

  const displayName = profile?.full_name || profile?.username
  const accountStatus = profile?.is_active !== false ? 'Active' : 'Suspended'
  const statusBadge = profile?.is_active !== false ? 'badge-green' : 'badge-pink'

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Profile"
        subtitle="Manage your account, stats, and competitive identity"
        action={
          <button onClick={() => setEditOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Pencil className="w-4 h-4" /> Edit Profile
          </button>
        }
      />

      {/* Overview */}
      <section className="card-glow p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <Avatar user={profile} size="xl" />
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-800 text-2xl text-slate-900 dark:text-white truncate">
              {displayName}
            </h2>
            <p className="text-neon-cyan font-display font-600 mt-0.5">@{profile?.username}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">{profile?.email}</p>
            {profile?.bio && (
              <p className="text-slate-600 dark:text-slate-300 text-sm mt-3 max-w-xl">{profile.bio}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className={profile?.role === 'admin' ? 'badge-purple' : 'badge-cyan'}>
                {profile?.role === 'admin' ? '⚡ Admin' : '🎮 Player'}
              </span>
              <span className={statusBadge}>{accountStatus}</span>
              {profile?.country && <span className="badge-slate">🌍 {profile.country}</span>}
              {profile?.favorite_game && <span className="badge-purple">❤️ {profile.favorite_game}</span>}
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 text-sm">
              <div>
                <dt className="label mb-0">Registration Date</dt>
                <dd className="text-slate-700 dark:text-slate-200 font-display">
                  {profile?.created_at ? format(new Date(profile.created_at), 'MMMM d, yyyy') : '—'}
                </dd>
              </div>
              <div>
                <dt className="label mb-0">Account Status</dt>
                <dd className="text-slate-700 dark:text-slate-200 font-display">{accountStatus}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Player Statistics */}
      {isPlayer && stats && (
        <section>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-neon-cyan" /> Player Statistics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard label="Tournaments" value={stats.tournaments_joined} icon="🏆" color="cyan" />
            <StatCard label="Matches" value={stats.matches_played} icon="⚔️" color="purple" />
            <StatCard label="Teams" value={stats.teams_joined} icon="👥" color="green" />
            <StatCard label="Wins" value={stats.wins} icon="✅" color="green" />
            <StatCard label="Losses" value={stats.losses} icon="❌" color="pink" />
            <StatCard label="Win Rate" value={`${stats.win_rate}%`} icon="📈" color="cyan" />
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Games */}
        <section className="card p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-700 text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Swords className="w-5 h-5 text-neon-purple" /> My Games
            </h2>
            <button
              onClick={() => setGameModal({ open: true, profile: null })}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <div className="space-y-3">
            {gameProfiles.map((gp) => (
              <div key={gp.id} className="p-4 rounded-xl bg-slate-100 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600/30">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <GameBadge game={gp.game} />
                    <p className="font-display font-600 text-slate-900 dark:text-white mt-2">{gp.in_game_name}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {gp.tag && <span>Tag: <span className="text-neon-cyan">{gp.tag}</span></span>}
                      {gp.rank && <span>Rank: <span className="text-neon-green">{gp.rank}</span></span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setGameModal({ open: true, profile: gp })}
                      className="p-2 rounded-lg text-slate-400 hover:text-neon-cyan hover:bg-neon-cyan/10"
                      aria-label="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteGameProfile(gp.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-neon-pink hover:bg-neon-pink/10"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {gameProfiles.length === 0 && (
              <EmptyState
                icon="🎮"
                title="No game profiles"
                description="Link your in-game identity for each title you compete in."
                action={
                  <button onClick={() => setGameModal({ open: true, profile: null })} className="btn-primary text-sm">
                    Add Game Profile
                  </button>
                }
              />
            )}
          </div>
        </section>

        {/* Team Membership */}
        <section className="card p-5 lg:p-6">
          <h2 className="font-display font-700 text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-neon-green" /> Team Membership
          </h2>
          {team ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {team.logo_url ? (
                  <img src={team.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-600" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center text-2xl border border-neon-cyan/20">
                    ⚔️
                  </div>
                )}
                <div>
                  <p className="font-display font-700 text-xl text-slate-900 dark:text-white">{team.team_name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{team.game_name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-neon-purple" /> Captain: {team.captain_name || 'Unknown'}
                  </p>
                </div>
              </div>
              {team.is_captain && (
                <div className="flex flex-wrap gap-2">
                  <Link to={`/teams/${team.team_id}`} className="btn-primary text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Manage Team
                  </Link>
                  <Link to={`/teams/${team.team_id}`} className="btn-ghost text-sm flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Invite Players
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8 font-display">
              No team joined yet.
            </p>
          )}
        </section>
      </div>

      {/* Tournament History */}
      <section className="card p-5 lg:p-6 overflow-x-auto">
        <h2 className="font-display font-700 text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-neon-cyan" /> Tournament History
        </h2>
        {tournaments.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/50">
                <th className="pb-3 font-display font-600">Tournament</th>
                <th className="pb-3 font-display font-600">Game</th>
                <th className="pb-3 font-display font-600">Status</th>
                <th className="pb-3 font-display font-600">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/40">
              {tournaments.map((t) => (
                <tr key={t.id} className="text-slate-700 dark:text-slate-200">
                  <td className="py-3 font-display font-600">
                    <Link to={`/tournaments/${t.tournament_id}`} className="hover:text-neon-cyan">
                      {t.tournament_name}
                    </Link>
                    {t.team_name && <span className="block text-xs text-slate-500">Team: {t.team_name}</span>}
                  </td>
                  <td className="py-3">{t.game_name || '—'}</td>
                  <td className="py-3"><StatusBadge status={t.registration_status} /></td>
                  <td className="py-3">{t.placement || <span className="text-slate-500">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-500 text-center py-6 text-sm">No tournament registrations yet.</p>
        )}
      </section>

      {/* Match History */}
      {isPlayer && (
        <section className="space-y-4">
          <h2 className="section-title flex items-center gap-2">
            <Calendar className="w-5 h-5 text-neon-cyan" /> Match History
          </h2>

          <div className="card p-5">
            <h3 className="font-display font-600 text-slate-900 dark:text-white mb-3">Recent Matches</h3>
            {recentMatches.length > 0 ? (
              <div className="space-y-2">
                {recentMatches.map((m) => (
                  <MatchRow key={m.id} match={m} compact />
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-4">No completed matches yet.</p>
            )}
          </div>

          <div className="card p-5 overflow-x-auto">
            <h3 className="font-display font-600 text-slate-900 dark:text-white mb-3">Full Match History</h3>
            {matches.length > 0 ? (
              <div className="space-y-2 min-w-[320px]">
                {matches.map((m) => (
                  <MatchRow key={m.id} match={m} />
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-4">No match history available.</p>
            )}
          </div>
        </section>
      )}

      {/* Account Settings */}
      <AccountSettings />

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
        onSaved={handleProfileSaved}
      />

      <GameProfileModal
        open={gameModal.open}
        onClose={() => setGameModal({ open: false, profile: null })}
        games={games}
        profile={gameModal.profile}
        onSaved={handleGameSaved}
      />
    </div>
  )
}

function MatchRow({ match, compact }) {
  const resultClass =
    match.result === 'Win'
      ? 'text-neon-green'
      : match.result === 'Loss'
        ? 'text-neon-pink'
        : 'text-slate-400'

  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-700/30 ${compact ? '' : 'border border-slate-200/50 dark:border-slate-600/20'}`}>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {format(new Date(match.match_date), 'MMM d, yyyy · HH:mm')}
          {!compact && match.tournament_name && ` · ${match.tournament_name}`}
        </p>
        <p className="font-display font-600 text-slate-900 dark:text-white text-sm mt-0.5">
          vs {match.opponent}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {match.is_mvp && (
          <span className="badge-purple flex items-center gap-1"><Star className="w-3 h-3" /> MVP</span>
        )}
        <span className={`font-display font-700 text-sm ${resultClass}`}>{match.result || '—'}</span>
        {match.score && <span className="text-slate-500 dark:text-slate-400 text-sm font-mono">{match.score}</span>}
      </div>
    </div>
  )
}
