import React from 'react'
import { motion } from 'framer-motion'
import { ROUTES } from '../../constants.js'
import { ArrowRight, Circle, GitBranch, FlaskConical, Atom, Cpu, Waves } from 'lucide-react'

const modules = [
  {
    id: ROUTES.SINGLE_BLOCH,
    index: '01',
    title: 'Single Qubit',
    subtitle: 'Bloch Sphere',
    icon: Circle,
    accent: '#00d4ff',
    accentRgb: '0,212,255',
    description: 'Visualize a single qubit state on the Bloch sphere. Adjust θ and φ angles to explore the full state space. See quantum superposition come to life in 3D.',
    features: ['3D Bloch sphere visualization', 'Real-time state vector update', 'Dirac notation display', 'Probability readout'],
    formula: '|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩',
  },
  {
    id: ROUTES.TWO_QUBIT,
    index: '02',
    title: 'Two Qubit',
    subtitle: 'Entanglement',
    icon: GitBranch,
    accent: '#7b5ea7',
    accentRgb: '123,94,167',
    description: 'Explore two-qubit states and quantum entanglement. Construct Bell states with one click and watch probability amplitudes evolve in real time.',
    features: ['Two-qubit state representation', 'Bell state generator', 'Probability bar visualization', 'Entanglement detection'],
    formula: '|Φ⁺⟩ = (|00⟩ + |11⟩) / √2',
  },
  {
    id: ROUTES.STERN_GERLACH,
    index: '03',
    title: 'Stern–Gerlach',
    subtitle: 'Experiment',
    icon: FlaskConical,
    accent: '#00ffb3',
    accentRgb: '0,255,179',
    description: 'Simulate the historic Stern–Gerlach experiment. Send particles through magnetic field gradients and observe spin measurement outcomes statistically.',
    features: ['Animated particle beam', 'Probabilistic simulation', 'Multiple measurement axes', 'Sequential SGz→SGx→SGz chain'],
    formula: 'P(↑) = cos²(θ/2), P(↓) = sin²(θ/2)',
  },
  {
    id: ROUTES.CIRCUIT_BUILDER,
    index: '04',
    title: 'Quantum Gates',
    subtitle: 'Circuit Builder',
    icon: Cpu,
    accent: '#ff4e6a',
    accentRgb: '255,78,106',
    description: 'Construct custom quantum circuits using fundamental gates. Drag and drop operations onto the timeline to visually explore how state vectors evolve on the Bloch sphere.',
    features: ['Interactive gate timeline', 'H, X, Y, Z, S, Phase gates', 'Real-time state vector animation', 'Step-by-step evaluation'],
    formula: '|ψ\'⟩ = U |ψ⟩',
  },
  {
    id: ROUTES.DOUBLE_SLIT,
    index: '05',
    title: 'Double Slit',
    subtitle: 'Interference',
    icon: Waves,
    accent: '#ff9a3c',
    accentRgb: '255,154,60',
    description: 'Simulate wave-particle duality with the classic double-slit experiment. Witness the emergence of interference patterns and instantly destroy them by toggling the observer detector.',
    features: ['Real-time 2D wave propagation', 'Coherent vs Incoherent addition', 'Observer effect toggle', 'Live intensity distribution'],
    formula: 'I = |ψ₁ + ψ₂|² vs I = |ψ₁|² + |ψ₂|²',
  },
]

