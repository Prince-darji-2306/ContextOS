import { useEffect, useRef, useCallback } from 'react'
import { useThemeStore } from '../store/themeStore'

export function ParticleField({ className = '', connectionDistance = 160, particleCount = 60 }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animationRef = useRef(null)
  const { theme } = useThemeStore()

  const createParticles = useCallback((width, height) => {
    const particles = []
    for (let i = 0; i < particleCount; i++) {
      const tier = Math.random()
      const type = tier < 0.2 ? 'bright' : tier < 0.55 ? 'mid' : 'soft'
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.6 + 1.1,
        baseOpacity: Math.random() * 0.2 + 0.45,
        type,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.02,
      })
    }
    return particles
  }, [particleCount])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let width = canvas.width = window.innerWidth
    let height = canvas.height = window.innerHeight

    particlesRef.current = createParticles(width, height)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      particlesRef.current = createParticles(width, height)
    }

    window.addEventListener('resize', handleResize)

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      const particles = particlesRef.current
      const isDark = theme === 'dark'

      const colors = {
        bright: isDark ? '240, 240, 245' : '25, 25, 30',
        mid: isDark ? '200, 200, 210' : '70, 70, 78',
        soft: isDark ? '145, 145, 155' : '115, 115, 125',
        line: isDark ? '255, 255, 255' : '20, 20, 20',
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.pulse += p.pulseSpeed

        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        const pulseFactor = 0.82 + 0.18 * Math.sin(p.pulse)
        const particleColor = colors[p.type]
        const currentOpacity = p.baseOpacity * pulseFactor
        const currentRadius = p.radius * pulseFactor

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius * 3.2)
        gradient.addColorStop(0, `rgba(${particleColor}, ${currentOpacity})`)
        gradient.addColorStop(0.4, `rgba(${particleColor}, ${currentOpacity * 0.4})`)
        gradient.addColorStop(1, `rgba(${particleColor}, 0)`)

        ctx.beginPath()
        ctx.arc(p.x, p.y, currentRadius * 3.2, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        ctx.beginPath()
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${particleColor}, ${Math.min(1, currentOpacity + 0.18)})`
        ctx.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < connectionDistance) {
            const fade = 1 - dist / connectionDistance
            const opacity = fade * fade * (isDark ? 0.42 : 0.32)
            const lineGradient = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y)
            const pColor = colors[p.type]
            const p2Color = colors[p2.type]
            lineGradient.addColorStop(0, `rgba(${pColor}, ${opacity})`)
            lineGradient.addColorStop(1, `rgba(${p2Color}, ${opacity})`)

            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = lineGradient
            ctx.lineWidth = isDark ? 0.9 : 0.8
            ctx.stroke()
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [theme, connectionDistance, createParticles])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
    />
  )
}
