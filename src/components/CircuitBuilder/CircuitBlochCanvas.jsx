import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function CircuitBlochCanvas({ theta, phi }) {
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

    // Wireframe sphere
    const sphereGeo = new THREE.SphereGeometry(1, 32, 32)
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    scene.add(sphere)

    // Solid sphere
    const solidGeo = new THREE.SphereGeometry(1, 32, 32)
    const solidMat = new THREE.MeshPhongMaterial({
      color: 0x001a2e,
      transparent: true,
      opacity: 0.15,
      side: THREE.FrontSide,
    })
    scene.add(new THREE.Mesh(solidGeo, solidMat))

    // Equator circle
    const equatorGeo = new THREE.TorusGeometry(1, 0.004, 8, 128)
    const equatorMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.25 })
    const equator = new THREE.Mesh(equatorGeo, equatorMat)
    scene.add(equator)

    // Meridian circles
    const meridianMat = new THREE.MeshBasicMaterial({ color: 0x7b5ea7, transparent: true, opacity: 0.15 })
    for (let i = 0; i < 4; i++) {
      const meridian = new THREE.Mesh(new THREE.TorusGeometry(1, 0.003, 8, 128), meridianMat)
      meridian.rotation.y = (i * Math.PI) / 4
      scene.add(meridian)
    }

    // Axes
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
    
    const makeNegAxis = (dir, color) => {
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25 })
      const pts = [new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(-axisLength * 0.7)]
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      return new THREE.Line(geo, mat)
    }
    scene.add(makeNegAxis(new THREE.Vector3(1, 0, 0), 0xff4e6a))
    scene.add(makeNegAxis(new THREE.Vector3(0, 1, 0), 0x00ffb3))
    scene.add(makeNegAxis(new THREE.Vector3(0, 0, 1), 0xf0c040))

    // Labels
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

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const ptLight = new THREE.PointLight(0x00d4ff, 1, 10)
    ptLight.position.set(2, 2, 2)
    scene.add(ptLight)

    // State vector arrow
    const arrowDir = new THREE.Vector3(0, 1, 0)
    const arrowHelper = new THREE.ArrowHelper(arrowDir, new THREE.Vector3(0, 0, 0), 1.0, 0x00d4ff, 0.18, 0.1)
    arrowHelper.line.material.linewidth = 3
    scene.add(arrowHelper)

    // State endpoint tip
    const tipGeo = new THREE.SphereGeometry(0.06, 16, 16)
    const tipMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff })
    const tip = new THREE.Mesh(tipGeo, tipMat)
    scene.add(tip)

    // Projection line
    const projLineMat = new THREE.LineDashedMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.3, dashSize: 0.05, gapSize: 0.05 })
    const projLineGeo = new THREE.BufferGeometry()
    const projLine = new THREE.Line(projLineGeo, projLineMat)
    scene.add(projLine)

    sceneRef.current = { renderer, scene, camera, arrowHelper, tip, projLine }

    // Orbit controls manual logic
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

    let animId
    const animate = () => {
      animId = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

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

  // Animate the arrow using a small custom tween
  const targetState = useRef({ theta, phi })
  const currentState = useRef({ theta, phi })

  useEffect(() => {
    targetState.current = { theta, phi }
    
    // We can run a small animation loop specifically for the vector
    const duration = 800 // ms
    const startTime = performance.now()
    const startTheta = currentState.current.theta
    // Choose shortest path for phi
    let startPhi = currentState.current.phi
    let targetPhi = targetState.current.phi
    
    if (targetPhi - startPhi > Math.PI) startPhi += 2 * Math.PI
    if (startPhi - targetPhi > Math.PI) targetPhi += 2 * Math.PI

    let animId = null
    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    const updateArrow = (t, p) => {
      const { arrowHelper, tip, projLine } = sceneRef.current
      if (!arrowHelper) return
      
      const x = Math.sin(t) * Math.cos(p)
      const z = Math.sin(t) * Math.sin(p)
      const y = Math.cos(t)

      const dir = new THREE.Vector3(x, y, z).normalize()
      arrowHelper.setDirection(dir)
      tip.position.set(x, y, z)

      const projPoints = [
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(x, 0, z),
        new THREE.Vector3(0, 0, 0),
      ]
      projLine.geometry.dispose()
      projLine.geometry = new THREE.BufferGeometry().setFromPoints(projPoints)
      projLine.computeLineDistances()
    }

    const animStep = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const e = easeInOutCubic(progress)

      const currentTheta = startTheta + (targetState.current.theta - startTheta) * e
      const currentPhi = startPhi + (targetPhi - startPhi) * e

      currentState.current = { theta: currentTheta, phi: currentPhi }
      updateArrow(currentTheta, currentPhi)

      if (progress < 1) {
        animId = requestAnimationFrame(animStep)
      } else {
        // Keep phi normalized after animation
        currentState.current.phi = targetState.current.phi
      }
    }
    
    animId = requestAnimationFrame(animStep)
    return () => cancelAnimationFrame(animId)
  }, [theta, phi])

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', cursor: 'grab' }}
    />
  )
}
