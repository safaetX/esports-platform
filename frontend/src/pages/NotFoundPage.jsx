import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="font-display font-extrabold text-6xl neon-text">404</h1>
      <p className="text-slate-400 text-lg">Page not found</p>
      <Link to="/dashboard" className="btn-primary">Go Home</Link>
    </div>
  )
}