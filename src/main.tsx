import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Named handler functions so they can be removed in the HMR dispose callback.
// Without storing references, removeEventListener has no effect and listeners
// accumulate on every Vite HMR reload.
const _handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent default browser behavior
};

const _handleError = (event: ErrorEvent) => {
  console.error('Uncaught error:', event.error);
};

// Store a reference to the IPC listener so only this module's handler is
// removed on HMR dispose, avoiding removal of other components' listeners.
const _handleMainProcessMessage = (_event: any, message: any) => {
  console.log(message);
};

// Bug fix: guard global error handlers against duplicate registration on HMR reloads.
// Each Vite HMR reload re-executes this module; without the guard, handlers accumulate.
if (!(window as any).__ozenHandlersInstalled) {
  (window as any).__ozenHandlersInstalled = true;
  window.addEventListener('unhandledrejection', _handleUnhandledRejection);
  window.addEventListener('error', _handleError);
}

// On HMR dispose, remove the registered listeners AND clear the flag so the
// next reload re-registers a fresh set without accumulating duplicates.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('unhandledrejection', _handleUnhandledRejection);
    window.removeEventListener('error', _handleError);
    (window as any).__ozenHandlersInstalled = false;
    // Remove only this module's IPC listener to avoid clearing other components' listeners
    (window as any).ipcRenderer?.removeListener?.('main-process-message', _handleMainProcessMessage);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Use contextBridge
window.ipcRenderer.on('main-process-message', _handleMainProcessMessage)

