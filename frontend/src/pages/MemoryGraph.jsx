import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { MOCK_MEMORIES, formatRelative } from "../lib/mock"
import { TypeBadge, AppBadge } from "../components/Card"

export default function MemoryGraph() {
  const svgRef = useRef(null)
  const [threshold, setThreshold] = useState(0.62)
  const [types, setTypes] = useState({ semantic: true, episodic: true, summary: true })
  const [selected, setSelected] = useState(null)
  const [edgeCount, setEdgeCount] = useState(0)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    const w = svgRef.current.clientWidth || 800
    const h = svgRef.current.clientHeight || 600

    const defs = svg.append("defs")
    const glow = defs.append("filter").attr("id", "g-glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%")
    glow.append("feGaussianBlur").attr("stdDeviation", 3.5).attr("result", "b")
    const merge = glow.append("feMerge")
    merge.append("feMergeNode").attr("in", "b")
    merge.append("feMergeNode").attr("in", "SourceGraphic")

    const memories = MOCK_MEMORIES.filter((m) => types[m.type])
    const nodes = memories.map((m) => ({ id: m.id, mem: m, r: 4 + m.importance * 10 }))

    // pseudo-similarity from shared tags + same type
    const links = []
    for (let i = 0; i < memories.length; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        const a = memories[i], b = memories[j]
        const shared = a.tags.filter((t) => b.tags.includes(t)).length
        const base = shared * 0.25 + (a.type === b.type ? 0.35 : 0) + (a.app === b.app ? 0.15 : 0)
        const sim = Math.min(0.95, base + 0.1 * Math.random())
        if (sim >= threshold) links.push({ source: a.id, target: b.id, w: sim })
      }
    }
    setEdgeCount(links.length)

    const color = (t) => t === "semantic" ? "#8B7BFF" : t === "episodic" ? "#0FCEAC" : "#F59E0B"

    const container = svg.append("g")
    const linkSel = container.append("g")
      .attr("stroke", "currentColor").attr("stroke-opacity", 0.22)
      .selectAll("line").data(links).join("line")
      .attr("stroke-width", (d) => d.w * 1.6)
      .attr("stroke-linecap", "round")

    const nodeSel = container.append("g")
      .attr("filter", "url(#g-glow)")
      .selectAll("circle").data(nodes).join("circle")
      .attr("r", (d) => d.r)
      .attr("fill", (d) => color(d.mem.type))
      .attr("stroke", "rgba(255,255,255,0.25)").attr("stroke-width", 1.2)
      .style("cursor", "pointer")
      .style("opacity", 0)

    nodeSel.transition().delay((_, i) => i * 12).duration(400).style("opacity", 1)

    const tipSet = (hover) => {
      const connectedIds = new Set()
      if (hover) {
        connectedIds.add(hover.id)
        links.forEach((l) => {
          const s = typeof l.source === "string" ? l.source : l.source.id
          const t = typeof l.target === "string" ? l.target : l.target.id
          if (s === hover.id) connectedIds.add(t)
          if (t === hover.id) connectedIds.add(s)
        })
      }
      nodeSel.style("opacity", (d) => !hover ? 1 : connectedIds.has(d.id) ? 1 : 0.15)
        .style("filter", (d) => hover && d.id === hover.id ? "drop-shadow(0 0 12px var(--violet))" : "")
      linkSel.attr("stroke", (l) => {
        if (!hover) return "currentColor"
        const s = typeof l.source === "string" ? l.source : l.source.id
        const t = typeof l.target === "string" ? l.target : l.target.id
        return (s === hover.id || t === hover.id) ? "#6C63FF" : "currentColor"
      }).attr("stroke-opacity", (l) => {
        if (!hover) return 0.18
        const s = typeof l.source === "string" ? l.source : l.source.id
        const t = typeof l.target === "string" ? l.target : l.target.id
        return (s === hover.id || t === hover.id) ? 0.8 : 0.04
      })
    }

    nodeSel.on("mouseenter", (_, d) => tipSet(d))
      .on("mouseleave", () => tipSet(null))
      .on("click", (_, d) => setSelected(d.mem))

    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance((l) => 90 - l.w * 40).strength((l) => l.w * 0.6))
      .force("charge", d3.forceManyBody().strength(-110))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collide", d3.forceCollide().radius((d) => d.r + 3))
      .on("tick", () => {
        linkSel
          .attr("x1", (d) => d.source.x).attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x).attr("y2", (d) => d.target.y)
        nodeSel.attr("cx", (d) => d.x).attr("cy", (d) => d.y)
      })

    const zoom = d3.zoom().scaleExtent([0.3, 4]).on("zoom", (e) => {
      container.attr("transform", e.transform.toString())
    })
    svg.call(zoom)

    svgRef.current.__recenter = () => svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity)

    return () => { sim.stop() }
  }, [threshold, types])

  return (
    <div className="relative h-[calc(100vh-8.5rem)] lg:h-[calc(100vh-1.5rem)] w-full overflow-hidden graph-bg rounded-xl">
      <div className="absolute inset-0 graph-grid pointer-events-none" />
      <svg ref={svgRef} className="absolute inset-0 w-full h-full text-foreground/30">
        <defs>
          <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="link-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--violet)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--teal)" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>

      {/* mobile fallback */}
      <div className="md:hidden absolute inset-0 flex items-center justify-center p-6 text-center bg-background/80">
        <div>
          <h2 className="text-xl font-bold gradient-text">Memory Graph</h2>
          <p className="text-sm text-muted-foreground mt-2">Best viewed on desktop.</p>
        </div>
      </div>

      {/* title chip */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="hidden md:flex absolute top-6 left-6 glass card-shadow rounded-xl px-4 py-3 flex-col gap-1 z-20"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Knowledge Graph</span>
        <span className="text-sm font-semibold gradient-text">Semantic Memory Network</span>
      </motion.div>

      {/* legend */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="hidden md:flex absolute top-6 right-6 glass card-shadow rounded-xl px-4 py-3 items-center gap-4 z-20 text-xs"
      >
        {[
          { c: "var(--violet)", l: "Semantic" },
          { c: "var(--teal)", l: "Episodic" },
          { c: "var(--amber)", l: "Summary" },
        ].map((x) => (
          <div key={x.l} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: x.c, boxShadow: `0 0 10px ${x.c}` }} />
            <span className="text-muted-foreground">{x.l}</span>
          </div>
        ))}
      </motion.div>

      {/* toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="hidden md:flex absolute bottom-8 inset-x-0 mx-auto w-max max-w-[95%] glass card-shadow rounded-2xl px-5 py-3 items-center gap-4 z-20 text-sm flex-wrap justify-center"
      >
        <div className="flex gap-1.5">
          {["semantic", "episodic", "summary"].map((t) => (
            <button key={t} onClick={() => setTypes((p) => ({ ...p, [t]: !p[t] }))}
              className={`px-3 py-1.5 rounded-full text-xs border transition font-medium
              ${types[t]
                ? t === "semantic" ? "bg-violet/15 border-violet/40 text-violet"
                : t === "episodic" ? "bg-teal/15 border-teal/40 text-teal"
                : "bg-amber/15 border-amber/40 text-amber"
                : "border-border text-muted-foreground hover:bg-accent"}`}
            >{t}</button>
          ))}
        </div>
        <div className="h-6 w-px bg-border" />
        <label className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">similarity</span>
          <input type="range" min={0.5} max={0.9} step={0.01} value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))} className="accent-teal w-28" />
          <span className="font-mono w-10 text-foreground">{threshold.toFixed(2)}</span>
        </label>
      </motion.div>

      {selected && (
        <motion.aside
          initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }}
          className="absolute top-6 right-6 bottom-24 w-80 glass card-shadow rounded-xl p-5 z-20 overflow-y-auto scrollbar-thin"
          style={{ top: 96 }}
        >
          <div className="flex items-start justify-between mb-3">
            <span className="font-mono text-xs text-muted-foreground">{selected.id}</span>
            <button onClick={() => setSelected(null)} className="h-7 w-7 rounded hover:bg-accent flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-2 mb-3">
            <TypeBadge type={selected.type} /><AppBadge app={selected.app} />
          </div>
          <p className="text-sm font-mono leading-relaxed">{selected.content}</p>
          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <div>Importance: <span className="font-mono text-foreground">{selected.importance.toFixed(2)}</span></div>
            <div>Accessed: <span className="font-mono text-foreground">{selected.accessCount}×</span></div>
            <div>Created: <span className="font-mono text-foreground">{formatRelative(selected.createdAt)}</span></div>
          </div>
        </motion.aside>
      )}
    </div>
  )
}
