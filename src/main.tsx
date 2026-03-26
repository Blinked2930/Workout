// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './utils/envTest'; // Import the test file
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Add error boundary for the entire app
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Error in app:', error);
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1>Something went wrong.</h1>
          <p>Please refresh the page or try again later.</p>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
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
      <div style="padding: 20px; font-family: Arial, sans-serif; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; margin: 20px;">
        <h1>Application Error</h1>
        <p>Failed to initialize the application. Please check the console for more details.</p>
        <p>${error instanceof Error ? error.message : String(error)}</p>
        <button onclick="window.location.reload()" style="padding: 8px 16px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Try Again
        </button>
      </div>
    `;
  }
}