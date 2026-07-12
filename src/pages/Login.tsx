import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Zap, Eye, EyeOff, AlertCircle, Sparkles, Shield, TrendingUp, Truck } from 'lucide-react'
import { useAuth, type UserRole } from '@/contexts/AuthContext'


const DEMO_ROLES: { role: UserRole; label: string; email: string; color: string; icon: React.ReactNode; description: string }[] = [
  { role: 'fleet_manager', label: 'Fleet Manager', email: 'manager@transitops.demo', color: 'from-blue-600 to-blue-700', icon: <Zap className="w-4 h-4" />, description: 'Full access to all features' },
  { role: 'driver', label: 'Driver', email: 'driver@transitops.demo', color: 'from-green-600 to-green-700', icon: <Truck className="w-4 h-4" />, description: 'Own trips & fuel logs' },
  { role: 'safety_officer', label: 'Safety Officer', email: 'safety@transitops.demo', color: 'from-amber-600 to-amber-700', icon: <Shield className="w-4 h-4" />, description: 'Read vehicles & manage driver safety' },
  { role: 'financial_analyst', label: 'Financial Analyst', email: 'finance@transitops.demo', color: 'from-purple-600 to-purple-700', icon: <TrendingUp className="w-4 h-4" />, description: 'Read-only financial reports' },
]

export default function Login() {
  const { signIn, isDemo } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) {
      setError(err)
    } else {
      navigate(from, { replace: true })
    }
  }

  const handleDemoLogin = async (role: UserRole, email: string) => {
    setLoading(true)
    await signIn(email, 'demo', role)
    setLoading(false)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#1e1b4b] p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" aria-hidden="true" />
      <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} aria-hidden="true" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-800/10 rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative w-full max-w-4xl flex flex-col lg:flex-row gap-6 items-center">

        {/* Left — Branding */}
        <div className="flex-1 text-center lg:text-left text-white space-y-6 px-4">
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
              <Zap className="w-7 h-7 text-yellow-400" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">TransitOps</h1>
              <p className="text-blue-300 text-sm">Smart Transport Operations</p>
            </div>
          </div>
          <div className="space-y-3 hidden lg:block">
            <h2 className="text-4xl font-bold leading-tight">
              Fleet Command<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">At Your Fingertips</span>
            </h2>
            <p className="text-blue-200 text-lg leading-relaxed max-w-sm">
              Real-time visibility into your entire fleet, drivers, trips, and costs — all in one secure platform.
            </p>
          </div>
          <div className="hidden lg:flex flex-col gap-2 text-sm text-blue-300">
            {['Role-based access control', 'Real-time fleet tracking', 'Financial analytics & ROI'].map(f => (
              <div key={f} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right — Login Card */}
        <div className="w-full lg:w-[420px] flex-shrink-0">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">

            {/* Demo banner */}
            {isDemo && (
              <div className="flex items-center gap-2 px-3 py-2 mb-6 rounded-xl bg-yellow-400/20 border border-yellow-400/30">
                <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <span className="text-yellow-200 text-sm font-medium">Demo Mode — No Supabase required</span>
              </div>
            )}

            <h2 className="text-2xl font-bold text-white mb-1">Sign in</h2>
            <p className="text-blue-200 text-sm mb-6">
              {isDemo ? 'Choose a demo role to explore the platform.' : 'Enter your credentials to access the platform.'}
            </p>

            {/* Demo role picker */}
            {isDemo && (
              <div className="space-y-3 mb-6">
                <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Quick access — pick a role</p>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ROLES.map(({ role, label, email, color, icon, description }) => (
                    <button
                      key={role}
                      onClick={() => handleDemoLogin(role, email)}
                      disabled={loading}
                      className={`group relative flex flex-col items-start p-3 rounded-xl bg-gradient-to-br ${color} hover:opacity-90 active:scale-95 transition-all duration-150 text-white text-left shadow-lg`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {icon}
                        <span className="text-xs font-bold">{label}</span>
                      </div>
                      <span className="text-xs opacity-75 leading-tight">{description}</span>
                    </button>
                  ))}
                </div>
                <div className="relative flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-white/20" />
                  <span className="text-blue-300 text-xs">or sign in manually</span>
                  <div className="flex-1 h-px bg-white/20" />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div role="alert" className="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl bg-red-500/20 border border-red-400/30">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-blue-200 mb-1.5">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={isDemo ? 'manager@transitops.demo' : 'you@company.com'}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-blue-200 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="login-submit"
                disabled={loading || !email || !password}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-300 hover:to-orange-300 text-gray-900 font-bold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : 'Sign in'}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-blue-300/70">
              {isDemo ? '🔒 Demo mode — data resets on refresh' : 'Contact your Fleet Manager to request access.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
