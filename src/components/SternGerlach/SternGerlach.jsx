import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { RotateCcw, Info, Play, Layers, Plus, X, ChevronDown } from 'lucide-react'

// ─── Quantum spin physics ─────────────────────────────
// Spin measurement probabilities for a state measured along an axis
// State: spin eigenstate of some axis. Measure along another.
// P(+1/2) = cos²(θ/2) where θ is angle between preparation and measurement axes.

const INITIAL_STATES = {
  '|+z⟩': { label: 'Spin-Up along Z', stateVec: [0, 0] },      // theta=0, phi=0 on Bloch sphere
  '|−z⟩': { label: 'Spin-Down along Z', stateVec: [Math.PI, 0] },
  '|+x⟩': { label: 'Spin-Up along X', stateVec: [Math.PI / 2, 0] },
  '|−x⟩': { label: 'Spin-Down along X', stateVec: [Math.PI / 2, Math.PI] },
  '|+y⟩': { label: 'Spin-Up along Y', stateVec: [Math.PI / 2, Math.PI / 2] },
  '|−y⟩': { label: 'Spin-Down along Y', stateVec: [Math.PI / 2, 3 * Math.PI / 2] },
}

const MEASURE_AXES = {
  Z: { dir: [0, 0, 1], theta: 0, phi: 0 },
  X: { dir: [1, 0, 0], theta: Math.PI / 2, phi: 0 },
  Y: { dir: [0, 1, 0], theta: Math.PI / 2, phi: Math.PI / 2 },
}

// Angle between two Bloch sphere vectors
function blochAngle(state1, axis) {
  const [t1, p1] = state1
  const [t2, p2] = [MEASURE_AXES[axis].theta, MEASURE_AXES[axis].phi]
  // Bloch vector dot product
  const dot =
    Math.sin(t1) * Math.cos(p1) * Math.sin(t2) * Math.cos(p2) +
    Math.sin(t1) * Math.sin(p1) * Math.sin(t2) * Math.sin(p2) +
    Math.cos(t1) * Math.cos(t2)
  const angle = Math.acos(Math.max(-1, Math.min(1, dot)))
  return angle
}

function spinProbs(initialState, measureAxis) {
  const stateVec = INITIAL_STATES[initialState].stateVec
  const angle = blochAngle(stateVec, measureAxis)
  return {
    up: Math.cos(angle / 2) ** 2,
    down: Math.sin(angle / 2) ** 2,
  }
}

// Run N measurements
function simulate(initialState, measureAxis, n) {
  const { up } = spinProbs(initialState, measureAxis)
  let upCount = Math.round(n * up)
  return { up: upCount, down: n - upCount, total: n }
}

// ─── Beam Particle ────────────────────────────────────
function BeamParticle({ delay, upward }) {
  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
      animate={{
        x: [0, 80, 110, 150],
        y: [0, 0, upward ? -15 : 15, upward ? -45 : 45],
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.2, 1, 0.5],
      }}
      transition={{
        duration: 1.6,
        delay,
        times: [0, 0.45, 0.7, 1],
        ease: ['linear', 'easeInOut', 'easeOut']
      }}
      style={{
        position: 'absolute',
        width: 6, height: 6,
        borderRadius: '50%',
        background: upward ? '#00d4ff' : '#7b5ea7',
        boxShadow: `0 0 12px ${upward ? '#00d4ff' : '#7b5ea7'}, 0 0 24px ${upward ? '#00d4ff' : '#7b5ea7'}`,
        top: '50%', left: '30%', // Wait, earlier it was 30%... actually original code was left: '30%'. Wait! If left is 30%, x=0 starts at 30%.
        marginTop: -3,
        zIndex: 10,
      }}
    />
  )
}

