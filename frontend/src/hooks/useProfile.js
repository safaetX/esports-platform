import { useCallback, useEffect, useState } from 'react'
import api from '../lib/api'

export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [gameProfiles, setGameProfiles] = useState([])
  const [team, setTeam] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [matches, setMatches] = useState([])
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [prof, st, gp, tm, th, mh, g] = await Promise.all([
        api.get('/players/me'),
        api.get('/players/me/stats').catch(() => ({ data: null })),
        api.get('/players/me/game-profiles'),
        api.get('/players/me/team').catch(() => ({ data: null })),
        api.get('/players/me/tournament-history'),
        api.get('/players/me/match-history'),
        api.get('/games/').catch(() => ({ data: [] })),
      ])
      setProfile(prof.data)
      setStats(st.data)
      setGameProfiles(gp.data)
      setTeam(tm.data)
      setTournaments(th.data)
      setMatches(mh.data)
      setGames(g.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return {
    profile,
    stats,
    gameProfiles,
    team,
    tournaments,
    matches,
    games,
    loading,
    error,
    reload: load,
    setGameProfiles,
    setProfile,
  }
}
