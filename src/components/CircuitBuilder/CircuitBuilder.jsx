import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Play, Plus, X } from 'lucide-react'
import CircuitBlochCanvas from './CircuitBlochCanvas.jsx'

// ─── Math & Quantum Logic ──────────────────────────────
const sq2 = 1 / Math.sqrt(2)

const GATES = {
  H: { name: 'Hadamard', matrix: [[[sq2, 0], [sq2, 0]], [[sq2, 0], [-sq2, 0]]], color: '#00d4ff' },
  X: { name: 'Pauli-X', matrix: [[[0, 0], [1, 0]], [[1, 0], [0, 0]]], color: '#ff4e6a' },
  Y: { name: 'Pauli-Y', matrix: [[[0, 0], [0, -1]], [[0, 1], [0, 0]]], color: '#f0c040' },
  Z: { name: 'Pauli-Z', matrix: [[[1, 0], [0, 0]], [[0, 0], [-1, 0]]], color: '#00ffb3' }
}

const cAdd = (c1, c2) => [c1[0] + c2[0], c1[1] + c2[1]]
const cMul = (c1, c2) => [c1[0] * c2[0] - c1[1] * c2[1], c1[0] * c2[1] + c1[1] * c2[0]]

const applyGate = (state, gateSymbol) => {
  const gate = GATES[gateSymbol].matrix
  if (!gate) return state
  const [a, b] = state
  const [[m00, m01], [m10, m11]] = gate
  const newA = cAdd(cMul(m00, a), cMul(m01, b))
  const newB = cAdd(cMul(m10, a), cMul(m11, b))
  return [newA, newB]
}

const stateToAngles = (state) => {
  const [a, b] = state
  const r1 = Math.hypot(a[0], a[1])
  const safeR1 = Math.min(1, Math.max(0, r1))
  const theta = 2 * Math.acos(safeR1)
  
  const p1 = Math.atan2(a[1], a[0])
  const p2 = Math.atan2(b[1], b[0])
  let phi = p2 - p1
  while (phi < 0) phi += 2 * Math.PI
  while (phi >= 2 * Math.PI) phi -= 2 * Math.PI
  if (theta < 1e-6 || Math.abs(theta - Math.PI) < 1e-6) {
    phi = 0
  }
  return { theta, phi }
}

const INITIAL_STATE = [[1, 0], [0, 0]] // |0>

