// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './utils/envTest'; // Import the test file
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// UPGRADED ERROR BOUNDARY: Actually shows the exact error and stack trace!
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null, errorInfo: React.ErrorInfo | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#16171a', color: '#ff4d6d', minHeight: '100vh' }}>
          <h1 style={{ borderBottom: '1px solid #ff4d6d', paddingBottom: '10px' }}>🚨 React Render Crash</h1>
          <h3 style={{ color: '#fff' }}>{this.state.error.message}</h3>
          <details style={{ whiteSpace: 'pre-wrap', backgroundColor: '#0d0d0f', padding: '15px', borderRadius: '8px', overflowX: 'auto', border: '1px solid rgba(255, 77, 109, 0.3)', color: '#d2a8ff', marginTop: '15px' }}>
            <summary style={{ cursor: 'pointer', color: '#00d4ff', fontWeight: 'bold', marginBottom: '10px' }}>View Stack Trace (Click to expand)</summary>
            {this.state.error.stack}
            {'\n\nComponent Stack:\n'}
            {this.state.errorInfo?.componentStack}
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#ff4d6d', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

console.log('Application starting...');

try {
  // Register service worker with callbacks
  try {
    console.log('Attempting to register service worker...');
    serviceWorkerRegistration.register({
      onSuccess: (registration: ServiceWorkerRegistration) => {
        console.log('ServiceWorker registration successful', registration);
      },
      onUpdate: (registration: ServiceWorkerRegistration) => {
        console.log('New content is available; please refresh.', registration);
        if (window.confirm('A new version is available! Would you like to update?')) {
          const worker = registration.waiting;
          if (worker) {
            // Send message to the waiting service worker to skip waiting
            worker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      }
    });
    console.log('Service worker registration initiated');
  } catch (error) {
    console.error('Error during service worker registration:', error);
  }

  // Listen for the controlling service worker changing
  // and refresh the page
  let refreshing = false;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        window.location.reload();
        refreshing = true;
      }
    });
  } else {
    console.warn('Service workers are not supported in this browser');
  }

  console.log('Creating React root...');
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Failed to find the root element');
  }

  const root = ReactDOM.createRoot(rootElement);
  console.log('Rendering App component...');
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  
  console.log('App rendered successfully');
} catch (error) {
  console.error('Fatal error during app initialization:', error);
  
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: monospace; color: #ff4d6d; background-color: #16171a; min-height: 100vh;">
        <h1>Fatal Initialization Error</h1>
        <p>${error instanceof Error ? error.message : String(error)}</p>
      </div>
    `;
  }
}