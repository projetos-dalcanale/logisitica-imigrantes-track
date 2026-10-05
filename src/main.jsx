import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { DialogProvider } from './contexts/DialogContext'
import { TooltipProvider } from './components/ui/Tooltip'
import { MotionConfig } from 'motion/react'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { instalarRegistroDeErros } from './lib/erros'

instalarRegistroDeErros()
// Abriu bem: libera a recarga automática para uma próxima atualização.
setTimeout(() => {
  try {
    sessionStorage.removeItem('logitrack-recarregou')
  } catch { /* sem sessionStorage */ }
}, 10000)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      {/* Respeita a opção "reduzir movimento" do sistema em todas as animações. */}
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <ToastProvider>
            <DialogProvider>
              <TooltipProvider>
                <App />
              </TooltipProvider>
            </DialogProvider>
          </ToastProvider>
        </AuthProvider>
      </MotionConfig>
    </ErrorBoundary>
  </StrictMode>,
)
