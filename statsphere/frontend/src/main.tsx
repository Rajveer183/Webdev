import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App'
import { primeCache } from './services/api'
import './styles/index.css'

declare global {
  interface Window {
    __SSR_DATA__?: Record<string, unknown>
  }
}

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

if (window.__SSR_DATA__ && container.hasChildNodes()) {
  // Prerendered page: reuse the exact data the HTML was built from, then refresh in the background.
  primeCache(window.__SSR_DATA__)
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
