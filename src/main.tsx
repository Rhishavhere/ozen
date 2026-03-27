import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Bug fix: guard global error handlers against duplicate registration on HMR reloads.
// Each Vite HMR reload re-executes this module; without the guard, handlers accumulate.
if (!(window as any).__ozenHandlersInstalled) {
  (window as any).__ozenHandlersInstalled = true;

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault(); // Prevent default browser behavior
  });

  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
  });
}

// On HMR dispose, clear the flag so the next reload re-registers a fresh set.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    (window as any).__ozenHandlersInstalled = false;
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})

