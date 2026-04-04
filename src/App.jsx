import React, { useState } from 'react'
import Layout from './components/Layout/Layout.jsx'
import Home from './components/Home/Home.jsx'
import SingleBlochSphere from './components/BlochSphere/SingleBlochSphere.jsx'
import TwoQubitBloch from './components/TwoQubit/TwoQubitBloch.jsx'
import SternGerlach from './components/SternGerlach/SternGerlach.jsx'
import CircuitBuilder from './components/CircuitBuilder/CircuitBuilder.jsx'
import DoubleSlit from './components/DoubleSlit/DoubleSlit.jsx'

import { ROUTES } from './constants.js'

function App() {
  const [currentRoute, setCurrentRoute] = useState(ROUTES.HOME)

  const navigate = (route) => {
    setCurrentRoute(route)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderPage = () => {
    switch (currentRoute) {
      case ROUTES.HOME:
        return <Home navigate={navigate} />
      case ROUTES.SINGLE_BLOCH:
        return <SingleBlochSphere />
      case ROUTES.TWO_QUBIT:
        return <TwoQubitBloch />
      case ROUTES.STERN_GERLACH:
        return <SternGerlach />
      case ROUTES.CIRCUIT_BUILDER:
        return <CircuitBuilder />
      case ROUTES.DOUBLE_SLIT:
        return <DoubleSlit />
      default:
        return <Home navigate={navigate} />
    }
  }

  return (
    <Layout currentRoute={currentRoute} navigate={navigate}>
      {renderPage()}
    </Layout>
  )
}

export default App
