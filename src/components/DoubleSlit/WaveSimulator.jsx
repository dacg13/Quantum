import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform float time;
uniform float wavelength;
uniform float slitDistance;
uniform float collapseProgress;
varying vec2 vUv;

// Spectral wavelength (nm) to RGB
vec3 spectralColor(float nm) {
  float r = 0.0, g = 0.0, b = 0.0;
  if (nm >= 380.0 && nm < 440.0) { r = -(nm - 440.0) / 60.0; b = 1.0; }
  else if (nm >= 440.0 && nm < 490.0) { g = (nm - 440.0) / 50.0; b = 1.0; }
  else if (nm >= 490.0 && nm < 510.0) { g = 1.0; b = -(nm - 510.0) / 20.0; }
  else if (nm >= 510.0 && nm < 580.0) { r = (nm - 510.0) / 70.0; g = 1.0; }
  else if (nm >= 580.0 && nm < 645.0) { r = 1.0; g = -(nm - 645.0) / 65.0; }
  else if (nm >= 645.0 && nm <= 780.0) { r = 1.0; }

  float f = 1.0;
  if (nm >= 380.0 && nm < 420.0) f = 0.3 + 0.7 * (nm - 380.0) / 40.0;
  else if (nm > 700.0 && nm <= 780.0) f = 0.3 + 0.7 * (780.0 - nm) / 80.0;
  else if (nm < 380.0 || nm > 780.0) f = 0.0;

  return vec3(r, g, b) * f;
}

// Noise for collapse transition
float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  uv.x *= 2.0;

  float slitX = -1.5;
  vec2 slit1 = vec2(slitX, slitDistance / 2.0);
  vec2 slit2 = vec2(slitX, -slitDistance / 2.0);

  float d1 = distance(uv, slit1);
  float d2 = distance(uv, slit2);

  float k = 40.0 / wavelength;
  float w = 5.0;

  float amp1 = 1.0 / (d1 + 0.3);
  float amp2 = 1.0 / (d2 + 0.3);

  float re1 = amp1 * cos(k * d1 - w * time);
  float im1 = amp1 * sin(k * d1 - w * time);
  float re2 = amp2 * cos(k * d2 - w * time);
  float im2 = amp2 * sin(k * d2 - w * time);

  // === COHERENT INTERFERENCE ===
  float sr = re1 + re2;
  float si = im1 + im2;
  float interference = sr * sr + si * si;
  interference = pow(max(interference, 0.0), 1.8) * 0.6;

  // === DECOHERENCE (two-hump classical shadow) ===
  float ang1 = atan(uv.y - slit1.y, uv.x - slit1.x);
  float ang2 = atan(uv.y - slit2.y, uv.x - slit2.x);
  float env1 = exp(-ang1 * ang1 * 4.0);
  float env2 = exp(-ang2 * ang2 * 4.0);

  float indiv1 = (re1 * re1 + im1 * im1) * env1;
  float indiv2 = (re2 * re2 + im2 * im2) * env2;
  float decoherence = (indiv1 + indiv2) * 1.2;

  // === COLLAPSE TRANSITION ===
  float noise = hash21(uv * 40.0 + vec2(time * 8.0));
  float noiseBand = smoothstep(0.15, 0.5, collapseProgress) * smoothstep(0.85, 0.5, collapseProgress);
  float glitch = noise * noiseBand * 0.5;

  float mixAmt = smoothstep(0.0, 1.0, collapseProgress);
  float intensity = mix(interference, decoherence, mixAmt) + glitch;

  // Propagation mask
  float propagationMask = smoothstep(slitX - 0.05, slitX + 0.05, uv.x);

  // Barrier wall
  float wallGlow = smoothstep(0.025, 0.0, abs(uv.x - slitX));
  float slitHole1 = smoothstep(0.05, 0.0, distance(uv, slit1));
  float slitHole2 = smoothstep(0.05, 0.0, distance(uv, slit2));
  float wallFinal = max(0.0, wallGlow - slitHole1 * 2.0 - slitHole2 * 2.0);

  intensity *= propagationMask;

  // === WAVELENGTH → VISIBLE COLOR ===
  float visNm = 400.0 + (wavelength - 0.2) / 1.8 * 300.0;
  vec3 specColor = spectralColor(visNm);
  specColor = max(specColor, vec3(0.04, 0.12, 0.22));

  vec3 color = vec3(0.0, 0.0, 0.02);
  vec3 waveColor = mix(specColor * 0.12, specColor, smoothstep(0.0, 0.7, intensity));
  color += waveColor * intensity;

  // Wall
  color += vec3(0.25, 0.3, 0.5) * wallFinal;

  // Detection screen glow
  float screenDist = abs(uv.x - 1.9);
  if (uv.x > 1.78) {
    float screenGlow = smoothstep(0.14, 0.0, screenDist);
    color += specColor * intensity * 1.8 * screenGlow;
  }

  // Incoming plane wave
  if (uv.x < slitX - 0.02) {
    float plane = cos(k * uv.x - w * time);
    float planeI = plane * plane * 0.35;
    color += specColor * 0.55 * planeI;
  }

  gl_FragColor = vec4(color, 1.0);
}
`

export default function WaveSimulator({ wavelength, slitDistance, detectorActive }) {
  const mountRef = useRef(null)
  const materialRef = useRef(null)
  const collapseTargetRef = useRef(0)
  const collapseProgressRef = useRef(0)

  useEffect(() => {
    collapseTargetRef.current = detectorActive ? 1.0 : 0.0
  }, [detectorActive])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
    camera.position.z = 1

    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        wavelength: { value: wavelength },
        slitDistance: { value: slitDistance },
        collapseProgress: { value: 0 },
      }
    })
    materialRef.current = material

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    let animId
    const startTime = performance.now()
    const SPEED = 1.0 / (0.8 * 60) // 0.8s transition at 60fps

    const animate = () => {
      animId = requestAnimationFrame(animate)
      if (!materialRef.current) return

      materialRef.current.uniforms.time.value = (performance.now() - startTime) * 0.001

      // Animate collapse
      const target = collapseTargetRef.current
      const cur = collapseProgressRef.current
      if (cur < target) collapseProgressRef.current = Math.min(cur + SPEED, target)
      else if (cur > target) collapseProgressRef.current = Math.max(cur - SPEED, target)
      materialRef.current.uniforms.collapseProgress.value = collapseProgressRef.current

      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      if (!mount) return
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.wavelength.value = wavelength
      materialRef.current.uniforms.slitDistance.value = slitDistance
    }
  }, [wavelength, slitDistance])

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden' }}
    />
  )
}