// ─── Component ─────────────────────────────────────────
export default function CircuitBuilder() {
  const [circuit, setCircuit] = useState([])
  
  // Calculate final state based on current circuit
  const { finalState, states } = useMemo(() => {
    let current = INITIAL_STATE
    const st = [{ state: current, ...stateToAngles(current) }]
    for (const item of circuit) {
      current = applyGate(current, item.type)
      st.push({ state: current, ...stateToAngles(current) })
    }
    return { finalState: current, states: st }
  }, [circuit])

  const { theta, phi } = stateToAngles(finalState)

  const handleDragStart = (e, gate) => {
    e.dataTransfer.setData('gate', gate)
    e.target.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1'
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const gate = e.dataTransfer.getData('gate')
    if (gate && GATES[gate]) {
      setCircuit(prev => [...prev, { id: `${gate}-${Date.now()}-${Math.random()}`, type: gate }])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const clearCircuit = () => {
    setCircuit([])
  }

  const removeGate = (index) => {
    setCircuit(prev => prev.filter((_, i) => i !== index))
  }

  const prob0 = Math.cos(theta / 2) ** 2
  const prob1 = Math.sin(theta / 2) ** 2

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
              color: '#ff4e6a',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Module 04
            </div>
            <h1 style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 'clamp(36px, 5vw, 64px)',
              lineHeight: 0.95,
              color: 'var(--text)',
              margin: 0,
            }}>
              QUANTUM GATES<br />
              <span style={{ color: '#ff4e6a', textShadow: '0 0 30px rgba(255,78,106,0.3)' }}>CIRCUIT BUILDER</span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={clearCircuit}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '10px 16px',
                color: 'var(--muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: '"Space Mono", monospace',
                fontSize: 11,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
            >
              <RotateCcw size={14} /> Clear Circuit
            </button>
          </div>
        </div>
        <div style={{
          width: '100%', height: 1,
          background: 'linear-gradient(90deg, #ff4e6a, transparent 60%)',
          opacity: 0.2, marginTop: 16,
        }} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
        {/* Left Side: Builder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Gate Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 md:p-6"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
            }}
          >
            <div style={{
              fontFamily: '"Space Mono", monospace',
              fontSize: 11,
              color: 'var(--label)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              Available Gates (Drag to apply)
            </div>
            
            <div className="flex flex-wrap gap-3">
              {Object.keys(GATES).map(gate => (
                <div
                  key={gate}
                  draggable
                  onDragStart={(e) => handleDragStart(e, gate)}
                  onDragEnd={handleDragEnd}
                  style={{
                    width: 54, height: 54,
                    background: `rgba(${parseInt(GATES[gate].color.slice(1,3),16)}, ${parseInt(GATES[gate].color.slice(3,5),16)}, ${parseInt(GATES[gate].color.slice(5,7),16)}, 0.1)`,
                    border: `1px solid ${GATES[gate].color}`,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: 24,
                    color: GATES[gate].color,
                    cursor: 'grab',
                    boxShadow: `0 0 10px ${GATES[gate].color}40`,
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  title={GATES[gate].name}
                >
                  {gate}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 md:p-8"
            style={{
              background: 'rgba(5,5,8,0.6)',
              border: '1px solid rgba(255,78,106,0.2)',
              borderRadius: 16,
              minHeight: 240,
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div style={{
              fontFamily: '"Space Mono", monospace',
              fontSize: 11,
              color: '#ff4e6a',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}>
              Circuit Timeline
            </div>
            
            {circuit.length === 0 ? (
              <div style={{
                height: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed rgba(255,255,255,0.1)',
                borderRadius: 12,
                color: 'var(--muted)',
                fontFamily: '"Space Mono", monospace',
                fontSize: 13,
              }}>
                Drop gates here
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: 16, paddingTop: 16 }} className="hidden-scrollbar">
                {/* Initial state wire */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: 16,
                    color: 'var(--text)',
                    marginRight: 16,
                  }}>
                    |0⟩
                  </div>
                  <div style={{ width: 40, height: 2, background: 'rgba(255,255,255,0.2)' }} />
                </div>
                
                {/* Circuit elements */}
                <AnimatePresence mode="popLayout">
                  {circuit.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <div style={{
                        position: 'relative',
                        width: 50, height: 50,
                        background: 'rgba(12,16,28,0.9)',
                        border: `1px solid ${GATES[item.type].color}`,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: '"Bebas Neue", sans-serif',
                        fontSize: 24,
                        color: GATES[item.type].color,
                        boxShadow: `0 0 15px ${GATES[item.type].color}30`,
                      }}>
                        {item.type}
                        <button
                          onClick={() => removeGate(index)}
                          style={{
                            position: 'absolute', top: -8, right: -8,
                            background: '#ff4e6a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: 20, height: 20,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <div style={{ width: 40, height: 2, background: 'rgba(255,255,255,0.2)' }} />
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Final state */}
                <div style={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: 16,
                    color: '#ff4e6a',
                    marginLeft: 16,
                }}>
                  |ψ⟩
                </div>
              </div>
            )}
          </motion.div>

        </div>

        {/* Right Side: Bloch Sphere & Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          {/* Bloch Sphere Canvas */}
          <div style={{
            height: 380,
            background: 'rgba(5,5,8,0.6)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <CircuitBlochCanvas theta={theta} phi={phi} />
            <div style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: 6,
              fontFamily: '"Space Mono", monospace', fontSize: 10, color: 'var(--text)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              Final State Vector
            </div>
          </div>

          {/* Probabilities & Angles Info */}
          <div className="p-4 md:p-[18px]" style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
          }}>
            <div style={{
              fontFamily: '"Space Mono", monospace',
              fontSize: 9,
              color: 'var(--muted)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}>
              Measurement Output
            </div>

            {[
              { state: '|0⟩', prob: prob0, color: '#00d4ff' },
              { state: '|1⟩', prob: prob1, color: '#7b5ea7' },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: i === 0 ? 10 : 0 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}>
                  <span style={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: 12,
                    color: item.color,
                  }}>
                    P({item.state})
                  </span>
                  <span style={{
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: 18,
                    color: item.color,
                  }}>
                    {(item.prob * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{
                  height: 6,
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}>
                  <motion.div
                    animate={{ width: `${item.prob * 100}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, ${item.color}, ${item.color}88)`,
                      borderRadius: 3,
                      boxShadow: `0 0 8px ${item.color}`,
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Angles Display */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: 8, borderRadius: 6 }}>
                <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 9, color: 'var(--label)' }}>θ (Polar)</div>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 20, color: 'var(--text)' }}>
                  {((theta / Math.PI) * 180).toFixed(1)}°
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: 8, borderRadius: 6 }}>
                <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 9, color: 'var(--label)' }}>φ (Azimuthal)</div>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 20, color: 'var(--text)' }}>
                  {((phi / Math.PI) * 180).toFixed(1)}°
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>

    </div>
  )
}
