import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App'
import { readSsrData } from './lib/ssrData'
import { primeCache } from './services/api'
import './styles/index.css'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)
const ssrData = readSsrData()

if (ssrData && container.hasChildNodes()) {
  // Prerendered page: reuse the exact data the HTML was built from, then refresh in the background.
  primeCache(ssrData)
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
