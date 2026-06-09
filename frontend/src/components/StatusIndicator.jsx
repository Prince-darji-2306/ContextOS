import { cn } from '../lib/utils'

export function StatusIndicator({ status, size = 'sm', pulse = true }) {
  const colors = {
    active: 'bg-agent-active',
    idle: 'bg-agent-idle',
    processing: 'bg-agent-active',
    error: 'bg-agent-error',
    connected: 'bg-agent-active',
    disconnected: 'bg-agent-error',
    success: 'bg-agent-active',
    warning: 'bg-agent-idle',
    danger: 'bg-agent-error',
  }

  const sizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  }

  return (
    <span className="relative inline-flex">
      {pulse && status === 'active' && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
            colors[status]
          )}
        />
      )}
      <span
        className={cn(
          'relative inline-flex rounded-full',
          sizes[size],
          colors[status]
        )}
      />
    </span>
  )
}
