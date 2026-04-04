import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, RotateCcw, Zap, Info } from 'lucide-react'
import WaveSimulator from './WaveSimulator.jsx'

// ─── Wavelength → RGB (JS) ──────────────────────────────
function wavelengthToCSS(nm) {
  let r = 0, g = 0, b = 0
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1 }
  else if (nm >= 440 && nm < 490) { g = (nm - 440) / 50; b = 1 }
  else if (nm >= 490 && nm < 510) { g = 1; b = -(nm - 510) / 20 }
  else if (nm >= 510 && nm < 580) { r = (nm - 510) / 70; g = 1 }
  else if (nm >= 580 && nm < 645) { r = 1; g = -(nm - 645) / 65 }
  else if (nm >= 645 && nm <= 780) { r = 1 }
  let f = 1
  if (nm >= 380 && nm < 420) f = 0.3 + 0.7 * (nm - 380) / 40
  else if (nm > 700 && nm <= 780) f = 0.3 + 0.7 * (780 - nm) / 80
  return `rgb(${Math.round(r*f*255)},${Math.round(g*f*255)},${Math.round(b*f*255)})`
}

function toVisibleNm(wl) { return 400 + (wl - 0.2) / 1.8 * 300 }

// ─── Physics: screen intensity ──────────────────────────
function computeScreenIntensity(y, wavelength, slitDistance, decoFraction) {
  const slitX = -1.5, screenX = 1.9
  const s1y = slitDistance / 2, s2y = -slitDistance / 2
  const dx = screenX - slitX
  const d1 = Math.sqrt(dx * dx + (y - s1y) ** 2)
  const d2 = Math.sqrt(dx * dx + (y - s2y) ** 2)
  const k = 40 / wavelength
  const amp1 = 1 / (d1 + 0.3), amp2 = 1 / (d2 + 0.3)

  // Coherent
  const cosPhase = Math.cos(k * (d1 - d2))
  let coherent = amp1*amp1 + amp2*amp2 + 2*amp1*amp2*cosPhase
  coherent = Math.pow(Math.max(coherent, 0), 1.8) * 0.6

  // Incoherent
  const ang1 = Math.atan2(y - s1y, dx), ang2 = Math.atan2(y - s2y, dx)
  const env1 = Math.exp(-ang1*ang1*4), env2 = Math.exp(-ang2*ang2*4)
  let incoherent = (amp1*amp1*env1 + amp2*amp2*env2) * 1.2

  return coherent * (1 - decoFraction) + incoherent * decoFraction
}

// Find fringe order positions
function findFringePositions(wavelength, slitDistance) {
  const slitX = -1.5, screenX = 1.9, dx = screenX - slitX
  const k = 40 / wavelength
  const orders = []
  for (let m = -4; m <= 4; m++) {
    // Bright fringe: k * pathDiff = 2πm → pathDiff = 2πm/k
    // pathDiff ≈ d * y / L → y = 2πm * L / (k * d)
    const y = (2 * Math.PI * m * dx) / (k * slitDistance)
    if (Math.abs(y) < 0.95) orders.push({ m, y })
  }
  return orders
}

// ─── Control Slider ─────────────────────────────────────
function ControlSlider({ label, value, min, max, step, onChange, color, displayValue, unit, swatch }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label style={{ fontFamily: '"Space Mono", monospace', fontSize: 11, color: 'var(--label)', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 8 }}>
          {label}
          {swatch && <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 3, background: swatch, border: '1px solid rgba(255,255,255,0.2)' }} />}
        </label>
        <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 20, color: color || '#ff9a3c' }}>
          {displayValue || `${value.toFixed(2)}${unit || ''}`}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', '--val': `${((value - min) / (max - min)) * 100}%`, '--track-color': color || '#ff9a3c' }}
      />
    </div>
  )
}

