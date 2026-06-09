import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

export function GlassCard({ className, children, ...rest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('glass glass-hover card-shadow rounded-xl p-5', className)}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function TypeBadge({ type }) {
  const map = {
    semantic: 'bg-violet/15 text-violet border-violet/30',
    episodic: 'bg-teal/15 text-teal border-teal/30',
    summary: 'bg-amber/15 text-amber border-amber/30',
  }
  return (
    <span className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded border ${map[type] || 'bg-muted text-muted-foreground'}`}>
      {type}
    </span>
  )
}

export function AppBadge({ app }) {
  return (
    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-border bg-muted text-muted-foreground">
      {app}
    </span>
  )
}
