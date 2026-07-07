import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './install' // must load early to catch the browser's install event
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
