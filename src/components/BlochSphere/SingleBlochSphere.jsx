import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { RotateCcw, Info } from 'lucide-react'

// ─── Physics helpers ──────────────────────────────────
const PRESET_STATES = {
  '|0⟩': { theta: 0, phi: 0, label: 'Spin Up (North Pole)' },
  '|1⟩': { theta: Math.PI, phi: 0, label: 'Spin Down (South Pole)' },
  '|+⟩': { theta: Math.PI / 2, phi: 0, label: 'Plus State (X+)' },
  '|−⟩': { theta: Math.PI / 2, phi: Math.PI, label: 'Minus State (X-)' },
  '|+i⟩': { theta: Math.PI / 2, phi: Math.PI / 2, label: 'Y+ State' },
  '|−i⟩': { theta: Math.PI / 2, phi: 3 * Math.PI / 2, label: 'Y− State' },
  'Custom': null,
}

function stateToXYZ(theta, phi) {
  return {
    x: Math.sin(theta) * Math.cos(phi),
    y: Math.cos(theta),
    z: Math.sin(theta) * Math.sin(phi),
  }
}

function prob0(theta) { return Math.cos(theta / 2) ** 2 }
function prob1(theta) { return Math.sin(theta / 2) ** 2 }

// ─── Bloch Sphere Canvas (Three.js) ───────────────────
function BlochSphereCanvas({ theta, phi }) {
  const mountRef = useRef(null)
  const sceneRef = useRef({})

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // Scene
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.set(2.2, 1.6, 2.2)
    camera.lookAt(0, 0, 0)

    // ── Wireframe sphere ──
    const sphereGeo = new THREE.SphereGeometry(1, 32, 32)
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    scene.add(sphere)

    // ── Solid sphere (very transparent) ──
    const solidGeo = new THREE.SphereGeometry(1, 32, 32)
    const solidMat = new THREE.MeshPhongMaterial({
      color: 0x001a2e,
      transparent: true,
      opacity: 0.15,
      side: THREE.FrontSide,
    })
    scene.add(new THREE.Mesh(solidGeo, solidMat))

    // ── Equator circle ──
    const equatorGeo = new THREE.TorusGeometry(1, 0.004, 8, 128)
    const equatorMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.25 })
    const equator = new THREE.Mesh(equatorGeo, equatorMat)
    scene.add(equator)

    // ── Meridian circles ──
    const meridianMat = new THREE.MeshBasicMaterial({ color: 0x7b5ea7, transparent: true, opacity: 0.15 })
    for (let i = 0; i < 4; i++) {
      const meridian = new THREE.Mesh(new THREE.TorusGeometry(1, 0.003, 8, 128), meridianMat)
      meridian.rotation.y = (i * Math.PI) / 4
      scene.add(meridian)
    }

    // ── Axes ──
    const axisLength = 1.4
    const makeAxis = (dir, color) => {
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 })
      const pts = [new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(axisLength)]
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      return new THREE.Line(geo, mat)
    }
    scene.add(makeAxis(new THREE.Vector3(1, 0, 0), 0xff4e6a))   // X = red
    scene.add(makeAxis(new THREE.Vector3(0, 1, 0), 0x00ffb3))   // Y = green
    scene.add(makeAxis(new THREE.Vector3(0, 0, 1), 0xf0c040))   // Z = gold
    // Negative dashed axes (lighter)
    const makeNegAxis = (dir, color) => {
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25 })
      const pts = [new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(-axisLength * 0.7)]
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      return new THREE.Line(geo, mat)
    }
    scene.add(makeNegAxis(new THREE.Vector3(1, 0, 0), 0xff4e6a))
    scene.add(makeNegAxis(new THREE.Vector3(0, 1, 0), 0x00ffb3))
    scene.add(makeNegAxis(new THREE.Vector3(0, 0, 1), 0xf0c040))

    // ── Axis labels (sprites) ──
    const makeLabel = (text, position, color) => {
      const canvas = document.createElement('canvas')
      canvas.width = 64; canvas.height = 64
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = color
      ctx.font = 'bold 36px "Space Mono", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, 32, 32)
      const tex = new THREE.CanvasTexture(canvas)
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true })
      const sprite = new THREE.Sprite(mat)
      sprite.position.copy(position)
      sprite.scale.set(0.3, 0.3, 0.3)
      return sprite
    }
    scene.add(makeLabel('X', new THREE.Vector3(axisLength + 0.15, 0, 0), '#ff4e6a'))
    scene.add(makeLabel('Z', new THREE.Vector3(0, axisLength + 0.15, 0), '#00ffb3'))
    scene.add(makeLabel('Y', new THREE.Vector3(0, 0, axisLength + 0.15), '#f0c040'))
    scene.add(makeLabel('|0⟩', new THREE.Vector3(0, axisLength + 0.35, 0), '#00d4ff'))
    scene.add(makeLabel('|1⟩', new THREE.Vector3(0, -(axisLength + 0.35), 0), '#7b5ea7'))

    // ── Ambient + Point lights ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const ptLight = new THREE.PointLight(0x00d4ff, 1, 10)
    ptLight.position.set(2, 2, 2)
    scene.add(ptLight)

    // ── State vector arrow ──
    const arrowDir = new THREE.Vector3(0, 1, 0)
    const arrowHelper = new THREE.ArrowHelper(arrowDir, new THREE.Vector3(0, 0, 0), 1.0, 0x00d4ff, 0.18, 0.1)
    arrowHelper.line.material.linewidth = 3
    scene.add(arrowHelper)

    // ── State endpoint sphere ──
    const tipGeo = new THREE.SphereGeometry(0.06, 16, 16)
    const tipMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff })
    const tip = new THREE.Mesh(tipGeo, tipMat)
    scene.add(tip)

    // ── Projection lines ──
    const projLineMat = new THREE.LineDashedMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.3, dashSize: 0.05, gapSize: 0.05 })
    const projLineGeo = new THREE.BufferGeometry()
    const projLine = new THREE.Line(projLineGeo, projLineMat)
    scene.add(projLine)

    // ── Store references ──
    sceneRef.current = { renderer, scene, camera, arrowHelper, tip, projLine }

    // ── Orbit controls (manual) ──
    let isDragging = false, prevMouse = { x: 0, y: 0 }
    let spherical = { theta: 0.6, phi: 0.8 }
    const radius = 3.5

    const updateCamera = () => {
      camera.position.x = radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
      camera.position.y = radius * Math.cos(spherical.phi)
      camera.position.z = radius * Math.sin(spherical.phi) * Math.sin(spherical.theta)
      camera.lookAt(0, 0, 0)
    }
    updateCamera()

    const onMouseDown = (e) => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY } }
    const onMouseUp = () => { isDragging = false }
    const onMouseMove = (e) => {
      if (!isDragging) return
      const dx = e.clientX - prevMouse.x
      const dy = e.clientY - prevMouse.y
      spherical.theta -= dx * 0.01
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + dy * 0.01))
      prevMouse = { x: e.clientX, y: e.clientY }
      updateCamera()
    }
    // Touch
    const onTouchStart = (e) => { isDragging = true; prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
    const onTouchMove = (e) => {
      if (!isDragging) return
      const dx = e.touches[0].clientX - prevMouse.x
      const dy = e.touches[0].clientY - prevMouse.y
      spherical.theta -= dx * 0.01
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + dy * 0.01))
      prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      updateCamera()
    }

    renderer.domElement.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchend', onMouseUp)
    window.addEventListener('touchmove', onTouchMove)

    // ── Animation loop ──
    let animId
    const animate = () => {
      animId = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // ── Resize ──
    const onResize = () => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchend', onMouseUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  // Update arrow when theta/phi changes
  useEffect(() => {
    const { arrowHelper, tip } = sceneRef.current
    if (!arrowHelper) return

    const { x, y, z } = stateToXYZ(theta, phi)
    // Note: Three.js uses Y-up, Bloch sphere convention maps:
    // Bloch Z → Three.js Y, Bloch X → Three.js X, Bloch Y → Three.js Z
    const dir = new THREE.Vector3(x, y, z).normalize()
    arrowHelper.setDirection(dir)
    tip.position.set(x, y, z)

    // Projection dot on XZ plane
    const projPoints = [
      new THREE.Vector3(x, y, z),
      new THREE.Vector3(x, 0, z),
      new THREE.Vector3(0, 0, 0),
    ]
    const projGeo = new THREE.BufferGeometry().setFromPoints(projPoints)
    sceneRef.current.projLine.geometry.dispose()
    sceneRef.current.projLine.geometry = projGeo
    sceneRef.current.projLine.computeLineDistances()
  }, [theta, phi])

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', cursor: 'grab' }}
    />
  )
}

