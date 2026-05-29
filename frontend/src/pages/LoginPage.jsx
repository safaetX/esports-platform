import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Alert } from '../components/ui'
import { Swords, LogIn } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore(s => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-neon-purple/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 mb-4">
            <Swords className="w-8 h-8 text-neon-cyan" />
          </div>
          <h1 className="font-display font-900 text-3xl text-white tracking-tight">ESPORTS LEAGUE</h1>
          <p className="text-slate-500 text-sm mt-1">Enter the arena</p>
        </div>

        <div className="card-glow p-7 animate-slide-up">
          <h2 className="font-display font-700 text-xl text-white mb-6">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="you@esports.gg" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input" placeholder="••••••••" required />
            </div>

            <Alert type="error" message={error} />

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" /> : <LogIn className="w-4 h-4" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-5">
            No account?{' '}
            <Link to="/register" className="text-neon-cyan hover:underline font-display font-600">Register →</Link>
          </p>

          {/* Demo creds */}
          <div className="mt-5 p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
            <p className="text-xs text-slate-500 font-display font-600 mb-1">DEMO CREDENTIALS</p>
            <p className="text-xs text-slate-400 font-mono">Admin: admin@esports.gg / admin123</p>
            <p className="text-xs text-slate-400 font-mono">Player: shadow@esports.gg / shadow123</p>
          </div>
        </div>
      </div>
    </div>
  )
}