import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Alert } from '../components/ui'
import { Swords, UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, login } = useAuthStore()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await register(form.username, form.email, form.password)
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 mb-4">
            <Swords className="w-8 h-8 text-neon-cyan" />
          </div>
          <h1 className="font-display font-900 text-3xl text-white tracking-tight">ESPORTS LEAGUE</h1>
          <p className="text-slate-500 text-sm mt-1">Join the competition</p>
        </div>

        <div className="card-glow p-7 animate-slide-up">
          <h2 className="font-display font-700 text-xl text-white mb-6">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input value={form.username} onChange={set('username')} className="input" placeholder="YourGameTag" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={set('email')} className="input" placeholder="you@esports.gg" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" value={form.password} onChange={set('password')} className="input" placeholder="Min 6 characters" required minLength={6} />
            </div>

            <Alert type="error" message={error} />

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-neon-cyan hover:underline font-display font-600">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}