// ─── Info Panel ───────────────────────────────────────
function InfoPanel({ theta, phi }) {
  const p0 = prob0(theta)
  const p1 = prob1(theta)

  // Format angles
  const thetaDeg = ((theta / Math.PI) * 180).toFixed(1)
  const phiDeg = ((phi / Math.PI) * 180).toFixed(1)

  // Dirac notation coefficients
  const cosHalf = Math.cos(theta / 2).toFixed(4)
  const sinHalf = Math.sin(theta / 2).toFixed(4)
  const phiStr = phi === 0 ? '' : `e^(i·${phiDeg}°)·`

  return (
    <div className="flex flex-col gap-4">
      {/* State formula */}
      <div
        className="p-4 md:p-[18px]"
        style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: 10,
        }}>
        <div style={{
          fontFamily: '"Space Mono", monospace',
          fontSize: 9,
          color: 'var(--muted)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          Quantum State
        </div>
        <div style={{
          fontFamily: '"Space Mono", monospace',
          fontSize: 13,
          color: 'var(--cyan)',
          lineHeight: 1.8,
        }}>
          |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩
        </div>
        <div style={{
          fontFamily: '"Space Mono", monospace',
          fontSize: 12,
          color: 'var(--text)',
          marginTop: 8,
          lineHeight: 1.6,
        }}>
          |ψ⟩ = {cosHalf}|0⟩ + {phiStr}{sinHalf}|1⟩
        </div>
      </div>

      {/* Angles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}>
        {[
          { label: 'θ (Theta)', value: `${thetaDeg}°`, sub: `${(theta / Math.PI).toFixed(3)}π rad` },
          { label: 'φ (Phi)', value: `${phiDeg}°`, sub: `${(phi / Math.PI).toFixed(3)}π rad` },
        ].map((a, i) => (
          <div key={i} className="p-3 md:p-[14px]" style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
          }}>
            <div style={{
              fontFamily: '"Space Mono", monospace',
              fontSize: 9,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 4,
            }}>
              {a.label}
            </div>
            <div style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 28,
              color: 'var(--cyan)',
              lineHeight: 1,
            }}>
              {a.value}
            </div>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
              {a.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Probabilities */}
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
          Measurement Probabilities
        </div>

        {[
          { state: '|0⟩', prob: p0, color: '#00d4ff' },
          { state: '|1⟩', prob: p1, color: '#7b5ea7' },
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
      </div>

      {/* Bloch vector components */}
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
          marginBottom: 10,
        }}>
          Bloch Vector ⟨σ⟩
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { ax: '⟨X⟩', val: Math.sin(theta) * Math.cos(phi), color: '#ff4e6a' },
            { ax: '⟨Y⟩', val: Math.sin(theta) * Math.sin(phi), color: '#f0c040' },
            { ax: '⟨Z⟩', val: Math.cos(theta), color: '#00ffb3' },
          ].map((c, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: c.color }}>{c.ax}</div>
              <div style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 20,
                color: 'var(--text)',
                marginTop: 2,
              }}>
                {c.val.toFixed(3)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Slider ───────────────────────────────────────────
function ControlSlider({ label, value, min, max, step, onChange, color, thumbClass, unit, displayValue }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label style={{
          fontFamily: '"Space Mono", monospace',
          fontSize: 11,
          color: 'var(--label)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {label}
        </label>
        <span style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 20,
          color: color || 'var(--cyan)',
        }}>
          {displayValue || `${value.toFixed(3)}${unit || ''}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={thumbClass}
        style={{ 
          width: '100%',
          '--val': `${((value - min) / (max - min)) * 100}%`,
          '--track-color': color || 'var(--cyan)'
        }}
      />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 4,
        fontFamily: '"Space Mono", monospace',
        fontSize: 9,
        color: 'var(--muted)',
      }}>
        <span>{min === 0 ? '0' : min}</span>
        <span>{max === Math.PI ? 'π' : max === 2 * Math.PI ? '2π' : max}</span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────
export default function SingleBlochSphere() {
  const [theta, setTheta] = useState(Math.PI / 4)
  const [phi, setPhi] = useState(Math.PI / 4)
  const [preset, setPreset] = useState('Custom')
  const [showInfo, setShowInfo] = useState(false)

  const handlePreset = (key) => {
    setPreset(key)
    if (PRESET_STATES[key]) {
      setTheta(PRESET_STATES[key].theta)
      setPhi(PRESET_STATES[key].phi)
    }
  }

  const handleSlider = useCallback((setter) => (val) => {
    setter(val)
    setPreset('Custom')
  }, [])

  const handleReset = () => {
    setTheta(Math.PI / 4)
    setPhi(Math.PI / 4)
    setPreset('Custom')
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
              color: 'var(--cyan)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Module 01
            </div>
            <h1 style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 'clamp(36px, 5vw, 64px)',
              lineHeight: 0.95,
              color: 'var(--text)',
              margin: 0,
            }}>
              SINGLE QUBIT<br />
              <span style={{ color: 'var(--cyan)', textShadow: '0 0 30px rgba(0,212,255,0.3)' }}>BLOCH SPHERE</span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowInfo(!showInfo)}
              style={{
                background: showInfo ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${showInfo ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8,
                padding: '10px 16px',
                color: showInfo ? 'var(--cyan)' : 'var(--muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: '"Space Mono", monospace',
                fontSize: 11,
                transition: 'all 0.2s',
              }}
            >
              <Info size={14} /> Info
            </button>
            <button
              onClick={handleReset}
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
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>
        <div style={{
          width: '100%', height: 1,
          background: 'linear-gradient(90deg, var(--cyan), transparent 60%)',
          opacity: 0.2, marginTop: 16,
        }} />
      </motion.div>

      {/* Info panel */}
      {showInfo && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{
            marginBottom: 24,
            padding: '16px 20px',
            background: 'rgba(0,212,255,0.04)',
            border: '1px solid rgba(0,212,255,0.15)',
            borderRadius: 10,
            fontSize: 13,
            color: 'var(--label)',
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: 'var(--cyan)' }}>Bloch Sphere:</strong> A geometrical representation of the pure state space of a two-level quantum system.
          The north pole represents |0⟩, south pole represents |1⟩. Points on the equator represent equal superpositions.
          Drag to rotate the 3D view. θ is the polar angle, φ is the azimuthal angle.
        </motion.div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        {/* 3D Canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="h-[400px] md:h-[500px]"
          style={{
            background: 'rgba(5,5,8,0.6)',
            border: '1px solid rgba(0,212,255,0.12)',
            borderRadius: 16,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <BlochSphereCanvas theta={theta} phi={phi} />
          {/* Drag hint */}
          <div style={{
            position: 'absolute',
            bottom: 16, left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: '"Space Mono", monospace',
            fontSize: 9,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.1em',
            pointerEvents: 'none',
          }}>
            DRAG TO ROTATE
          </div>
          {/* Axis legend */}
          <div style={{
            position: 'absolute', top: 16, left: 16,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {[['X', '#ff4e6a'], ['Y', '#f0c040'], ['Z', '#00ffb3']].map(([ax, col]) => (
              <div key={ax} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 2, background: col, borderRadius: 1 }} />
                <span style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: col }}>{ax}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right panel */}
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
            <div style={{
              fontFamily: '"Space Mono", monospace',
              fontSize: 9,
              color: 'var(--muted)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}>
              Controls
            </div>

            {/* Preset dropdown */}
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontFamily: '"Space Mono", monospace',
                fontSize: 11,
                color: 'var(--label)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>
                Preset State
              </div>
              <div style={{ position: 'relative' }}>
                <select
                  value={preset}
                  onChange={(e) => handlePreset(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {Object.keys(PRESET_STATES).map(k => (
                    <option key={k} value={k}>{k}{PRESET_STATES[k] ? ` — ${PRESET_STATES[k].label}` : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Theta slider */}
            <ControlSlider
              label="θ — Polar Angle"
              value={theta}
              min={0}
              max={Math.PI}
              step={0.01}
              onChange={handleSlider(setTheta)}
              color="var(--cyan)"
              displayValue={`${((theta / Math.PI) * 180).toFixed(1)}°`}
            />

            {/* Phi slider */}
            <ControlSlider
              label="φ — Azimuthal Angle"
              value={phi}
              min={0}
              max={2 * Math.PI}
              step={0.01}
              onChange={handleSlider(setPhi)}
              color="var(--violet)"
              thumbClass="violet-thumb"
              displayValue={`${((phi / Math.PI) * 180).toFixed(1)}°`}
            />
          </div>

          {/* State info */}
          <InfoPanel theta={theta} phi={phi} />
        </motion.div>
      </div>
    </div>
  )
}
