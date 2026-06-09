import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useSidebarStore } from '../store/sidebarStore'
import { useThemeStore } from '../store/themeStore'
import { ToastContainer } from '../components/Toast'
import {
  Brain, LayoutDashboard, Database, GitGraph, Key, Plug, Bot,
  ChevronLeft, ChevronRight, LogOut, Menu, X, Sun, Moon
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Database, label: 'Memories', path: '/dashboard/memories' },
  { icon: GitGraph, label: 'Graph', path: '/dashboard/graph' },
  { icon: Key, label: 'API Keys', path: '/dashboard/keys' },
  { icon: Plug, label: 'Connected Apps', path: '/dashboard/apps' },
  { icon: Bot, label: 'Agents', path: '/dashboard/agents' },
]

export default function DashboardLayout() {
  const { collapsed, toggle } = useSidebarStore()
  const { theme, toggleTheme } = useThemeStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    navigate('/login')
  }

  const handleProfile = () => {
    navigate('/dashboard/settings')
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass-strong border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-surface-hover">
            <Menu className="w-5 h-5 text-text" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center">
              <Brain className="w-4 h-4 text-text-inverse" />
            </div>
            <span className="font-semibold text-text">ContextOS</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-text-secondary" />
            ) : (
              <Moon className="w-5 h-5 text-text-secondary" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 h-full w-72 glass-strong border-r border-border z-50"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center">
                    <Brain className="w-5 h-5 text-text-inverse" />
                  </div>
                  <span className="font-semibold text-text">ContextOS</span>
                </Link>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-surface-hover">
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
              <nav className="p-3 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'bg-accent-subtle text-text font-medium'
                        : 'text-text-secondary hover:text-text hover:bg-surface-hover'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border space-y-1">
                <button
                  onClick={handleProfile}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text hover:bg-surface-hover w-full transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-text-inverse border border-border flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-semibold text-background">JD</span>
                  </div>
                  <span>Profile</span>
                </button>
                <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-danger hover:bg-danger-subtle w-full transition-all">
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 208 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col fixed left-4 top-4 bottom-4 z-40 glass-strong rounded-2xl"
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-border/50">
          <Link to="/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-text-inverse" />
            </div>
            <motion.span
              animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
              transition={{ duration: 0.2 }}
              className="font-semibold text-text whitespace-nowrap overflow-hidden"
            >
              ContextOS
            </motion.span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center rounded-xl text-sm transition-all duration-200 ${
                  collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-accent-subtle text-text font-medium'
                    : 'text-text-secondary hover:text-text hover:bg-surface-hover'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-xl bg-accent-subtle"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-text text-background text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-200 translate-x-[-4px] group-hover:translate-x-0 z-[60] shadow-lg">
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-2 border-t border-border/50 space-y-1">
          {/* Collapse Button */}
          <button
            onClick={toggle}
            className={`group relative flex items-center rounded-xl text-sm text-text-secondary hover:text-text hover:bg-surface-hover w-full transition-all ${
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
            }`}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 shrink-0" />
                <span className="whitespace-nowrap">Collapse</span>
              </>
            )}
            {collapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-text text-background text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-200 translate-x-[-4px] group-hover:translate-x-0 z-[60] shadow-lg">
                Expand
              </div>
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`group relative flex items-center rounded-xl text-sm text-text-secondary hover:text-text hover:bg-surface-hover w-full transition-all ${
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
            }`}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 shrink-0" />
            ) : (
              <Moon className="w-5 h-5 shrink-0" />
            )}
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="whitespace-nowrap"
              >
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </motion.span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-text text-background text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-200 translate-x-[-4px] group-hover:translate-x-0 z-[60] shadow-lg">
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </div>
            )}
          </button>

          {/* Profile Button */}
          <button
            onClick={handleProfile}
            className={`group relative flex items-center rounded-xl text-sm text-text-secondary hover:text-text hover:bg-surface-hover w-full transition-all ${
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
            }`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
              theme === 'dark'
                ? 'bg-white border-white'
                : 'bg-black border-black'
            }`}>
              <span className={`text-[10px] font-bold leading-none ${
                theme === 'dark' ? 'text-black' : 'text-white'
              }`}>JD</span>
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="whitespace-nowrap flex-1 text-left"
              >
                Profile
              </motion.span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-text text-background text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-200 translate-x-[-4px] group-hover:translate-x-0 z-[60] shadow-lg">
                Profile
              </div>
            )}
          </button>

          {/* Sign Out Button - only shown below profile in collapsed mode */}
          {collapsed && (
            <button
              onClick={handleLogout}
              className="group relative flex items-center justify-center px-0 py-2.5 rounded-xl text-sm text-text-secondary hover:text-danger hover:bg-danger-subtle w-full transition-all"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <div className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-text text-background text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-200 translate-x-[-4px] group-hover:translate-x-0 z-[60] shadow-lg">
                Sign Out
              </div>
            </button>
          )}

          {/* Sign Out Button - inline when expanded */}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-danger hover:bg-danger-subtle w-full transition-all"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className="whitespace-nowrap">Sign Out</span>
            </button>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        animate={{ marginLeft: collapsed ? 80 : 224 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:block min-h-screen"
      >
        {/* Page Content */}
        <div className={location.pathname === '/dashboard/graph' ? 'p-3' : 'p-6'}>
          <Outlet />
        </div>
      </motion.main>

      {/* Mobile Content */}
      <div className="lg:hidden pt-14 pb-20 px-4">
        <Outlet />
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border">
        <div className="flex items-center justify-around h-16">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                  isActive ? 'text-text' : 'text-text-tertiary'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}