// ─── Animated Canvas Apparatus ───────────────────────
function SternGerlachApparatus({ running, results, measureAxis, onLiveUpdate }) {
  const canvasRef = useRef(null)
  
  // State refs for animation
  const simState = useRef({
    particles: [],
    upCount: 0,
    downCount: 0,
    frame: 0,
    targetUp: 0,
    targetDown: 0,
    spawnedUp: 0,
    spawnedDown: 0,
    active: false,
    prevResultObj: null
  })

  // Start new simulation when results appear
  useEffect(() => {
    if (results && results !== simState.current.prevResultObj) {
      simState.current = {
        particles: [],
        upCount: 0,
        downCount: 0,
        frame: 0,
        targetUp: results.up,
        targetDown: results.down,
        spawnedUp: 0,
        spawnedDown: 0,
        active: true,
        prevResultObj: results
      }
      if (onLiveUpdate) onLiveUpdate({ up: 0, down: 0, total: results.total, done: false })
    }
  }, [results, onLiveUpdate])

  // Reset when un-running (but no new results)
  useEffect(() => {
    if (!running && !results) {
      simState.current.active = false
      simState.current.particles = []
      simState.current.upCount = 0
      simState.current.downCount = 0
    }
  }, [running, results])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId

    const W = 700
    const H = 230
    const CY = H / 2
    const detH = 80

    const spawnParticle = () => {
      const state = simState.current
      if (state.spawnedUp >= state.targetUp && state.spawnedDown >= state.targetDown) return false

      let spin = 1
      if (state.spawnedUp >= state.targetUp) {
        spin = -1
      } else if (state.spawnedDown >= state.targetDown) {
        spin = 1
      } else {
        spin = Math.random() < (state.targetUp / (state.targetUp + state.targetDown)) ? 1 : -1
      }

      if (spin === 1) state.spawnedUp++
      else state.spawnedDown++

      state.particles.push({
        x: 60, y: CY, vx: 3.2, vy: 0,
        spin: spin,
        deflecting: false, trail: [], alpha: 1,
        landed: false, landFlash: 0
      })
      return true
    }

    const drawMagnet = () => {
      const mx = 230, gap = 18
      ctx.save()
      
      // North pole (red/gold)
      ctx.strokeStyle = '#cc4422'
      ctx.lineWidth = 1.5
      ctx.fillStyle = '#1a0a04'
      ctx.beginPath()
      ctx.roundRect(mx - 28, CY - gap - 44, 56, 44, 4)
      ctx.fill()
      ctx.stroke()
      
      // South pole (blue)
      ctx.strokeStyle = '#2244cc'
      ctx.fillStyle = '#040a1a'
      ctx.beginPath()
      ctx.roundRect(mx - 28, CY + gap, 56, 44, 4)
      ctx.fill()
      ctx.stroke()
      
      ctx.font = 'bold 14px "Space Mono", monospace'
      ctx.fillStyle = '#ff6644'
      ctx.textAlign = 'center'
      ctx.fillText('N', mx, CY - gap - 18)
      ctx.fillStyle = '#4488ff'
      ctx.fillText('S', mx, CY + gap + 28)
      ctx.restore()

      drawFieldLines(mx, gap)

      ctx.save()
      ctx.fillStyle = '#3a6080'
      ctx.font = '9px "Space Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`SG-${measureAxis}`, mx, CY + gap + 58)
      ctx.restore()
    }

    const drawFieldLines = (mx, gap) => {
      const state = simState.current
      const t = state.active || running ? state.frame * 0.04 : 0
      for (let i = 0; i < 5; i++) {
        const ox = mx - 20 + i * 10
        // Use active pulsing only when running
        const baseAlpha = (state.active || running) ? 0.3 : 0.1
        const a = (state.active || running) ? baseAlpha + 0.2 * Math.sin(t + i * 0.8) : baseAlpha
        
        ctx.save()
        ctx.globalAlpha = a
        ctx.strokeStyle = '#334466'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 4])
        ctx.beginPath()
        ctx.moveTo(ox, CY - gap)
        ctx.lineTo(ox, CY + gap)
        ctx.stroke()
        ctx.restore()
      }
      ctx.setLineDash([])
    }

    const drawSource = () => {
      ctx.save()
      ctx.strokeStyle = '#00aacc'
      ctx.lineWidth = 1.5
      ctx.fillStyle = '#04161e'
      ctx.beginPath()
      ctx.roundRect(30, CY - 20, 36, 40, 4)
      ctx.fill()
      ctx.stroke()

      const state = simState.current
      if (state.active || running) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(state.frame * 0.2)
        ctx.shadowColor = '#00ccee'
        ctx.shadowBlur = 12
      }
      ctx.beginPath()
      ctx.arc(48, CY, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#00ccee'
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
      
      ctx.fillStyle = '#2a6080'
      ctx.font = '9px "Space Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('SOURCE', 48, CY + 35)
      ctx.restore()
    }

    const drawDetectors = () => {
      const dx = 640, barW = 14, maxH = detH
      const state = simState.current
      
      // We aim for the targeted final proportions so the bars fill naturally.
      // If we used live totals, it would jump around. 
      const totalTarget = (state.targetUp + state.targetDown) || 1
      const upH = Math.round((state.upCount / totalTarget) * maxH)
      const dnH = Math.round((state.downCount / totalTarget) * maxH)

      ctx.save()
      ctx.strokeStyle = '#0d3050'
      ctx.lineWidth = 1
      
      // Up detector
      ctx.strokeRect(dx, CY - maxH - 10, barW, maxH)
      if (upH > 0) {
        ctx.fillStyle = '#00ccee'
        ctx.shadowColor = '#00ccee'
        ctx.shadowBlur = 8
        ctx.fillRect(dx, CY - 10 - upH, barW, upH)
        ctx.shadowBlur = 0
      }
      
      // Down detector
      ctx.strokeRect(dx, CY + 10, barW, maxH)
      if (dnH > 0) {
        ctx.fillStyle = '#9966ff'
        ctx.shadowColor = '#9966ff'
        ctx.shadowBlur = 8
        ctx.fillRect(dx, CY + 10, barW, dnH)
        ctx.shadowBlur = 0
      }
      
      ctx.fillStyle = '#2a6080'
      ctx.font = '9px "Space Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('↑', dx + barW / 2, CY - maxH - 18)
      ctx.fillText('↓', dx + barW / 2, CY + maxH + 22)
      ctx.restore()
    }

    const drawBeamPath = () => {
      ctx.save()
      ctx.globalAlpha = 0.12
      ctx.strokeStyle = '#00ccee'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      ctx.moveTo(66, CY)
      ctx.lineTo(205, CY)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(255, CY)
      ctx.lineTo(380, CY - 30)
      ctx.lineTo(630, CY - detH * 0.6)
      ctx.stroke()
      
      ctx.strokeStyle = '#9966ff'
      ctx.beginPath()
      ctx.moveTo(255, CY)
      ctx.lineTo(380, CY + 30)
      ctx.lineTo(630, CY + detH * 0.6)
      ctx.stroke()
      
      ctx.setLineDash([])
      ctx.restore()
    }

    const update = () => {
      const state = simState.current
      if (state.active && state.frame % 3 === 0) {
        // limit particles simultaneously to keep performance and look good
        if (state.particles.length < 80) {
          spawnParticle()
        }
      }

      let landedThisFrame = false

      state.particles.forEach(p => {
        if (p.landed) return
        p.trail.push({ x: p.x, y: p.y })
        if (p.trail.length > 12) p.trail.shift()
        
        // Physics update
        if (p.x > 202 && !p.deflecting) { p.deflecting = true }
        if (p.deflecting && p.x > 255) {
          p.vy += p.spin * 0.055
          p.vy *= 0.98 // dampening
        }
        p.x += p.vx
        p.y += p.vy
        
        // Landing collision
        if (p.x >= 635) {
          p.landed = true
          p.landFlash = 8
          if (p.spin === 1) state.upCount++
          else state.downCount++
          landedThisFrame = true
        }
      })
      
      if (landedThisFrame && onLiveUpdate) {
        const done = (state.upCount + state.downCount) >= (state.targetUp + state.targetDown)
        if (done) state.active = false
        onLiveUpdate({ up: state.upCount, down: state.downCount, total: state.targetUp + state.targetDown, done })
      }
      
      state.particles = state.particles.filter(p => !p.landed || (p.landFlash > 0))
      state.particles.forEach(p => { if (p.landFlash > 0) p.landFlash-- })
      state.frame++
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      drawBeamPath()
      drawSource()
      drawMagnet()
      drawDetectors()
      
      const state = simState.current
      state.particles.forEach(p => {
        if (p.landed && p.landFlash <= 0) return
        const col = p.spin === 1 ? '#00ccee' : '#9966ff'
        const baseAlpha = p.landed ? (p.landFlash / 8) : 1
        
        for (let i = 0; i < p.trail.length; i++) {
          const a = (i / p.trail.length) * 0.7 * baseAlpha
          const sz = 1 + i * 0.15
          ctx.save()
          ctx.globalAlpha = a
          ctx.fillStyle = col
          ctx.beginPath()
          ctx.arc(p.trail[i].x, p.trail[i].y, sz, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
        
        if (!p.landed) {
          ctx.save()
          ctx.fillStyle = col
          ctx.globalAlpha = 1
          ctx.shadowColor = col
          ctx.shadowBlur = 6
          ctx.beginPath()
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        } else {
          // Landing flash
          ctx.save()
          ctx.globalAlpha = (p.landFlash / 8)
          ctx.fillStyle = col
          ctx.beginPath()
          ctx.arc(640 + 7, p.y, 10, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      })
    }

    const loop = () => {
      update()
      draw()
      animationId = requestAnimationFrame(loop)
    }

    animationId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animationId)
  }, [measureAxis, running, onLiveUpdate])

  return (
    <div className="w-full overflow-x-auto pb-4 -mb-4 hidden-scrollbar custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div style={{
        position: 'relative',
        height: 230,
        minWidth: 700,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(12,16,28,0.9) 0%, rgba(5,5,8,0.7) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* We wrap the canvas in an AnimatePresence crossfade mapped to measureAxis */}
        <AnimatePresence mode="wait">
          <motion.canvas
            key={measureAxis}
            ref={canvasRef}
            width={700}
            height={230}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'block', width: 700, height: 230 }}
          />
        </AnimatePresence>
      </div>
    </div>
  )
}


