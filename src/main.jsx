import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { DialogProvider } from './contexts/DialogContext'
import { TooltipProvider } from './components/ui/Tooltip'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <DialogProvider>
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </DialogProvider>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)
