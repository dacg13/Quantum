# Quantum Mechanics Interactive Lab

## Project Description
Create a modern, interactive, menu-driven web application called:

"Quantum Mechanics Interactive Lab"

The purpose of this app is to help students visualize and interact with key quantum physics concepts including:

1. Bloch Sphere (Single Qubit)
2. Bloch Sphere (Two Qubits / Entanglement visualization)
3. Stern–Gerlach Experiment Simulator

---

## GENERAL REQUIREMENTS

* Use React for frontend
* Use Tailwind CSS for styling
* Use Three.js for 3D visualizations
* Use modular component structure
* The UI must be clean, modern, and responsive
* Add smooth transitions and animations
* Include a sidebar or top navigation menu to switch between modules
* Make everything interactive with sliders, dropdowns, and buttons
* No backend required (pure frontend simulation)

---

## APP STRUCTURE

Main Layout:

* Sidebar menu with options:

  * Home
  * Single Qubit Bloch Sphere
  * Two Qubit Bloch Sphere
  * Stern–Gerlach Experiment

Each module should load dynamically without page refresh.

---

## HOME PAGE

* Title: "Quantum Mechanics Interactive Lab"
* Short description of each module
* Cards with navigation buttons to each module

---

## MODULE 1: SINGLE QUBIT BLOCH SPHERE

Display a 3D Bloch sphere with:

* X, Y, Z axes labeled
* A vector representing the quantum state

User Controls:

* Sliders for:

  * Theta (0 to π)
  * Phi (0 to 2π)
* Dropdown for preset states:

  * |0⟩
  * |1⟩
  * |+⟩
  * |−⟩

Functionality:

* Update the state vector in real-time when sliders change
* Show state in Dirac notation:
  |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ) sin(θ/2)|1⟩
* Display probability of measuring |0⟩ and |1⟩

---

## MODULE 2: TWO QUBIT BLOCH / ENTANGLEMENT

Instead of a true 4D Bloch sphere, implement:

* State representation of two qubits
* Show basis states:
  |00⟩, |01⟩, |10⟩, |11⟩

User Controls:

* Sliders for amplitudes (normalized automatically)
* Button: "Create Bell State"

Functionality:

* Show probability distribution for each basis state
* Visual bar graph of probabilities
* When Bell state selected:

  * Display entanglement message
  * Lock correlated probabilities

---

## MODULE 3: STERN–GERLACH SIMULATOR

Simulate spin measurement of particles.

Visual:

* Particle beam entering apparatus
* Split into spin-up and spin-down

User Controls:

* Dropdown:

  * Initial state: |+z⟩, |−z⟩, |+x⟩, |−x⟩
* Dropdown:

  * Measurement axis: Z, X, Y
* Number input:

  * Number of particles (e.g. 100, 500, 1000)

Functionality:

* Simulate probabilistic measurement
* Show:

  * Counts of spin-up and spin-down
  * Animated beam splitting
* Sequential experiment option:

  * SGz → SGx → SGz chain

---

## UI FEATURES

* Use cards for each module
* Smooth hover effects
* Dark theme preferred
* Display equations in readable format
* Add small info panels explaining physics

---

## EXTRA FEATURES (IMPORTANT FOR MARKS)

* Reset button in each module
* Real-time updates
* Tooltips explaining controls
* Display mathematical formulas clearly

---

## OUTPUT REQUIREMENTS

* Full React project structure
* All components separated cleanly
* Code should be readable and well-commented
* No unnecessary complexity
* Must run without backend

---

## GOAL

The final app should feel like a professional physics simulation tool that can be used for learning, presentations, and demonstrations in a university-level quantum mechanics course.

Focus equally on:

* Correct physics
* Smooth interactivity
* Clean UI design


## Product Requirements Document
Not available

## Technology Stack
Not available

## Project Structure
Not available

## Database Schema Design
Not available

## User Flow
Not available

## Styling Guidelines
Not available