// ─── Sequential Chain ─────────────────────────────────
const GATE_COLORS = {
  Z: '#00ffb3',
  X: '#ff9a3c',
  Y: '#a78bfa',
}

const DEFAULT_CHAIN = [
  { axis: 'Z', id: 0 },
  { axis: 'X', id: 1 },
  { axis: 'Z', id: 2 },
]

// Map axis letter to the eigenstate name that results from spin-up on that axis
function axisToUpState(axis) {
  return { Z: '|+z⟩', X: '|+x⟩', Y: '|+y⟩' }[axis]
}

// Generic N-step chain: each step filters spin-up and feeds to next
function runChain(initialState, n, chainSteps) {
  const chain = []
  let currentN = n
  let currentUpState = initialState // The eigenstate label used for next step's probability lookup

  for (let i = 0; i < chainSteps.length; i++) {
    const axis = chainSteps[i].axis
    const probs = (i === 0)
      ? spinProbs(initialState, axis)
      : spinProbs(currentUpState, axis)

    let upCount = Math.round(currentN * probs.up)

    const displayAxis = (i > 0 && chainSteps.slice(0, i).some(s => s.axis === axis))
      ? `${axis} (re)` : axis

    chain.push({ axis: displayAxis, up: upCount, down: currentN - upCount, total: currentN })

    // Next stage receives only spin-up particles, collapsed into this axis's up eigenstate
    currentN = upCount
    currentUpState = axisToUpState(axis)
  }

  return chain
}

