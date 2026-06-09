import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function getMemoryTypeColor(type) {
  const colors = {
    fact: 'text-memory-fact',
    preference: 'text-memory-preference',
    context: 'text-memory-context',
    emotion: 'text-memory-emotion',
  }
  return colors[type] || 'text-text-secondary'
}

export function getMemoryTypeBg(type) {
  const colors = {
    fact: 'bg-memory-fact/10 border-memory-fact/20',
    preference: 'bg-memory-preference/10 border-memory-preference/20',
    context: 'bg-memory-context/10 border-memory-context/20',
    emotion: 'bg-memory-emotion/10 border-memory-emotion/20',
  }
  return colors[type] || 'bg-surface-hover border-border'
}

export function getAgentStatusColor(status) {
  const colors = {
    active: 'text-agent-active',
    idle: 'text-agent-idle',
    processing: 'text-agent-active',
    error: 'text-agent-error',
  }
  return colors[status] || 'text-text-secondary'
}
