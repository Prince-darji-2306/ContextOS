import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ParticleField } from '../components/ParticleField'
import { ThemeToggle } from '../components/ThemeToggle'
import { AnimatedCounter } from '../components/AnimatedCounter'
import { ArrowRight, Brain, Plug, Network, ChevronRight, Github, BookOpen, Terminal } from 'lucide-react'
import { Link } from 'react-router-dom'

const codeSnippet = `// Store a memory
await contextos.remember(
  "User prefers JWT for auth",
  { tags: ["backend", "security"] }
)

// Retrieve context
const context = await contextos.recall(
  "authentication preferences"
)`

const features = [
  {
    icon: Brain,
    title: 'Semantic Memory',
    description: 'Store and retrieve context by meaning, not keywords. Powered by vector embeddings.',
  },
  {
    icon: Plug,
    title: 'MCP Native',
    description: 'Works with Claude Desktop, Cursor, Cline, Windsurf out of the box. One URL, one key.',
  },
  {
    icon: Network,
    title: 'Multi-Agent Coordination',
    description: 'Agents share context, detect conflicts, and stay aware of each other through ContextOS.',
  },
]

const stats = [
  { label: 'Memories Stored', value: 12847, suffix: '+' },
  { label: 'Active Agents', value: 5 },
  { label: 'Connected Apps', value: 3 },
  { label: 'API Calls Today', value: 61576, suffix: '+' },
]

const steps = [
  {
    number: '01',
    title: 'Install the MCP Server',
    description: 'One command to install. Works with Node.js 18+.',
    code: 'npm install -g @contextos/mcp-server',
  },
  {
    number: '02',
    title: 'Connect Your AI Tools',
    description: 'Add ContextOS to Claude Desktop, Cursor, or any MCP client.',
    code: '{"mcpServers": {"contextos": {"command": "contextos-mcp"}}}',
  },
  {
    number: '03',
    title: 'Start Building with Memory',
    description: 'Your AI agents now have persistent, semantic memory across sessions.',
    code: 'await contextos.remember("User context...")',
  },
]

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 30)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleField particleCount={80} connectionDistance={180} />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out',
          scrolled
            ? 'backdrop-blur-md bg-background/30 border-b border-border/20'
            : 'bg-transparent border-b border-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center">
              <Brain className="w-5 h-5 text-text-inverse" />
            </div>
            <span className="text-lg font-semibold text-text">ContextOS</span>
          </Link>
          <div className="flex items-center gap-4">
            <a href="#" className="text-sm text-text-secondary hover:text-text transition-colors">Docs</a>
            <a href="#" className="text-sm text-text-secondary hover:text-text transition-colors">GitHub</a>
            <ThemeToggle />
            <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-16">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-subtle mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-agent-active animate-pulse" />
            <span className="text-sm text-text-secondary">Now with multi-agent coordination</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-text mb-6"
          >
            <span className="block">One Memory Layer.</span>
            <span className="block gradient-text-animated">Every AI.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 text-balance"
          >
            ContextOS gives your AI agents persistent, semantic memory — across Claude Desktop, Cursor, Cline, and every MCP-compatible client.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link to="/register" className="btn-primary px-8 py-4 text-base group">
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#" className="btn-secondary px-8 py-4 text-base">
              <BookOpen className="w-4 h-4" />
              View Docs
            </a>
          </motion.div>

          {/* Code Snippet Card */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="max-w-xl mx-auto glass-strong rounded-2xl overflow-hidden shadow-glow"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-danger/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <span className="text-xs text-text-tertiary ml-2 font-mono">contextos.mjs</span>
            </div>
            <pre className="p-6 text-left text-sm font-mono text-text-secondary overflow-x-auto">
              <code>
                <span className="text-memory-preference">await</span> contextos.<span className="text-memory-fact">remember</span>(
                {'\n'}  <span className="text-memory-context">"User prefers JWT for auth"</span>,
                {'\n'}  {'{'} tags: [<span className="text-memory-emotion">"backend"</span>, <span className="text-memory-emotion">"security"</span>] {'}'}
                {'\n'})
              </code>
            </pre>
          </motion.div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 card-base card-hover"
              >
                <div className="text-3xl md:text-4xl font-bold text-text mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-text-secondary">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">Built for AI Infrastructure</h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Everything your AI agents need to remember, reason, and coordinate — in one unified layer.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 px-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={cn(
                  'rounded-2xl border border-border/60 p-6 transition-all duration-300',
                  'bg-surface/40 backdrop-blur-sm',
                  'hover:bg-surface/60 hover:border-border hover:-translate-y-0.5'
                )}
              >
                <feature.icon className="w-5 h-5 mb-5 text-text" strokeWidth={1.75} />
                <h3 className="text-lg font-semibold text-text mb-3">{feature.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">How It Works</h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Three steps to give your AI agents persistent memory.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative"
              >
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-border to-transparent -translate-x-8" />
                )}
                {i === 0 && (
                  <div className="hidden md:block absolute top-12 -left-8 w-full h-px bg-gradient-to-r from-border to-transparent" />
                )}
                <div className="text-5xl font-bold text-text/10 mb-4">{step.number}</div>
                <h3 className="text-xl font-semibold text-text mb-2">{step.title}</h3>
                <p className="text-text-secondary mb-4">{step.description}</p>
                <div className="glass rounded-xl p-4 font-mono text-sm text-text-secondary">
                  <Terminal className="w-4 h-4 inline mr-2 text-text-tertiary" />
                  {step.code}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card-base p-12 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-memory-fact/10 via-transparent to-memory-preference/10" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">Ready to Give Your AI Memory?</h2>
              <p className="text-text-secondary mb-8 max-w-lg mx-auto">
                Start free. No credit card required. Full access to all features.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="btn-primary px-8 py-4 text-base group">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#" className="btn-ghost text-base group">
                  Read the Documentation
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-border/50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center">
              <Brain className="w-4 h-4 text-text-inverse" />
            </div>
            <span className="text-sm font-medium text-text">ContextOS</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-text-secondary hover:text-text transition-colors">Docs</a>
            <a href="#" className="text-sm text-text-secondary hover:text-text transition-colors">GitHub</a>
            <a href="#" className="text-sm text-text-secondary hover:text-text transition-colors">Discord</a>
            <a href="#" className="text-sm text-text-secondary hover:text-text transition-colors">Twitter</a>
          </div>
          <p className="text-sm text-text-tertiary">© 2024 ContextOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
