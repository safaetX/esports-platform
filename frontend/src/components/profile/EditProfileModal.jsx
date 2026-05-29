import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { Modal, Alert } from '../ui'

export default function EditProfileModal({ open, onClose, profile, onSaved }) {
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    avatar_url: '',
    bio: '',
    country: '',
    favorite_game: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile && open) {
      setForm({
        full_name: profile.full_name || '',
        username: profile.username || '',
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
        country: profile.country || '',
        favorite_game: profile.favorite_game || '',
      })
      setError('')
    }
  }, [profile, open])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.username.trim().length < 3) {
      setError('Username must be at least 3 characters')
      return
    }
    setSaving(true)
    try {
      const { data } = await api.put('/players/me', {
        full_name: form.full_name.trim() || null,
        username: form.username.trim(),
        avatar_url: form.avatar_url.trim() || null,
        bio: form.bio.trim() || null,
        country: form.country.trim() || null,
        favorite_game: form.favorite_game.trim() || null,
      })
      toast.success('Profile updated successfully')
      onSaved(data)
      onClose()
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(', ')
        : detail || 'Failed to update profile'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile">
      <form onSubmit={submit} className="space-y-4">
        <Alert type="error" message={error} />
        <div>
          <label className="label">Full Name</label>
          <input className="input" value={form.full_name} onChange={set('full_name')} placeholder="Your full name" />
        </div>
        <div>
          <label className="label">Username</label>
          <input className="input" value={form.username} onChange={set('username')} required minLength={3} />
        </div>
        <div>
          <label className="label">Profile Picture URL</label>
          <input className="input" value={form.avatar_url} onChange={set('avatar_url')} placeholder="https://..." type="url" />
        </div>
        <div>
          <label className="label">Bio / About Me</label>
          <textarea className="input min-h-[80px] resize-y" value={form.bio} onChange={set('bio')} maxLength={500} placeholder="Tell others about yourself…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Country</label>
            <input className="input" value={form.country} onChange={set('country')} placeholder="e.g. USA" />
          </div>
          <div>
            <label className="label">Favorite Game</label>
            <input className="input" value={form.favorite_game} onChange={set('favorite_game')} placeholder="e.g. Valorant" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
