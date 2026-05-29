import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { Modal, Alert } from '../ui'

export default function GameProfileModal({ open, onClose, games, profile, onSaved }) {
  const isEdit = Boolean(profile)
  const [form, setForm] = useState({ game_id: '', in_game_name: '', tag: '', rank: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedGame = games.find((g) => String(g.id) === String(form.game_id))

  useEffect(() => {
    if (!open) return
    if (profile) {
      setForm({
        game_id: String(profile.game_id),
        in_game_name: profile.in_game_name || '',
        tag: profile.tag || '',
        rank: profile.rank || '',
      })
    } else {
      setForm({ game_id: games[0] ? String(games[0].id) : '', in_game_name: '', tag: '', rank: '' })
    }
    setError('')
  }, [open, profile, games])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.in_game_name.trim() || form.in_game_name.trim().length < 2) {
      setError('In-game name must be at least 2 characters')
      return
    }
    if (selectedGame?.requires_tag && !form.tag.trim()) {
      setError(`${selectedGame.name} requires a tag`)
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        const { data } = await api.put(`/players/me/game-profiles/${profile.id}`, {
          in_game_name: form.in_game_name.trim(),
          tag: form.tag.trim() || null,
          rank: form.rank.trim() || null,
        })
        toast.success('Game profile updated')
        onSaved(data, 'update')
      } else {
        const { data } = await api.post('/players/me/game-profiles', {
          game_id: Number(form.game_id),
          in_game_name: form.in_game_name.trim(),
          tag: form.tag.trim() || null,
          rank: form.rank.trim() || null,
        })
        toast.success('Game profile added')
        onSaved(data, 'create')
      }
      onClose()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save game profile'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Game Profile' : 'Add Game Profile'}>
      <form onSubmit={submit} className="space-y-4">
        <Alert type="error" message={error} />
        {!isEdit && (
          <div>
            <label className="label">Game</label>
            <select className="input" value={form.game_id} onChange={set('game_id')} required>
              {games.map((g) => (
                <option key={g.id} value={g.id}>{g.icon || '🎮'} {g.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label">In-Game Name</label>
          <input className="input" value={form.in_game_name} onChange={set('in_game_name')} required />
        </div>
        {(selectedGame?.requires_tag || isEdit) && (
          <div>
            <label className="label">Tag {selectedGame?.requires_tag && '*'}</label>
            <input className="input" value={form.tag} onChange={set('tag')} placeholder="#TAG" />
          </div>
        )}
        <div>
          <label className="label">Rank</label>
          <input className="input" value={form.rank} onChange={set('rank')} placeholder="e.g. Diamond 2" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Add Profile'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