// ─── Main Component ───────────────────────────────────
export default function SternGerlach() {
  const [initialState, setInitialState] = useState('|+z⟩')
  const [measureAxis, setMeasureAxis] = useState('Z')
  const [nParticles, setNParticles] = useState(500)
  const [results, setResults] = useState(null)
  const [running, setRunning] = useState(false)
  const [chainResults, setChainResults] = useState(null)
  const [showInfo, setShowInfo] = useState(false)
  const [mode, setMode] = useState('single') // 'single' or 'chain'
  const [chainGates, setChainGates] = useState(() => DEFAULT_CHAIN.map(g => ({ ...g })))
  const nextGateId = useRef(3)

  const [liveResults, setLiveResults] = useState(null)

  const theoreticalProbs = spinProbs(initialState, measureAxis)

  const runExperiment = () => {
    setRunning(true)
    setChainResults(null)
    const res = simulate(initialState, measureAxis, nParticles)
    setResults(res)
    setLiveResults({ up: 0, down: 0, total: res.total, done: false })
  }

  const runChainExperiment = () => {
    setRunning(true)
    setResults(null)
    setLiveResults(null)
    setTimeout(() => {
      const chain = runChain(initialState, nParticles, chainGates)
      setChainResults(chain)
      setRunning(false)
    }, 400)
  }

  // ─── Chain gate management ───────────────────────────
  const addGate = (axis = 'Z') => {
    if (chainGates.length >= 6) return
    setChainGates(prev => [...prev, { axis, id: nextGateId.current++ }])
    setChainResults(null)
  }

  const removeGate = (id) => {
    if (chainGates.length <= 1) return
    setChainGates(prev => prev.filter(g => g.id !== id))
    setChainResults(null)
  }

  const updateGateAxis = (id, newAxis) => {
    setChainGates(prev => prev.map(g => g.id === id ? { ...g, axis: newAxis } : g))
    setChainResults(null)
  }

  const handleReset = () => {
    setResults(null)
    setLiveResults(null)
    setChainResults(null)
    setInitialState('|+z⟩')
    setMeasureAxis('Z')
    setNParticles(500)
    setMode('single')
    setChainGates(DEFAULT_CHAIN.map(g => ({ ...g })))
    nextGateId.current = 3
  }

  const chartData = results ? [
    { label: 'Spin Up (↑)', count: results.up, fraction: results.up / results.total, theory: theoreticalProbs.up, color: '#00d4ff' },
    { label: 'Spin Down (↓)', count: results.down, fraction: results.down / results.total, theory: theoreticalProbs.down, color: '#7b5ea7' },
  ] : []

  return (
    <div className="px-5 py-8 md:px-8 md:py-12 pb-24 md:max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 32 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: '#00ffb3', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
              Module 03
            </div>
            <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 0.95, color: 'var(--text)', margin: 0 }}>
              STERN–GERLACH<br />
              <span style={{ color: '#00ffb3', textShadow: '0 0 30px rgba(0,255,179,0.3)' }}>EXPERIMENT</span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowInfo(!showInfo)}
              style={{
                background: showInfo ? 'rgba(0,255,179,0.08)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${showInfo ? 'rgba(0,255,179,0.25)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8, padding: '10px 16px',
                color: showInfo ? '#00ffb3' : 'var(--muted)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: '"Space Mono", monospace', fontSize: 11, transition: 'all 0.2s',
              }}
            >
              <Info size={14} /> Info
            </button>
            <button
              onClick={handleReset}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '10px 16px', color: 'var(--muted)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: '"Space Mono", monospace', fontSize: 11, transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>
        <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, #00ffb3, transparent 60%)', opacity: 0.25, marginTop: 16 }} />
      </motion.div>

      {/* Info */}
      {showInfo && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ marginBottom: 24, padding: '16px 20px', background: 'rgba(0,255,179,0.04)', border: '1px solid rgba(0,255,179,0.15)', borderRadius: 10, fontSize: 13, color: 'var(--label)', lineHeight: 1.7 }}>
          <strong style={{ color: '#00ffb3' }}>Stern–Gerlach (1922):</strong> A beam of silver atoms passed through an inhomogeneous magnetic field splits into discrete spots — proof of quantized angular momentum. Each particle's spin is projected onto the measurement axis. The <strong style={{ color: '#00ffb3' }}>sequential experiment</strong> (SGz→SGx→SGz) dramatically shows that measuring the X-component destroys information about the Z-component.
        </motion.div>
      )}

      {/* Mode tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'single', label: 'Single Apparatus', icon: Play },
          { id: 'chain', label: `Sequential ${chainGates.map(g => `SG${g.axis.toLowerCase()}`).join('→')}`, icon: Layers },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            style={{
              background: mode === id ? 'rgba(0,255,179,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${mode === id ? 'rgba(0,255,179,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 8, padding: '10px 18px',
              color: mode === id ? '#00ffb3' : 'var(--muted)',
              cursor: 'pointer', fontFamily: '"Space Mono", monospace', fontSize: 11,
              display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
            }}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        {/* Left: visualization + results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {mode === 'single' && (
            <>
              {/* Apparatus */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <SternGerlachApparatus 
                  running={running} 
                  results={results} 
                  measureAxis={measureAxis} 
                  onLiveUpdate={(update) => {
                    setLiveResults(update)
                    if (update.done) setRunning(false)
                  }}
                />
              </motion.div>

              {/* Results */}
              {results && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  {/* Count readout (instant final value) */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: 'Spin Up ↑', value: results.up, color: '#00d4ff' },
                      { label: 'Spin Down ↓', value: results.down, color: '#7b5ea7' },
                      { label: 'Total', value: results.total, color: 'var(--text)' },
                    ].map((s, i) => (
                      <div key={i} className={`p-4 ${i === 2 ? 'col-span-2 md:col-span-1' : ''}`} style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 10,
                        textAlign: 'center',
                      }}>
                        <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          {s.label}
                        </div>
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 36, color: s.color, lineHeight: 1 }}
                        >
                          {s.value}
                        </motion.div>
                        <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                          {((results.total) > 0 ? (s.value / results.total) * 100 : 0).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chart (revealed instantly) */}
                  <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 14, padding: '20px',
                      }}>
                      <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
                        Observed vs Theoretical
                      </div>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                          <XAxis dataKey="label" tick={{ fontFamily: '"Space Mono", monospace', fontSize: 10, fill: '#9ca3af' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                          <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontFamily: '"Space Mono", monospace', fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} domain={[0, 1]} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null
                              const d = payload[0].payload
                              return (
                                <div style={{ background: 'rgba(5,5,8,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', fontFamily: '"Space Mono", monospace', fontSize: 11 }}>
                                  <div style={{ color: d.color, marginBottom: 4 }}>{d.label}</div>
                                  <div style={{ color: 'var(--text)' }}>Observed: {(d.fraction * 100).toFixed(1)}%</div>
                                  <div style={{ color: 'var(--muted)' }}>Theory: {(d.theory * 100).toFixed(1)}%</div>
                                </div>
                              )
                            }}
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                          />
                          <Bar dataKey="fraction" radius={[4, 4, 0, 0]} name="Observed">
                            {chartData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.8} />)}
                          </Bar>
                          <Bar dataKey="theory" radius={[4, 4, 0, 0]} name="Theory" fillOpacity={0.3}>
                            {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8 }}>
                        {[['Observed', 0.8], ['Theory', 0.3]].map(([lbl, op]) => (
                          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--cyan)', opacity: op }} />
                            <span style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: 'var(--muted)' }}>{lbl}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                </motion.div>
              )}
            </>
          )}

          {mode === 'chain' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Chain diagram */}
              <div style={{
                background: 'rgba(5,5,8,0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: '24px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Sequential Measurement Chain
                  </div>
                  {chainGates.length < 6 && (
                    <button
                      onClick={() => addGate('Z')}
                      style={{
                        background: 'rgba(0,255,179,0.08)',
                        border: '1px solid rgba(0,255,179,0.25)',
                        borderRadius: 8, padding: '6px 12px',
                        color: '#00ffb3', cursor: 'pointer',
                        fontFamily: '"Space Mono", monospace', fontSize: 10,
                        display: 'flex', alignItems: 'center', gap: 5,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,255,179,0.15)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(0,255,179,0.2)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,255,179,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
                    >
                      <Plus size={12} /> Add Gate
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto w-full pb-4 hidden-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {chainGates.map((gate, i) => {
                    const color = GATE_COLORS[gate.axis]
                    return (
                      <React.Fragment key={gate.id}>
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          style={{
                            background: `${color}12`,
                            border: `1px solid ${color}44`,
                            borderRadius: 10, padding: '12px 14px',
                            textAlign: 'center', flexShrink: 0, minWidth: 100,
                            position: 'relative',
                          }}
                        >
                          {/* Remove button */}
                          {chainGates.length > 1 && (
                            <button
                              onClick={() => removeGate(gate.id)}
                              style={{
                                position: 'absolute', top: 4, right: 4,
                                width: 18, height: 18, borderRadius: '50%',
                                background: 'rgba(255,80,80,0.15)',
                                border: '1px solid rgba(255,80,80,0.3)',
                                color: '#ff5050', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: 0, transition: 'all 0.2s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,80,80,0.3)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,80,80,0.15)'}
                            >
                              <X size={10} />
                            </button>
                          )}

                          {/* Axis selector */}
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 8 }}>
                            {['Z', 'X', 'Y'].map(ax => (
                              <button
                                key={ax}
                                onClick={() => updateGateAxis(gate.id, ax)}
                                style={{
                                  width: 26, height: 24,
                                  borderRadius: 5,
                                  background: gate.axis === ax ? `${GATE_COLORS[ax]}22` : 'rgba(255,255,255,0.04)',
                                  border: `1px solid ${gate.axis === ax ? GATE_COLORS[ax] + '66' : 'rgba(255,255,255,0.08)'}`,
                                  color: gate.axis === ax ? GATE_COLORS[ax] : 'var(--muted)',
                                  cursor: 'pointer',
                                  fontFamily: '"Space Mono", monospace', fontSize: 9,
                                  padding: 0, transition: 'all 0.15s',
                                }}
                              >
                                {ax}
                              </button>
                            ))}
                          </div>

                          <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 24, color }}>
                            SG{gate.axis}
                          </div>
                          {chainResults && chainResults[i] && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              style={{ marginTop: 8 }}
                            >
                              <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>n = {chainResults[i].total}</div>
                              <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: '#00d4ff' }}>↑ {chainResults[i].up}</div>
                              <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: '#7b5ea7' }}>↓ {chainResults[i].down}</div>
                            </motion.div>
                          )}
                        </motion.div>
                        {i < chainGates.length - 1 && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 6px', flexShrink: 0 }}>
                            <div style={{ width: 28, height: 2, background: 'rgba(255,255,255,0.15)', marginBottom: 4 }} />
                            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 8, color: 'var(--muted)' }}>↑ only</div>
                          </div>
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
                {/* Hint text */}
                <div style={{ 
                  fontFamily: '"Space Mono", monospace', fontSize: 9, color: 'var(--muted)',
                  marginTop: 8, opacity: 0.6,
                }}>
                  Click Z / X / Y on each gate to change axis · Add up to 6 gates
                </div>
              </div>

              {chainResults && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '20px', background: 'rgba(0,255,179,0.04)',
                    border: '1px solid rgba(0,255,179,0.15)', borderRadius: 12,
                  }}
                >
                  <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: '#00ffb3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                    Chain Results Summary
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--label)', lineHeight: 1.7, margin: 0 }}>
                    The beam started with <strong style={{ color: 'var(--text)' }}>{nParticles.toLocaleString()}</strong> particles.
                    {chainResults.map((step, i) => (
                      <span key={i}>
                        {' '}Stage {i + 1} (SG{chainGates[i].axis}) received <strong style={{ color: 'var(--text)' }}>{step.total}</strong> and
                        passed <strong style={{ color: '#00d4ff' }}>{step.up}</strong> spin-up.
                      </span>
                    ))}
                    {' '}Each measurement collapses the spin — measuring along a different axis
                    <strong style={{ color: '#00ffb3' }}> destroys information</strong> about the previous axis.
                    This is <em>quantum measurement back-action</em>.
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Right: controls */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          {/* Controls */}
          <div className="p-5 md:p-6" style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
          }}>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>
              Controls
            </div>

            {/* Initial state */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 11, color: 'var(--label)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                Initial State
              </div>
              <div style={{ position: 'relative' }}>
                <select value={initialState} onChange={e => { setInitialState(e.target.value); setResults(null); setChainResults(null) }} style={{ width: '100%' }}>
                  {Object.entries(INITIAL_STATES).map(([k, v]) => (
                    <option key={k} value={k}>{k} — {v.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Measurement axis (single mode only) */}
            {mode === 'single' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 11, color: 'var(--label)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Measurement Axis
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(MEASURE_AXES).map(ax => (
                    <button
                      key={ax}
                      onClick={() => { setMeasureAxis(ax); setResults(null) }}
                      style={{
                        flex: 1,
                        background: measureAxis === ax ? 'rgba(0,255,179,0.1)' : 'rgba(0,0,0,0.3)',
                        border: `1px solid ${measureAxis === ax ? 'rgba(0,255,179,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: 8, padding: '10px',
                        color: measureAxis === ax ? '#00ffb3' : 'var(--muted)',
                        cursor: 'pointer',
                        fontFamily: '"Bebas Neue", sans-serif', fontSize: 20,
                        transition: 'all 0.2s',
                      }}
                    >
                      {ax}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* N particles */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 11, color: 'var(--label)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Particles
                </div>
                <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 22, color: '#00ffb3' }}>
                  {nParticles.toLocaleString()}
                </span>
              </div>
              <input
                type="range" min={10} max={5000} step={10} value={nParticles}
                onChange={e => setNParticles(parseInt(e.target.value))}
                className="green-thumb"
                style={{ width: '100%', '--val': `${((nParticles - 10) / (5000 - 10)) * 100}%`, '--track-color': 'var(--green)' }}
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {[100, 500, 1000, 5000].map(n => (
                  <button
                    key={n}
                    onClick={() => setNParticles(n)}
                    style={{
                      flex: 1,
                      background: nParticles === n ? 'rgba(0,255,179,0.08)' : 'rgba(0,0,0,0.3)',
                      border: `1px solid ${nParticles === n ? 'rgba(0,255,179,0.3)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 6, padding: '6px 4px',
                      color: nParticles === n ? '#00ffb3' : 'var(--muted)',
                      cursor: 'pointer',
                      fontFamily: '"Space Mono", monospace', fontSize: 9,
                      transition: 'all 0.2s',
                    }}
                  >
                    {n >= 1000 ? `${n / 1000}k` : n}
                  </button>
                ))}
              </div>
            </div>

            {/* Run button */}
            <button
              onClick={mode === 'single' ? runExperiment : runChainExperiment}
              style={{
                width: '100%', padding: '14px',
                background: 'rgba(0,255,179,0.12)',
                border: '1px solid rgba(0,255,179,0.35)',
                borderRadius: 10, color: '#00ffb3',
                cursor: 'pointer',
                fontFamily: '"Bebas Neue", sans-serif', fontSize: 18,
                letterSpacing: '0.1em', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 10, transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,255,179,0.2)'
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,179,0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(0,255,179,0.12)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <Play size={14} /> RUN EXPERIMENT
            </button>
          </div>

          {/* Theoretical probabilities */}
          {mode === 'single' && (
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '20px',
            }}>
              <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>
                Theoretical Prediction
              </div>
              <div style={{
                fontFamily: '"Space Mono", monospace', fontSize: 12,
                color: 'var(--label)', lineHeight: 1.7, marginBottom: 14,
              }}>
                Measuring <span style={{ color: '#00ffb3' }}>{initialState}</span> along <span style={{ color: '#00ffb3' }}>{measureAxis}</span>:
              </div>
              {[
                { label: 'P(↑)', prob: theoreticalProbs.up, color: '#00d4ff' },
                { label: 'P(↓)', prob: theoreticalProbs.down, color: '#7b5ea7' },
              ].map((p, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: '"Space Mono", monospace', fontSize: 12, color: p.color }}>{p.label}</span>
                    <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 20, color: p.color }}>
                      {(p.prob * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div
                      animate={{ width: `${p.prob * 100}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      style={{ height: '100%', background: p.color, borderRadius: 3, boxShadow: `0 0 6px ${p.color}` }}
                    />
                  </div>
                </div>
              ))}

              <div style={{
                marginTop: 14, paddingTop: 12,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                fontFamily: '"Space Mono", monospace', fontSize: 11,
                color: 'var(--muted)', lineHeight: 1.7,
              }}>
                Formula: P(↑) = cos²(θ/2)
                <div style={{ color: 'var(--label)', marginTop: 4 }}>
                  where θ = angle between state and measurement axis
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
