import React, { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { RotateCcw, Info, Zap } from 'lucide-react'

// ─── Quantum helpers ──────────────────────────────────
// Basis states: |00⟩, |01⟩, |10⟩, |11⟩

const BASIS = ['|00⟩', '|01⟩', '|10⟩', '|11⟩']
const BASIS_COLORS = ['#00d4ff', '#7b5ea7', '#00ffb3', '#f0c040']

// Normalize amplitudes so that sum of squares = 1
function normalize(amps) {
  const norm = Math.sqrt(amps.reduce((s, a) => s + a * a, 0))
  if (norm === 0) return [0.5, 0.5, 0.5, 0.5]
  return amps.map(a => a / norm)
}

function probabilities(amps) {
  return amps.map(a => a * a)
}

// Bell states
const BELL_STATES = {
  'Φ⁺ (|00⟩+|11⟩)/√2': { amps: [1, 0, 0, 1], label: '|Φ⁺⟩ = (|00⟩ + |11⟩) / √2', type: 'phi+' },
  'Φ⁻ (|00⟩-|11⟩)/√2': { amps: [1, 0, 0, -1], label: '|Φ⁻⟩ = (|00⟩ − |11⟩) / √2', type: 'phi-' },
  'Ψ⁺ (|01⟩+|10⟩)/√2': { amps: [0, 1, 1, 0], label: '|Ψ⁺⟩ = (|01⟩ + |10⟩) / √2', type: 'psi+' },
  'Ψ⁻ (|01⟩-|10⟩)/√2': { amps: [0, 1, -1, 0], label: '|Ψ⁻⟩ = (|01⟩ − |10⟩) / √2', type: 'psi-' },
}

// ─── Check entanglement ───────────────────────────────
// |ψ⟩ = a|00⟩ + b|01⟩ + c|10⟩ + d|11⟩ is separable iff ad − bc = 0
function isEntangled(amps) {
  const [a, b, c, d] = amps
  return Math.abs(a * d - b * c) > 0.01
}

// Schmidt decomposition (simplified — just entanglement measure)
function concurrence(amps) {
  const [a, b, c, d] = amps
  return Math.abs(2 * (a * d - b * c))
}

// ─── Entanglement visualization ───────────────────────
function EntanglementOrbs({ entangled, concurrenceVal }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      padding: '24px',
    }}>
      {/* Qubit A */}
      <div style={{ textAlign: 'center' }}>
        <motion.div
          animate={{
            boxShadow: entangled
              ? ['0 0 16px rgba(0,212,255,0.4)', '0 0 32px rgba(0,212,255,0.8)', '0 0 16px rgba(0,212,255,0.4)']
              : '0 0 12px rgba(0,212,255,0.3)',
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 72, height: 72,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, rgba(0,212,255,0.4), rgba(0,212,255,0.1))',
            border: '2px solid rgba(0,212,255,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 20,
            color: 'var(--cyan)',
          }}
        >
          A
        </motion.div>
        <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: 'var(--muted)', marginTop: 8 }}>
          Qubit A
        </div>
      </div>

      {/* Entanglement link */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <motion.div
          animate={{
            opacity: entangled ? [0.4, 1, 0.4] : 0.1,
            scaleX: entangled ? [0.95, 1.05, 0.95] : 1,
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            height: 2,
            width: '100%',
            background: entangled
              ? 'linear-gradient(90deg, var(--cyan), var(--violet))'
              : 'rgba(255,255,255,0.1)',
            borderRadius: 1,
          }}
        />
        <div style={{
          fontFamily: '"Space Mono", monospace',
          fontSize: 9,
          color: entangled ? 'var(--cyan)' : 'var(--muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}>
          {entangled ? `C = ${concurrenceVal.toFixed(3)}` : 'Separable'}
        </div>
      </div>

      {/* Qubit B */}
      <div style={{ textAlign: 'center' }}>
        <motion.div
          animate={{
            boxShadow: entangled
              ? ['0 0 16px rgba(123,94,167,0.4)', '0 0 32px rgba(123,94,167,0.8)', '0 0 16px rgba(123,94,167,0.4)']
              : '0 0 12px rgba(123,94,167,0.3)',
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.75 }}
          style={{
            width: 72, height: 72,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, rgba(123,94,167,0.4), rgba(123,94,167,0.1))',
            border: '2px solid rgba(123,94,167,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 20,
            color: 'var(--violet)',
          }}
        >
          B
        </motion.div>
        <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: 'var(--muted)', marginTop: 8 }}>
          Qubit B
        </div>
      </div>
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{
      background: 'rgba(5,5,8,0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8,
      padding: '10px 14px',
      fontFamily: '"Space Mono", monospace',
      fontSize: 12,
    }}>
      <div style={{ color: 'var(--text)', marginBottom: 4 }}>{payload[0].payload.state}</div>
      <div style={{ color: payload[0].fill }}>{(payload[0].value * 100).toFixed(2)}%</div>
    </div>
  )
}

