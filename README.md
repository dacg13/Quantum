# ⚛️ Quantum Mechanics Interactive Lab

Try it Out: https://quantumphy.netlify.app/

A modern, interactive web application for visualizing and simulating key quantum mechanics concepts. Built with React, Three.js, Tailwind CSS, and Recharts.

---

## 🚀 Modules

| Module | Description |
|--------|-------------|
| **Single Qubit Bloch Sphere** | 3D interactive Bloch sphere with real-time state vector, Dirac notation, and probability readouts |
| **Two Qubit / Entanglement** | Two-qubit state space with Bell state generator, concurrence meter, and probability bar charts |
| **Stern–Gerlach Experiment** | Animated particle beam simulator with probabilistic spin measurements and sequential SGz→SGx→SGz chain |
| **Quantum Gates Circuit Builder** | Interactive drag-and-drop circuit timeline with real-time 3D Bloch sphere vector animations |
| **Double Slit Interference** | WebGL shader-based simulation of wave-particle duality and the observer effect |

---

## 🛠 Tech Stack

- **React 18** — UI framework
- **Three.js 0.170** — 3D Bloch sphere visualization
- **Tailwind CSS 3** — Utility-first styling
- **Framer Motion** — Animations and transitions
- **Recharts** — Probability bar charts
- **Lucide React** — Icons
- **Vite** — Build tool

---

## 📦 Setup & Installation

### Prerequisites
- Node.js 18+ and npm

### Steps

```bash
# 1. Navigate to the project directory
cd Physics

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🔑 Environment Variables

See `.env.local` for configuration. No API keys are required — the app is fully client-side.

---

## 🧪 Physics Notes

- All simulations follow correct quantum mechanical principles
- Bloch sphere angles: θ ∈ [0, π], φ ∈ [0, 2π] (standard physics convention)
- Measurement outcomes are genuinely probabilistic (using `Math.random()`)
- Concurrence C uses the formula C = 2|ad − bc| for pure states
- Stern–Gerlach probabilities follow P(↑) = cos²(θ/2) where θ is the angle between the state vector and measurement axis
- Circuit Builder evaluates unitary matrices sequentially on complex amplitudes `α|0⟩ + β|1⟩`
- Double Slit Interference shader renders intensity via `I = |ψ₁ + ψ₂|²` (coherent superposition) and collapses to `I = |ψ₁|² + |ψ₂|²` when an observer is present

---

## 📁 Project Structure

```
src/
├── App.jsx                          # Root component, route management
├── main.jsx                         # Entry point
├── index.css                        # Global styles, CSS variables, custom scrollbar
└── components/
    ├── Layout/
    │   └── Layout.jsx               # Sidebar nav, star field background
    ├── Home/
    │   └── Home.jsx                 # Landing page with module cards
    ├── BlochSphere/
    │   └── SingleBlochSphere.jsx    # Module 1: 3D Bloch sphere (Three.js)
    ├── TwoQubit/
    │   └── TwoQubitBloch.jsx        # Module 2: Two-qubit entanglement
    ├── CircuitBuilder/
    │   ├── CircuitBuilder.jsx       # Module 4: Drag and drop 1-qubit circuit builder
    │   └── CircuitBlochCanvas.jsx   # Special Bloch canvas for circuit animations
    ├── DoubleSlit/
    │   ├── DoubleSlit.jsx           # Module 5: Double slit UI
    │   └── WaveSimulator.jsx        # WebGL shader component for waves
    └── SternGerlach/
        └── SternGerlach.jsx         # Module 3: Stern–Gerlach experiment
```

---

## 🎨 Design System

- **Theme**: Dark void with glassmorphism panels
- **Colors**: Cyan (#00D4FF), Violet (#7B5EA7), Gold (#F0C040), Green (#00FFB3), Red (#FF4E6A)
- **Fonts**: Bebas Neue (headings), DM Serif Display (italic accents), Space Mono (code/labels), Inter (body)
- **Spacing**: 8px base unit

---

*Built for university-level quantum mechanics courses.*
