import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ParticleField } from '../components/ParticleField'
import { ThemeToggle } from '../components/ThemeToggle'
import { Brain, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { useLogin } from '../hooks/useAuth'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const loginMutation = useLogin()

  const handleSubmit = (e) => {
    e.preventDefault()
    loginMutation.mutate({ email: formData.email, password: formData.password })
  }

  const loading = loginMutation.isPending
  const errorMsg = loginMutation.error?.response?.data?.detail || loginMutation.error?.message || ''

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex">
      <ParticleField particleCount={80} connectionDistance={180} />

      {/* Left Side - Animated Graph */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/5" />
        <div className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center mx-auto mb-6 shadow-glow-lg">
              <Brain className="w-10 h-10 text-text-inverse" />
            </div>
            <h1 className="text-3xl font-bold text-text mb-3">Welcome back</h1>
            <p className="text-text-secondary max-w-sm mx-auto">
              Your AI memory is waiting. Sign in to continue managing your semantic knowledge graph.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-6 max-w-sm mx-auto"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-agent-active animate-pulse" />
              <span className="text-sm text-text-secondary">System Status</span>
            </div>
            <div className="space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Memories</span>
                <span className="text-text font-medium">12,847</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Active Agents</span>
                <span className="text-text font-medium">5</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Connected Apps</span>
                <span className="text-text font-medium">3</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center">
              <Brain className="w-5 h-5 text-text-inverse" />
            </div>
            <span className="text-lg font-semibold text-text">ContextOS</span>
          </div>

          <h2 className="text-2xl font-bold text-text mb-2">Sign in to ContextOS</h2>
          <p className="text-text-secondary mb-8">
            Enter your credentials to access your AI memory layer.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-base"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-base pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-border bg-surface text-accent focus:ring-accent/50" />
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
              <a href="#" className="text-sm text-accent hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            {errorMsg && (
              <p className="text-sm text-center" style={{ color: 'hsl(var(--danger))' }}>
                {errorMsg}
              </p>
            )}
          </form>

          <p className="text-center text-sm text-text-secondary mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:underline font-medium">
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
