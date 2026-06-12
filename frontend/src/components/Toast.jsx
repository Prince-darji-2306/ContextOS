import { create } from 'zustand'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '../lib/utils'

const useToastStore = create((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, toast.duration || 4000)
    return id
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))

export function useToast() {
  const { addToast } = useToastStore()
  return {
    success: (title, description) => addToast({ type: 'success', title, description }),
    error: (title, description) => addToast({ type: 'error', title, description }),
    warning: (title, description) => addToast({ type: 'warning', title, description }),
    info: (title, description) => addToast({ type: 'info', title, description }),
  }
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const styles = {
  success: 'border-success/30 bg-success-subtle/80',
  error: 'border-danger/30 bg-danger-subtle/80',
  warning: 'border-warning/30 bg-warning-subtle/80',
  info: 'border-border bg-surface/90',
}

function formatDescription(desc) {
  if (!desc) return null;
  if (typeof desc === 'string') return desc;
  if (Array.isArray(desc)) {
    return desc.map(item => {
      if (item && typeof item === 'object') {
        const path = item.loc ? item.loc.filter(p => p !== 'body' && p !== 'query').join('.') : '';
        const msg = item.msg || '';
        return path ? `${path}: ${msg}` : msg;
      }
      return String(item);
    }).join(', ');
  }
  if (typeof desc === 'object') {
    return JSON.stringify(desc);
  }
  return String(desc);
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-lg min-w-[320px] max-w-[420px]',
                styles[toast.type]
              )}
            >
              <Icon className={cn(
                'w-5 h-5 mt-0.5 shrink-0',
                toast.type === 'success' && 'text-success',
                toast.type === 'error' && 'text-danger',
                toast.type === 'warning' && 'text-warning',
                toast.type === 'info' && 'text-text-secondary',
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs text-text-secondary mt-0.5">{formatDescription(toast.description)}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-text-tertiary hover:text-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
