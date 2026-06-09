import { useEffect, useState, useRef } from 'react'

export function CountUp({ end, duration = 1.2, prefix = '', suffix = '' }) {
  const ref = useRef(null)
  const [v, setV] = useState(0)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    let raf = 0
    const tick = (t) => {
      const p = Math.min((t - start) / (duration * 1000), 1)
      setV(Math.floor(end * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, end, duration])

  return <span ref={ref}>{prefix}{v.toLocaleString()}{suffix}</span>
}
