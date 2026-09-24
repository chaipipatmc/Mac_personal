import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initPlanStore } from './lib/planStore'
import './styles.css'

initPlanStore()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
