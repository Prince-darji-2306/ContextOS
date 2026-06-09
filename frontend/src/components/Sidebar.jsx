import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Database, Network, Key, Plug, Cpu, Settings, LogOut, ChevronLeft, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { useThemeStore } from '../store/themeStore'

const items = [
  { to: '/dashboard', label: 'Home', icon: Home, exact: true },
  { to: '/dashboard/memories', label: 'Memory Browser', icon: Database },
  { to: '/dashboard/graph', label: 'Memory Graph', icon: Network },
  { to: '/dashboard/keys', label: 'API Keys', icon: Key },
  { to: '/dashboard/apps', label: 'Connected Apps', icon: Plug },
  { to: '/dashboard/agents', label: 'Agent Activity', icon: Cpu },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function NavList({ collapsed, onNavigate }) {
  const location = useLocation()
  return (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
      {items.map((it) => {
        const active = it.exact
          ? location.pathname === it.to
          : location.pathname === it.to || location.pathname.startsWith(it.to + '/')
        const Icon = it.icon
        return (
          <Link
            key={it.to}
            to={it.to}
            onClick={onNavigate}
            title={collapsed ? it.label : undefined}
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
              active
                ? 'text-foreground'
                : 'text-text-secondary hover:text-text hover:bg-accent/50'
            }`}
            style={active ? { background: 'hsl(var(--teal) / 0.1)' } : {}}
          >
            {active && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r"
                style={{ background: 'hsl(var(--teal))', boxShadow: '0 0 14px -2px hsl(var(--teal))' }}
              />
            )}
            <Icon
              className="h-4 w-4 shrink-0"
              style={active ? { color: 'hsl(var(--teal))' } : {}}
            />
            {!collapsed && <span className="truncate">{it.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

function UserFooter({ collapsed }) {
  const { theme } = useThemeStore()
  return (
    <div className="border-t border-border p-3 space-y-3">
      <div className={`flex ${collapsed ? 'justify-center' : 'justify-between'} items-center`}>
        <ThemeToggle />
        {!collapsed && <span className="text-xs text-text-secondary">Theme</span>}
      </div>
      {!collapsed ? (
        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <div className="h-9 w-9 rounded-full gradient-bg flex items-center justify-center text-sm font-semibold text-white shrink-0">
            P
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Prince</div>
            <div className="text-xs text-text-secondary truncate">prince@contextos.dev</div>
          </div>
          <Link to="/login" className="h-8 w-8 rounded-md hover:bg-accent flex items-center justify-center">
            <LogOut className="h-4 w-4 text-text-secondary" />
          </Link>
        </div>
      ) : (
        <div className="h-9 w-9 mx-auto rounded-full gradient-bg flex items-center justify-center text-sm font-semibold text-white">
          P
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="hidden md:flex flex-col border-r border-border h-screen sticky top-0 z-30"
      style={{ background: 'hsl(var(--sidebar))' }}
    >
      <div className="flex items-center justify-between p-4 border-b border-border h-16">
        <Logo size={collapsed ? 24 : 28} showText={!collapsed} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`h-7 w-7 rounded-md border border-border hover:bg-accent flex items-center justify-center transition-transform ${collapsed ? 'rotate-180' : ''}`}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>
      <NavList collapsed={collapsed} />
      <UserFooter collapsed={collapsed} />
    </motion.aside>
  )
}

export function MobileHeader() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header
        className="md:hidden h-14 border-b border-border flex items-center justify-between px-4 sticky top-0 z-40 backdrop-blur"
        style={{ background: 'hsl(var(--background) / 0.8)' }}
      >
        <button
          onClick={() => setOpen(true)}
          className="h-9 w-9 rounded-lg border border-border hover:bg-accent flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <Logo />
        <ThemeToggle />
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="md:hidden fixed inset-0 z-50 backdrop-blur-sm"
              style={{ background: 'hsl(var(--background) / 0.7)' }}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-64 border-r border-border flex flex-col shadow-2xl"
              style={{ background: 'hsl(var(--sidebar))' }}
            >
              <div className="flex items-center justify-between p-4 border-b border-border h-16">
                <Logo />
                <button
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 rounded-md border border-border hover:bg-accent flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <NavList collapsed={false} onNavigate={() => setOpen(false)} />
              <UserFooter collapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