// ─── Amplitude Slider ─────────────────────────────────
function AmpSlider({ label, value, onChange, color, thumbClass }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{
          fontFamily: '"Space Mono", monospace',
          fontSize: 12,
          color: color || 'var(--label)',
        }}>
          α{label}
        </label>
        <span style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 18,
          color: color || 'var(--cyan)',
        }}>
          {value.toFixed(3)}
        </span>
      </div>
      <input
        type="range"
        min={-1}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={thumbClass}
        style={{ width: '100%' }}
      />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────
export default function TwoQubitBloch() {
  const [rawAmps, setRawAmps] = useState([0.5, 0.5, 0.5, 0.5])
  const [bellState, setBellState] = useState(null)
  const [showInfo, setShowInfo] = useState(false)
  const [measureResult, setMeasureResult] = useState(null)

  const amps = normalize(rawAmps)
  const probs = probabilities(amps)
  const entangled = isEntangled(amps)
  const concurrenceVal = concurrence(amps)

  const chartData = BASIS.map((s, i) => ({
    state: s,
    probability: probs[i],
    amplitude: amps[i],
  }))

  const handleAmpChange = (index) => (val) => {
    const newAmps = [...rawAmps]
    newAmps[index] = val
    setRawAmps(newAmps)
    setBellState(null)
    setMeasureResult(null)
  }

  const applyBellState = (key) => {
    const bs = BELL_STATES[key]
    setRawAmps(bs.amps)
    setBellState(bs)
    setMeasureResult(null)
  }

  const handleMeasure = () => {
    // Probabilistic measurement
    const r = Math.random()
    let cumulative = 0
    for (let i = 0; i < probs.length; i++) {
      cumulative += probs[i]
      if (r < cumulative) {
        setMeasureResult(i)
        break
      }
    }
  }

  const handleReset = () => {
    setRawAmps([0.5, 0.5, 0.5, 0.5])
    setBellState(null)
    setMeasureResult(null)
  }

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
            <div style={{
              fontFamily: '"Space Mono", monospace',
              fontSize: 10,
              color: '#7b5ea7',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Module 02
            </div>
            <h1 style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 'clamp(36px, 5vw, 64px)',
              lineHeight: 0.95,
              color: 'var(--text)',
              margin: 0,
            }}>
              TWO QUBIT<br />
              <span style={{ color: '#7b5ea7', textShadow: '0 0 30px rgba(123,94,167,0.4)' }}>ENTANGLEMENT</span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowInfo(!showInfo)}
              style={{
                background: showInfo ? 'rgba(123,94,167,0.1)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${showInfo ? 'rgba(123,94,167,0.3)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8, padding: '10px 16px',
                color: showInfo ? '#7b5ea7' : 'var(--muted)',
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
        <div style={{
          width: '100%', height: 1,
          background: 'linear-gradient(90deg, #7b5ea7, transparent 60%)',
          opacity: 0.3, marginTop: 16,
        }} />
      </motion.div>

      {/* Info */}
      {showInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginBottom: 24, padding: '16px 20px',
            background: 'rgba(123,94,167,0.05)',
            border: '1px solid rgba(123,94,167,0.2)',
            borderRadius: 10, fontSize: 13, color: 'var(--label)', lineHeight: 1.7,
          }}
        >
          <strong style={{ color: '#b39ddb' }}>Two-Qubit States:</strong> A two-qubit system lives in a 4-dimensional Hilbert space spanned by |00⟩, |01⟩, |10⟩, |11⟩. 
          <strong style={{ color: '#b39ddb' }}> Entangled states</strong> cannot be written as a product of two single-qubit states. 
          The <strong style={{ color: '#b39ddb' }}>concurrence C</strong> ranges from 0 (separable) to 1 (maximally entangled). Bell states achieve C = 1.
        </motion.div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        {/* Left: visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Entanglement orbs */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'rgba(5,5,8,0.6)',
              border: `1px solid ${entangled ? 'rgba(123,94,167,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 16, overflow: 'hidden',
              transition: 'border-color 0.5s',
            }}
          >
            {/* Status banner */}
            <div style={{
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Entanglement Status
              </div>
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: '"Space Mono", monospace', fontSize: 11,
                  color: entangled ? '#b39ddb' : 'var(--muted)',
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: entangled ? '#7b5ea7' : 'var(--muted)',
                  boxShadow: entangled ? '0 0 8px rgba(123,94,167,0.8)' : 'none',
                }} />
                {entangled ? 'ENTANGLED' : 'SEPARABLE'}
              </motion.div>
            </div>
            <EntanglementOrbs entangled={entangled} concurrenceVal={concurrenceVal} />
          </motion.div>

          {/* Probability chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-5 md:p-6"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
            }}
          >
            <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
              <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Probability Distribution
              </div>
              <button
                onClick={handleMeasure}
                style={{
                  background: 'rgba(123,94,167,0.15)',
                  border: '1px solid rgba(123,94,167,0.3)',
                  borderRadius: 8, padding: '8px 16px',
                  color: '#b39ddb', cursor: 'pointer',
                  fontFamily: '"Space Mono", monospace', fontSize: 11,
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(123,94,167,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(123,94,167,0.15)'}
              >
                <Zap size={12} /> Measure
              </button>
            </div>

            {/* Measurement result */}
            {measureResult !== null && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginBottom: 16, padding: '12px 16px',
                  background: `rgba(${BASIS_COLORS[measureResult] === '#00d4ff' ? '0,212,255' : BASIS_COLORS[measureResult] === '#7b5ea7' ? '123,94,167' : BASIS_COLORS[measureResult] === '#00ffb3' ? '0,255,179' : '240,192,64'},0.1)`,
                  border: `1px solid ${BASIS_COLORS[measureResult]}33`,
                  borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <span style={{ fontFamily: '"Space Mono", monospace', fontSize: 12, color: 'var(--label)' }}>
                  Measurement result:
                </span>
                <span style={{
                  fontFamily: '"Bebas Neue", sans-serif', fontSize: 24,
                  color: BASIS_COLORS[measureResult],
                }}>
                  {BASIS[measureResult]}
                </span>
              </motion.div>
            )}

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="state"
                  tick={{ fontFamily: '"Space Mono", monospace', fontSize: 11, fill: '#9ca3af' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  tick={{ fontFamily: '"Space Mono", monospace', fontSize: 10, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 1]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={BASIS_COLORS[i]} fillOpacity={measureResult === i ? 1 : 0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Probability readouts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mt-4">
              {BASIS.map((s, i) => (
                <div key={i} className="p-2 md:p-3" style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${BASIS_COLORS[i]}22`,
                  borderRadius: 8,
                  textAlign: 'center',
                }}>
                  <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 11, color: BASIS_COLORS[i], marginBottom: 4 }}>
                    {s}
                  </div>
                  <div style={{
                    fontFamily: '"Bebas Neue", sans-serif', fontSize: 20, color: 'var(--text)',
                  }}>
                    {(probs[i] * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bell state info */}
          {bellState && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '16px 20px',
                background: 'rgba(123,94,167,0.08)',
                border: '1px solid rgba(123,94,167,0.25)',
                borderRadius: 12,
              }}
            >
              <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: '#7b5ea7', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
                Bell State Active
              </div>
              <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 13, color: '#b39ddb' }}>
                {bellState.label}
              </div>
              <div style={{ fontSize: 13, color: 'var(--label)', marginTop: 8, lineHeight: 1.6 }}>
                Maximally entangled. Concurrence C = 1. Qubits are perfectly correlated — 
                measuring one instantly determines the other's outcome.
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: controls */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          {/* Amplitude controls */}
          <div className="p-5 md:p-6" style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
          }}>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>
              Amplitude Controls
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
              Set amplitudes α. State auto-normalizes: |ψ⟩ = Σ αᵢ|bᵢ⟩
            </div>

            {BASIS.map((s, i) => (
              <div key={i}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 4,
                }}>
                  <span style={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: 12, color: BASIS_COLORS[i],
                  }}>
                    α for {s}
                  </span>
                  <span style={{
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: 18, color: BASIS_COLORS[i],
                  }}>
                    {amps[i].toFixed(3)}
                  </span>
                </div>
                <input
                  type="range" min={-1} max={1} step={0.01}
                  value={rawAmps[i]}
                  onChange={(e) => handleAmpChange(i)(parseFloat(e.target.value))}
                  style={{ width: '100%', marginBottom: 12,
                    '--thumb-color': BASIS_COLORS[i],
                    '--val': `${((rawAmps[i] + 1) / 2) * 100}%`,
                    '--track-color': BASIS_COLORS[i]
                  }}
                />
              </div>
            ))}
          </div>

          {/* Bell states */}
          <div className="p-5 md:p-6" style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
          }}>
            <div style={{
              fontFamily: '"Space Mono", monospace', fontSize: 9, color: 'var(--muted)',
              letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16,
            }}>
              Bell States
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(BELL_STATES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => applyBellState(key)}
                  style={{
                    background: bellState?.type === val.type ? 'rgba(123,94,167,0.15)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${bellState?.type === val.type ? 'rgba(123,94,167,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 8, padding: '10px 14px',
                    color: bellState?.type === val.type ? '#b39ddb' : 'var(--label)',
                    cursor: 'pointer', textAlign: 'left',
                    fontFamily: '"Space Mono", monospace', fontSize: 11,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (bellState?.type !== val.type) {
                      e.currentTarget.style.background = 'rgba(123,94,167,0.08)'
                      e.currentTarget.style.color = 'var(--text)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (bellState?.type !== val.type) {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.3)'
                      e.currentTarget.style.color = 'var(--label)'
                    }
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* State summary */}
          <div className="p-5 md:p-6" style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
          }}>
            <div style={{
              fontFamily: '"Space Mono", monospace', fontSize: 9, color: 'var(--muted)',
              letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12,
            }}>
              State Vector
            </div>
            <div style={{
              fontFamily: '"Space Mono", monospace', fontSize: 11,
              color: 'var(--label)', lineHeight: 2.2,
            }}>
              {BASIS.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: BASIS_COLORS[i], width: 16 }}>
                    {amps[i] >= 0 ? (i === 0 ? '' : '+ ') : '− '}
                  </span>
                  <span style={{ color: BASIS_COLORS[i] }}>
                    {Math.abs(amps[i]).toFixed(3)}
                  </span>
                  <span style={{ color: 'var(--muted)' }}>{s}</span>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 16, paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: 'var(--muted)' }}>
                Concurrence
              </span>
              <span style={{
                fontFamily: '"Bebas Neue", sans-serif', fontSize: 24,
                color: entangled ? '#7b5ea7' : 'var(--muted)',
              }}>
                {concurrenceVal.toFixed(4)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
