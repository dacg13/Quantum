import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ROUTES } from '../../constants.js'
import { Atom, Home, Circle, GitBranch, FlaskConical, Menu, X, Cpu, Waves } from 'lucide-react'

const navItems = [
  { id: ROUTES.HOME, label: 'Home', icon: Home, kicker: '00' },
  { id: ROUTES.SINGLE_BLOCH, label: 'Single Qubit', sublabel: 'Bloch Sphere', icon: Circle, kicker: '01' },
  { id: ROUTES.TWO_QUBIT, label: 'Two Qubit', sublabel: 'Entanglement', icon: GitBranch, kicker: '02' },
  { id: ROUTES.STERN_GERLACH, label: 'Stern–Gerlach', sublabel: 'Experiment', icon: FlaskConical, kicker: '03' },
  { id: ROUTES.CIRCUIT_BUILDER, label: 'Quantum Gates', sublabel: 'Circuit Builder', icon: Cpu, kicker: '04' },
  { id: ROUTES.DOUBLE_SLIT, label: 'Double Slit', sublabel: 'Interference', icon: Waves, kicker: '05' },
]

// ─── Star Field ───────────────────────────────────────
function StarField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      op: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 0.003 + 0.001,
      phase: Math.random() * Math.PI * 2,
    }))

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    let t = 0
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      stars.forEach((s) => {
        const opacity = s.op * (0.5 + 0.5 * Math.sin(t * s.speed * 60 + s.phase))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${opacity})`
        ctx.fill()
      })
      t++
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}

// ─── Layout ───────────────────────────────────────────
export default function Layout({ children, currentRoute, navigate }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--void)', display: 'flex' }}>
      <StarField />

      {/* Mobile Top Navigation */}
      {isMobile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 60,
          background: 'rgba(5,5,8,0.92)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(24px)', zIndex: 60,
          display: 'flex', alignItems: 'center', padding: '0 16px',
          justifyContent: 'space-between'
        }}>
          <div style={{
            fontFamily: '"Bebas Neue", sans-serif', fontSize: 20,
            letterSpacing: '0.15em', color: 'var(--cyan)',
            textShadow: '0 0 20px rgba(0,212,255,0.5)',
          }}>
            QUANTUM<span style={{ color: 'var(--text)' }}>LAB</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none', border: 'none', color: 'var(--cyan)',
              cursor: 'pointer', padding: 8, display: 'flex'
            }}
          >
            <Menu size={24} />
          </button>
        </div>
      )}

      {/* Mobile Overlay Background */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)', zIndex: 65
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isMobile ? 260 : (sidebarOpen ? 260 : 72),
          x: isMobile ? (sidebarOpen ? 0 : -260) : 0
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 70,
          background: 'rgba(5,5,8,0.92)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(24px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Logo area */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minHeight: 64,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--cyan)',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: 16,
                  letterSpacing: '0.15em',
                  color: 'var(--cyan)',
                  textShadow: '0 0 20px rgba(0,212,255,0.5)',
                  whiteSpace: 'nowrap',
                }}>
                  QUANTUM<span style={{ color: 'var(--text)' }}>LAB</span>
                </div>
                <div style={{
                  fontFamily: '"Space Mono", monospace',
                  fontSize: 9,
                  color: 'var(--muted)',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}>
                  Interactive Lab
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => {
            const isActive = currentRoute === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.id)
                  if (isMobile) setSidebarOpen(false)
                }}
                title={!sidebarOpen ? item.label : undefined}
                style={{
                  background: isActive ? 'rgba(0,212,255,0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
                  borderRadius: 10,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  color: isActive ? 'var(--cyan)' : 'var(--muted)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.color = 'var(--text)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--muted)'
                  }
                }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    left: 0, top: 8, bottom: 8,
                    width: 3,
                    background: 'var(--cyan)',
                    borderRadius: '0 2px 2px 0',
                    boxShadow: '0 0 8px rgba(0,212,255,0.8)',
                  }} />
                )}

                <div style={{ flexShrink: 0, marginLeft: 4 }}>
                  <Icon size={18} />
                </div>

                <AnimatePresence>
                  {(isMobile || sidebarOpen) && (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      style={{ minWidth: 0 }}
                    >
                      <div style={{
                        fontFamily: '"Space Mono", monospace',
                        fontSize: 9,
                        color: isActive ? 'rgba(0,212,255,0.6)' : 'var(--muted)',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        marginBottom: 1,
                      }}>
                        {item.kicker}
                      </div>
                      <div style={{
                        fontFamily: '"Inter", sans-serif',
                        fontSize: 13,
                        fontWeight: 500,
                        color: isActive ? 'var(--cyan)' : 'inherit',
                        whiteSpace: 'nowrap',
                      }}>
                        {item.label}
                      </div>
                      {item.sublabel && (
                        <div style={{
                          fontFamily: '"Space Mono", monospace',
                          fontSize: 10,
                          color: 'var(--muted)',
                          whiteSpace: 'nowrap',
                        }}>
                          {item.sublabel}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <AnimatePresence>
          {(isMobile || sidebarOpen) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '12px 16px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{
                fontFamily: '"Space Mono", monospace',
                fontSize: 9,
                color: 'var(--muted)',
                letterSpacing: '0.1em',
                lineHeight: 1.8,
              }}>
                <div>React · Three.js · Tailwind</div>
                <div style={{ color: 'rgba(0,212,255,0.4)', marginTop: 2 }}>v1.0.0</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* ── Main content ── */}
      <motion.main
        animate={{ marginLeft: isMobile ? 0 : (sidebarOpen ? 260 : 72) }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          flex: 1,
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1,
          paddingTop: isMobile ? 60 : 0
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRoute}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.main>
    </div>
  )
}
