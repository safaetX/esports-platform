import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Key, LogOut, Trash2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Modal, Alert } from '../ui'

export default function AccountSettings() {
  const navigate = useNavigate()
  const { logout, changePassword, deleteAccount } = useAuthStore()
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  const changePw = async (e) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.next.length < 6) {
      setPwError('New password must be at least 6 characters')
      return
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError('Passwords do not match')
      return
    }
    setPwSaving(true)
    try {
      await changePassword(pwForm.current, pwForm.next)
      toast.success('Password changed successfully')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to change password'
      setPwError(msg)
      toast.error(msg)
    } finally {
      setPwSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)
    try {
      await deleteAccount()
      toast.success('Account deleted')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <section className="card p-5 lg:p-6">
      <h2 className="font-display font-700 text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Key className="w-5 h-5 text-neon-cyan" /> Account Settings
      </h2>

      <form onSubmit={changePw} className="space-y-3 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700/50">
        <h3 className="text-sm font-display font-600 text-slate-600 dark:text-slate-300">Change Password</h3>
        <Alert type="error" message={pwError} />
        <input type="password" className="input" placeholder="Current password" value={pwForm.current}
          onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))} required />
        <input type="password" className="input" placeholder="New password" value={pwForm.next}
          onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))} required minLength={6} />
        <input type="password" className="input" placeholder="Confirm new password" value={pwForm.confirm}
          onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} required />
        <button type="submit" disabled={pwSaving} className="btn-primary text-sm">
          {pwSaving ? 'Updating…' : 'Update Password'}
        </button>
      </form>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleLogout} className="btn-ghost flex items-center gap-2 text-sm">
          <LogOut className="w-4 h-4" /> Logout
        </button>
        <button type="button" onClick={() => setDeleteOpen(true)} className="btn-danger flex items-center gap-2 text-sm">
          <Trash2 className="w-4 h-4" /> Delete Account
        </button>
      </div>

      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setDeleteConfirm('') }} title="Delete Account">
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
          This action is permanent. All your data will be removed. Type <strong className="text-neon-pink">DELETE</strong> to confirm.
        </p>
        <input className="input mb-4" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder="Type DELETE" />
        <div className="flex gap-3">
          <button type="button" onClick={() => setDeleteOpen(false)} className="btn-ghost flex-1">Cancel</button>
          <button type="button" onClick={handleDelete} disabled={deleteConfirm !== 'DELETE' || deleting}
            className="btn-danger flex-1 border-neon-pink">
            {deleting ? 'Deleting…' : 'Delete Forever'}
          </button>
        </div>
      </Modal>
    </section>
  )
}