// ─── Intensity Graph ────────────────────────────────────
function IntensityGraph({ wavelength, slitDistance, detectorActive, collapseProgress }) {
  const canvasRef = useRef(null)
  const [hover, setHover] = useState(null)

  const visNm = toVisibleNm(wavelength)
  const cssColor = wavelengthToCSS(visNm)
  const fringes = findFringePositions(wavelength, slitDistance)
  const decoFrac = detectorActive ? Math.min(collapseProgress, 1) : Math.max(1 - (1 - collapseProgress), 0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height

    ctx.clearRect(0, 0, W, H)

    // Background
    ctx.fillStyle = 'rgba(5,5,10,0.95)'
    ctx.fillRect(0, 0, W, H)

    // Compute intensities
    const N = W
    const vals = []
    let maxVal = 0
    for (let i = 0; i < N; i++) {
      const y = ((i / (N-1)) * 2 - 1) // -1..1
      const I = computeScreenIntensity(y, wavelength, slitDistance, decoFrac)
      vals.push(I)
      if (I > maxVal) maxVal = I
    }
    if (maxVal === 0) maxVal = 1

    // Draw filled area
    const gradient = ctx.createLinearGradient(0, 0, 0, H)
    gradient.addColorStop(0, cssColor)
    gradient.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.beginPath()
    ctx.moveTo(0, H)
    for (let i = 0; i < N; i++) {
      const x = i
      const barH = (vals[i] / maxVal) * (H - 30)
      ctx.lineTo(x, H - barH)
    }
    ctx.lineTo(W, H)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.globalAlpha = 0.3
    ctx.fill()
    ctx.globalAlpha = 1

    // Draw line
    ctx.beginPath()
    for (let i = 0; i < N; i++) {
      const x = i
      const barH = (vals[i] / maxVal) * (H - 30)
      if (i === 0) ctx.moveTo(x, H - barH)
      else ctx.lineTo(x, H - barH)
    }
    ctx.strokeStyle = cssColor
    ctx.lineWidth = 2
    ctx.shadowColor = cssColor
    ctx.shadowBlur = 8
    ctx.stroke()
    ctx.shadowBlur = 0

    // Fringe labels m=0,±1,±2
    if (decoFrac < 0.5) {
      ctx.font = '10px "Space Mono", monospace'
      ctx.textAlign = 'center'
      fringes.forEach(({ m, y }) => {
        const px = ((y + 1) / 2) * W
        ctx.fillStyle = 'rgba(255,255,255,0.45)'
        ctx.fillText(`m=${m > 0 ? '+' : ''}${m}`, px, 14)
        // tiny tick
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(px, 18)
        ctx.lineTo(px, H)
        ctx.stroke()
      })
    }

    // Axis label
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.font = '9px "Space Mono", monospace'
    ctx.textAlign = 'right'
    ctx.fillText('I(y)', W - 8, 14)
  }, [wavelength, slitDistance, decoFrac, cssColor, fringes])

  // Path diff tooltip on hover
  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const W = e.currentTarget.width || rect.width
    const y = ((px / W) * 2 - 1)
    const slitX = -1.5, screenX = 1.9
    const dx = screenX - slitX
    const d1 = Math.sqrt(dx*dx + (y - slitDistance/2)**2)
    const d2 = Math.sqrt(dx*dx + (y + slitDistance/2)**2)
    const pathDiff = Math.abs(d1 - d2)
    const k = 40 / wavelength
    const lambda = 2 * Math.PI / k
    const mExact = pathDiff / lambda
    const mRound = Math.round(mExact)
    const isBright = Math.abs(mExact - mRound) < 0.2
    const isDark = Math.abs(mExact - (mRound + 0.5)) < 0.2 || Math.abs(mExact - (mRound - 0.5)) < 0.2
    setHover({
      x: e.clientX - rect.left,
      pathDiff: pathDiff.toFixed(3),
      mExact: mExact.toFixed(2),
      type: isBright ? 'BRIGHT (Δ = mλ)' : isDark ? 'DARK (Δ = (m+½)λ)' : '',
    })
  }, [wavelength, slitDistance])

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={110}
        style={{ width: '100%', height: 110, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      />
      {hover && (
        <div style={{
          position: 'absolute', left: Math.min(hover.x, 420), top: -48,
          background: 'rgba(5,5,12,0.95)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6, padding: '6px 10px', pointerEvents: 'none',
          fontFamily: '"Space Mono", monospace', fontSize: 10, color: 'var(--label)', whiteSpace: 'nowrap',
        }}>
          Δ = {hover.pathDiff} &nbsp; m ≈ {hover.mExact} &nbsp;<span style={{ color: hover.type.includes('BRIGHT') ? '#00ffb3' : '#ff4e6a' }}>{hover.type}</span>
        </div>
      )}
    </div>
  )
}