// ─── Module Card ─────────────────────────────────────
function ModuleCard({ mod, navigate, index }) {
  const Icon = mod.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid rgba(${mod.accentRgb},0.15)`,
        borderRadius: 20,
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      whileHover={{
        scale: 1.02,
        borderColor: `rgba(${mod.accentRgb},0.4)`,
        background: `rgba(${mod.accentRgb},0.04)`,
      }}
      onClick={() => navigate(mod.id)}
    >
      {/* Corner glow */}
      <div style={{
        position: 'absolute',
        top: -40, right: -40,
        width: 120, height: 120,
        background: `radial-gradient(circle, rgba(${mod.accentRgb},0.12) 0%, transparent 70%)`,
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            fontFamily: '"Space Mono", monospace',
            fontSize: 10,
            color: mod.accent,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: 8,
            opacity: 0.7,
          }}>
            Module {mod.index}
          </div>
          <div style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 36,
            lineHeight: 0.95,
            color: 'var(--text)',
          }}>
            {mod.title}
          </div>
          <div style={{
            fontFamily: '"DM Serif Display", serif',
            fontStyle: 'italic',
            fontSize: 16,
            color: mod.accent,
            marginTop: 4,
          }}>
            {mod.subtitle}
          </div>
        </div>
        <div style={{
          background: `rgba(${mod.accentRgb},0.1)`,
          border: `1px solid rgba(${mod.accentRgb},0.2)`,
          borderRadius: 12,
          padding: 12,
          color: mod.accent,
        }}>
          <Icon size={24} />
        </div>
      </div>

      {/* Description */}
      <p style={{
        fontSize: 14,
        color: 'var(--label)',
        lineHeight: 1.7,
      }}>
        {mod.description}
      </p>

      {/* Formula */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8,
        padding: '10px 14px',
        fontFamily: '"Space Mono", monospace',
        fontSize: 12,
        color: mod.accent,
        letterSpacing: '0.02em',
      }}>
        {mod.formula}
      </div>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {mod.features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 4, height: 4,
              background: mod.accent,
              borderRadius: '50%',
              flexShrink: 0,
              boxShadow: `0 0 6px ${mod.accent}`,
            }} />
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{f}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: mod.accent,
        fontFamily: '"Space Mono", monospace',
        fontSize: 11,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginTop: 'auto',
        paddingTop: 8,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        Launch Module <ArrowRight size={14} />
      </div>
    </motion.div>
  )
}

// ─── Home ─────────────────────────────────────────────
export default function Home({ navigate }) {
  return (
    <div className="px-6 py-12 md:px-10 md:py-16 pb-24 md:pb-32 max-w-7xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mb-16 md:mb-20"
      >


        {/* Title */}
        <div style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 'clamp(44px, 10vw, 112px)',
          lineHeight: 0.9,
          marginBottom: 32,
        }}>
          <div style={{ color: 'var(--text)' }}>QUANTUM</div>
          <div style={{
            color: 'transparent',
            WebkitTextStroke: '1px rgba(255,255,255,0.2)',
          }}>MECHANICS</div>
          <div style={{
            color: 'var(--cyan)',
            textShadow: '0 0 60px rgba(0,212,255,0.3)',
          }}>INTERACTIVE LAB</div>
        </div>

        {/* Meta row */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
          <div className="flex flex-col gap-4 max-w-lg">
            <p style={{
              fontSize: 15,
              color: 'var(--label)',
              lineHeight: 1.8,
              margin: 0,
            }}>
              An interactive simulation environment for exploring quantum mechanics concepts. 
              Visualize qubit states, quantum entanglement, and spin measurement experiments 
              with real-time 3D graphics and probabilistic simulations.
            </p>
            <div style={{
              fontFamily: '"Space Mono", monospace',
              fontSize: 14,
              color: 'var(--text)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: 'linear-gradient(90deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 212, 255, 0.02) 100%)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderLeft: '4px solid var(--cyan)',
              padding: '12px 16px',
              borderRadius: '4px 12px 12px 4px',
              boxShadow: '0 4px 15px rgba(0, 212, 255, 0.05)',
            }}>
              Under The Guidance of <span style={{ color: 'var(--cyan)', fontWeight: 'bold', fontSize: 15, textShadow: '0 0 10px rgba(0,212,255,0.4)' }}>Dr. N. PUNITHAVELAN</span>
            </div>


          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 md:gap-10 shrink-0">
            {[
              { num: '5', label: 'Modules' },
              { num: '3D', label: 'Visualization' },
              { num: '∞', label: 'Experiments' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: 40,
                  color: 'var(--cyan)',
                  lineHeight: 1,
                  textShadow: '0 0 20px rgba(0,212,255,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  height: 40,
                }}>
                  {s.num === '∞' ? (
                    <svg width="48" height="24" viewBox="0 0 100 50" style={{ overflow: 'visible', filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.6))' }}>
                      {/* Faint background track */}
                      <path 
                        d="M 50 25 C 35 10, 15 10, 15 25 C 15 40, 35 40, 50 25 C 65 10, 85 10, 85 25 C 85 40, 65 40, 50 25 Z"
                        fill="none"
                        stroke="rgba(0, 212, 255, 0.15)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Animated foreground stroke */}
                      <motion.path
                        d="M 50 25 C 35 10, 15 10, 15 25 C 15 40, 35 40, 50 25 C 65 10, 85 10, 85 25 C 85 40, 65 40, 50 25 Z"
                        fill="none"
                        stroke="var(--cyan)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
                        transition={{
                          duration: 3,
                          ease: "easeInOut",
                          repeat: Infinity,
                          repeatType: "loop",
                          repeatDelay: 0.2
                        }}
                      />
                    </svg>
                  ) : (
                    s.num
                  )}
                </div>
                <div style={{
                  fontFamily: '"Space Mono", monospace',
                  fontSize: 10,
                  color: 'var(--muted)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginTop: 4,
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: '100%',
          height: 1,
          background: 'linear-gradient(90deg, var(--cyan), transparent 60%)',
          opacity: 0.3,
          marginTop: 48,
        }} />
      </motion.div>

      {/* Section label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          fontFamily: '"Space Mono", monospace',
          fontSize: 10,
          color: 'var(--muted)',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: 24,
        }}
      >
        — Select a module to begin
      </motion.div>

      {/* Module cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod, i) => (
          <ModuleCard key={mod.id} mod={mod} navigate={navigate} index={i} />
        ))}
      </div>

      {/* Built By Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{ marginTop: 30, marginBottom: 40 }}
      >
        <div style={{
          fontFamily: '"Space Mono", monospace',
          fontSize: 10,
          letterSpacing: '0.25em',
          color: '#3a5a7a',
          textTransform: 'uppercase',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.2))' }} />
          BUILT BY
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(0, 212, 255, 0.2), transparent)' }} />
        </div>

        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {[
            { name: 'Dhruv', init: 'DH' },
            { name: 'Shashwat', init: 'SW' },
            { name: 'Arinjoy', init: 'AJ' },
            { name: 'Deepanshu', init: 'DS' },
            { name: 'Aaryan', init: 'AR' },
            { name: 'Kaviyan', init: 'KV' },
          ].map((member, i) => (
            <motion.div
              key={member.name}
              whileHover={{
                borderColor: '#00aacc',
                backgroundColor: 'rgba(0, 80, 120, 0.3)',
              }}
              initial={{ borderColor: '#0d2a45', backgroundColor: 'rgba(0, 20, 45, 0.4)' }}
              style={{
                border: '1px solid #0d2a45',
                borderRadius: 8,
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                minWidth: 95,
                cursor: 'default',
                position: 'relative',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '1.5px solid #0d3a5a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600,
                fontFamily: '"Space Mono", monospace',
                background: 'radial-gradient(circle at 30% 30%, #0d2a45, #060e1c)',
                color: '#4abfdc', letterSpacing: '0.05em'
              }}>
                {member.init}
              </div>
              <div style={{
                fontFamily: '"Space Mono", monospace',
                fontSize: 11, letterSpacing: '0.15em', color: '#00d4ff', textTransform: 'uppercase', fontWeight: 600
              }}>
                {member.name}
              </div>
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.9, 0.3],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.4,
                }}
                style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d4ff', marginTop: 2 }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Module Descriptions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-12 p-6 md:p-8 flex flex-col gap-6"
        style={{
          background: 'linear-gradient(145deg, rgba(8, 20, 48, 0.4) 0%, rgba(2, 6, 18, 0.6) 100%)',
          border: '1px solid rgba(0, 212, 255, 0.15)',
          borderRadius: 20,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div>
          <h4 style={{ color: '#00d4ff', marginBottom: 8, fontSize: 13, fontWeight: 600, fontFamily: '"Space Mono", monospace', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Single Qubit Bloch Sphere:
          </h4>
          <p style={{ fontSize: 14, color: 'var(--label)', lineHeight: 1.6, margin: 0 }}>
            An interactive visualization of a single qubit using the Bloch sphere model. It demonstrates how a qubit state evolves based on θ and φ, helping users understand superposition and quantum state representation.
          </p>
        </div>

        <div style={{ width: '100%', height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />

        <div>
          <h4 style={{ color: '#7b5ea7', marginBottom: 8, fontSize: 13, fontWeight: 600, fontFamily: '"Space Mono", monospace', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Two-Qubit Bloch Sphere:
          </h4>
          <p style={{ fontSize: 14, color: 'var(--label)', lineHeight: 1.6, margin: 0 }}>
            A two-qubit visualization to illustrate multi-qubit systems and their interactions. It highlights concepts like entanglement and correlations between qubits in a simplified visual manner.
          </p>
        </div>

        <div style={{ width: '100%', height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />

        <div>
          <h4 style={{ color: '#00ffb3', marginBottom: 8, fontSize: 13, fontWeight: 600, fontFamily: '"Space Mono", monospace', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Stern–Gerlach & Sequential Stern–Gerlach:
          </h4>
          <p style={{ fontSize: 14, color: 'var(--label)', lineHeight: 1.6, margin: 0 }}>
            Simulations of the Stern–Gerlach and sequential experiments to demonstrate spin quantization and measurement effects. It shows how sequential measurements along different axes influence outcomes, emphasizing quantum behavior and state collapse.
          </p>
        </div>

        <div style={{ width: '100%', height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />

        <div>
          <h4 style={{ color: '#ff4e6a', marginBottom: 8, fontSize: 13, fontWeight: 600, fontFamily: '"Space Mono", monospace', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Quantum Gates & Circuit Builder:
          </h4>
          <p style={{ fontSize: 14, color: 'var(--label)', lineHeight: 1.6, margin: 0 }}>
            An interactive module to build and execute single-qubit quantum circuits. Employs drag-and-drop mechanics to apply unitary transformations, mapping standard quantum gates directly to Bloch sphere rotations.
          </p>
        </div>

        <div style={{ width: '100%', height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />

        <div>
          <h4 style={{ color: '#ff9a3c', marginBottom: 8, fontSize: 13, fontWeight: 600, fontFamily: '"Space Mono", monospace', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Double Slit Interference:
          </h4>
          <p style={{ fontSize: 14, color: 'var(--label)', lineHeight: 1.6, margin: 0 }}>
            A true-to-physics real-time numerical visualizer created to simulate wave-particle duality and the observer effect, bringing Thomas Young's famous interference experiment to life.
          </p>
        </div>
      </motion.div>


      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-12 p-5 md:p-7 flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
        style={{
          background: 'rgba(0,212,255,0.04)',
          border: '1px solid rgba(0,212,255,0.12)',
          borderRadius: 12,
        }}
      >
        <Atom size={20} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: 'var(--label)', lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: 'var(--text)' }}>Quantum Physics Note:</strong>{' '}
          All simulations follow correct quantum mechanical principles. 
          Bloch sphere angles use the standard physics convention: θ ∈ [0, π], φ ∈ [0, 2π]. 
          Measurement outcomes are genuinely probabilistic, not predetermined.
        </p>
      </motion.div>
    </div>
  )
}