// ─── Particle Canvas ────────────────────────────────────
function ParticleCanvas({ wavelength, slitDistance, detectorActive, running }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animRef = useRef(null)
  const countRef = useRef(0)

  const visNm = toVisibleNm(wavelength)
  const cssColor = wavelengthToCSS(visNm)
  const decoFrac = detectorActive ? 1 : 0

  // Build CDF for sampling
  const buildCDF = useCallback(() => {
    const N = 500
    const vals = []
    let sum = 0
    for (let i = 0; i < N; i++) {
      const y = ((i / (N-1)) * 2 - 1)
      const I = computeScreenIntensity(y, wavelength, slitDistance, decoFrac)
      sum += I
      vals.push(sum)
    }
    return { cdf: vals.map(v => v / sum), N }
  }, [wavelength, slitDistance, decoFrac])

  // Sample from CDF
  const sampleY = useCallback(() => {
    const { cdf, N } = buildCDF()
    const r = Math.random()
    for (let i = 0; i < N; i++) {
      if (cdf[i] >= r) return ((i / (N-1)) * 2 - 1)
    }
    return 0
  }, [buildCDF])

  useEffect(() => {
    if (!running) return
    particlesRef.current = []
    countRef.current = 0

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height

    // Clear
    ctx.fillStyle = '#050508'
    ctx.fillRect(0, 0, W, H)

    // Draw barrier wall
    const wallX = W * 0.2
    ctx.strokeStyle = 'rgba(100,120,160,0.4)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(wallX, 0)
    const s1y = H/2 - (slitDistance/2) * (H/2)
    const s2y = H/2 + (slitDistance/2) * (H/2)
    ctx.lineTo(wallX, s1y - 6)
    ctx.moveTo(wallX, s1y + 6)
    ctx.lineTo(wallX, s2y - 6)
    ctx.moveTo(wallX, s2y + 6)
    ctx.lineTo(wallX, H)
    ctx.stroke()

    // Screen line
    const screenX = W * 0.88
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(screenX, 0)
    ctx.lineTo(screenX, H)
    ctx.stroke()

    const spawn = () => {
      if (countRef.current >= 2000) return
      const y = sampleY()
      const screenPy = (y + 1) / 2 * H
      // Small random spread
      const px = screenX + (Math.random() - 0.5) * 6
      const py = screenPy + (Math.random() - 0.5) * 2

      particlesRef.current.push({ x: px, y: py })
      countRef.current++

      // Draw dot
      ctx.fillStyle = cssColor
      ctx.globalAlpha = 0.7 + Math.random() * 0.3
      ctx.shadowColor = cssColor
      ctx.shadowBlur = 3
      ctx.beginPath()
      ctx.arc(px, py, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1

      // Counter
      ctx.fillStyle = '#050508'
      ctx.fillRect(W - 80, H - 24, 80, 24)
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = '10px "Space Mono", monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`n = ${countRef.current}`, W - 8, H - 8)
    }

    const loop = () => {
      for (let i = 0; i < 3; i++) spawn()
      if (countRef.current < 2000) {
        animRef.current = requestAnimationFrame(loop)
      }
    }
    animRef.current = requestAnimationFrame(loop)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [running, wavelength, slitDistance, decoFrac, cssColor, sampleY])

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      style={{ width: '100%', height: '100%', borderRadius: 16, background: '#050508' }}
    />
  )
}

// ─── Main Component ─────────────────────────────────────
export default function DoubleSlit() {
  const [wavelength, setWavelength] = useState(0.8)
  const [slitDistance, setSlitDistance] = useState(0.6)
  const [detectorActive, setDetectorActive] = useState(false)
  const [particleMode, setParticleMode] = useState(false)
  const [particlesRunning, setParticlesRunning] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [collapseProgress, setCollapseProgress] = useState(0)

  // Track collapse progress for intensity graph sync
  useEffect(() => {
    const target = detectorActive ? 1 : 0
    let raf
    const step = () => {
      setCollapseProgress(prev => {
        const speed = 0.025
        if (prev < target) return Math.min(prev + speed, target)
        if (prev > target) return Math.max(prev - speed, target)
        return prev
      })
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [detectorActive])

  const visNm = toVisibleNm(wavelength)
  const cssColor = wavelengthToCSS(visNm)

  const handleReset = () => {
    setWavelength(0.8)
    setSlitDistance(0.6)
    setDetectorActive(false)
    setParticleMode(false)
    setParticlesRunning(false)
    setCollapseProgress(0)
  }

  const handleShootParticles = () => {
    setParticlesRunning(false)
    setTimeout(() => setParticlesRunning(true), 50)
  }

  return (
    <div className="px-5 py-8 md:px-8 md:py-12 pb-24 md:max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: '#ff9a3c', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>Module 05</div>
            <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 0.95, color: 'var(--text)', margin: 0 }}>
              DOUBLE SLIT<br />
              <span style={{ color: '#ff9a3c', textShadow: '0 0 30px rgba(255,154,60,0.3)' }}>INTERFERENCE</span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowInfo(!showInfo)} style={{
              background: showInfo ? 'rgba(255,154,60,0.08)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showInfo ? 'rgba(255,154,60,0.25)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 8, padding: '10px 16px', color: showInfo ? '#ff9a3c' : 'var(--muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: '"Space Mono", monospace', fontSize: 11, transition: 'all 0.2s',
            }}><Info size={14} /> Info</button>
            <button onClick={handleReset} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '10px 16px', color: 'var(--muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: '"Space Mono", monospace', fontSize: 11, transition: 'all 0.2s',
            }}><RotateCcw size={14} /> Reset</button>
          </div>
        </div>
        <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, #ff9a3c, transparent 60%)', opacity: 0.2, marginTop: 16 }} />
      </motion.div>

      {/* Info */}
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: 24, padding: '16px 20px', background: 'rgba(255,154,60,0.04)', border: '1px solid rgba(255,154,60,0.15)', borderRadius: 10, fontSize: 13, color: 'var(--label)', lineHeight: 1.7, overflow: 'hidden' }}>
            <strong style={{ color: '#ff9a3c' }}>Double-Slit Experiment:</strong> When a particle passes through two slits without observation, it behaves as a <strong style={{ color: '#ff9a3c' }}>wave</strong> — creating an interference pattern of bright and dark fringes (I = |ψ₁+ψ₂|²). When a detector observes which slit the particle passes through, the wave function <strong style={{ color: '#ff4e6a' }}>collapses</strong>, and the pattern becomes two classical humps (I = |ψ₁|²+|ψ₂|²). Use <strong style={{ color: '#00ffb3' }}>Particle Mode</strong> to see individual particles build up the pattern statistically.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

        {/* Left: Visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Wave / Particle Canvas */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="h-[400px] md:h-[500px]"
            style={{
              background: 'rgba(5,5,8,0.6)',
              border: `1px solid ${detectorActive ? 'rgba(255,78,106,0.3)' : `rgba(${visNm < 520 ? '100,150,255' : '255,154,60'},0.2)`}`,
              borderRadius: 16, position: 'relative',
              boxShadow: detectorActive ? 'inset 0 0 40px rgba(255,78,106,0.08)' : 'none',
              transition: 'all 0.5s ease',
            }}>
            {particleMode ? (
              <ParticleCanvas wavelength={wavelength} slitDistance={slitDistance} detectorActive={detectorActive} running={particlesRunning} />
            ) : (
              <WaveSimulator wavelength={wavelength} slitDistance={slitDistance} detectorActive={detectorActive} />
            )}

            {/* Detector badge */}
            <AnimatePresence>
              {detectorActive && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  style={{
                    position: 'absolute', top: 16, left: 16,
                    background: 'rgba(255,78,106,0.15)', border: '1px solid rgba(255,78,106,0.4)',
                    borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
                    fontFamily: '"Space Mono", monospace', fontSize: 11, color: '#ff4e6a',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                  }}>
                  <Eye size={16} /> Observer Active — Decoherence
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mode label */}
            <div style={{
              position: 'absolute', bottom: 12, right: 16,
              fontFamily: '"Space Mono", monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.1em', pointerEvents: 'none',
            }}>
              {particleMode ? 'PARTICLE MODE' : 'WAVE MODE'} &nbsp; SCREEN →
            </div>
          </motion.div>

          {/* Intensity Graph */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
              Screen Intensity Profile
            </div>
            <IntensityGraph wavelength={wavelength} slitDistance={slitDistance} detectorActive={detectorActive} collapseProgress={collapseProgress} />
          </motion.div>
        </div>

        {/* Right: Controls */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Wave Parameters */}
          <div className="p-5 md:p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>
              Wave Parameters
            </div>
            <ControlSlider label="WAVELENGTH (λ)" value={wavelength} min={0.2} max={2.0} step={0.05}
              onChange={setWavelength} color={cssColor}
              displayValue={`${Math.round(visNm)} nm`}
              swatch={cssColor}
            />
            <ControlSlider label="SLIT SEPARATION (d)" value={slitDistance} min={0.2} max={1.5} step={0.05}
              onChange={setSlitDistance} color="#00ffb3" unit=" µm"
            />
          </div>

          {/* Observer Toggle — BIG & PROMINENT */}
          <div className="p-5 md:p-6" style={{
            background: detectorActive ? 'rgba(255,78,106,0.1)' : 'rgba(0,212,255,0.04)',
            border: `1px solid ${detectorActive ? 'rgba(255,78,106,0.35)' : 'rgba(0,212,255,0.15)'}`,
            borderRadius: 16, transition: 'all 0.4s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: detectorActive ? '#ff4e6a' : 'var(--cyan)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                The Observer Effect
              </div>
              {detectorActive ? <Eye size={20} color="#ff4e6a" /> : <EyeOff size={20} color="var(--cyan)" />}
            </div>

            <button onClick={() => setDetectorActive(!detectorActive)} style={{
              width: '100%', padding: '16px',
              background: detectorActive
                ? 'linear-gradient(135deg, #ff4e6a, #cc2244)'
                : 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,255,179,0.1))',
              color: detectorActive ? '#fff' : '#00d4ff',
              border: detectorActive ? 'none' : '1px solid rgba(0,212,255,0.3)',
              borderRadius: 10, fontFamily: '"Bebas Neue", sans-serif', fontSize: 20,
              letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: detectorActive
                ? '0 0 25px rgba(255,78,106,0.5), inset 0 0 20px rgba(255,255,255,0.1)'
                : '0 0 15px rgba(0,212,255,0.2)',
              animation: !detectorActive ? 'pulse-cyan 2s ease-in-out infinite' : 'none',
            }}>
              {detectorActive ? '🔴 Remove Detector' : '👁 Place Detector'}
            </button>

            <p style={{ fontSize: 12, color: 'var(--label)', lineHeight: 1.65, marginTop: 14, marginBottom: 0 }}>
              {detectorActive
                ? "Detector collapses the wave function → interference destroyed → two classical shadows."
                : "No observation → particle passes through both slits as a probability wave → interference fringes."}
            </p>
          </div>

          {/* Particle Mode */}
          <div className="p-5 md:p-6" style={{
            background: particleMode ? 'rgba(0,255,179,0.06)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${particleMode ? 'rgba(0,255,179,0.2)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 16, transition: 'all 0.3s',
          }}>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: particleMode ? '#00ffb3' : 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
              Particle-by-Particle Mode
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setParticleMode(!particleMode); setParticlesRunning(false) }} style={{
                flex: 1, padding: '10px',
                background: particleMode ? 'rgba(0,255,179,0.12)' : 'rgba(0,0,0,0.3)',
                border: `1px solid ${particleMode ? 'rgba(0,255,179,0.3)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8, color: particleMode ? '#00ffb3' : 'var(--muted)',
                cursor: 'pointer', fontFamily: '"Space Mono", monospace', fontSize: 11, transition: 'all 0.2s',
              }}>
                {particleMode ? 'Wave View' : 'Particle View'}
              </button>
              {particleMode && (
                <button onClick={handleShootParticles} style={{
                  flex: 1, padding: '10px',
                  background: 'rgba(0,255,179,0.12)', border: '1px solid rgba(0,255,179,0.35)',
                  borderRadius: 8, color: '#00ffb3', cursor: 'pointer',
                  fontFamily: '"Space Mono", monospace', fontSize: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.2s',
                }}>
                  <Zap size={13} /> Shoot!
                </button>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--label)', lineHeight: 1.6, marginTop: 10, marginBottom: 0, opacity: 0.7 }}>
              Watch individual particles land one by one — the fringe pattern emerges statistically.
            </p>
          </div>

          {/* Math */}
          <div className="p-4 md:p-[18px]" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>
              Intensity Formula
            </div>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 14, color: detectorActive ? '#ff4e6a' : cssColor, lineHeight: 1.8 }}>
              {detectorActive ? (
                <>I = |ψ₁|² + |ψ₂|²<br /><span style={{ fontSize: 11, color: 'var(--muted)' }}>(Incoherent — no cross term)</span></>
              ) : (
                <>I = |ψ₁ + ψ₂|²<br /><span style={{ fontSize: 11, color: 'var(--muted)' }}>(Coherent — interference cross term)</span></>
              )}
            </div>
            <div style={{ marginTop: 8, fontFamily: '"Space Mono", monospace', fontSize: 10, color: 'var(--muted)', opacity: 0.6 }}>
              Bright: d·sin θ = mλ &nbsp;|&nbsp; Dark: d·sin θ = (m+½)λ
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pulse animation for the detector button */}
      <style>{`
        @keyframes pulse-cyan {
          0%, 100% { box-shadow: 0 0 15px rgba(0,212,255,0.2); }
          50% { box-shadow: 0 0 25px rgba(0,212,255,0.4), 0 0 40px rgba(0,212,255,0.15); }
        }
      `}</style>
    </div>
  )
}
