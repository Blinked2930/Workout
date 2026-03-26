import { useEffect, useState } from 'react';

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallMessage, setShowInstallMessage] = useState(false);
  const [installMessage, setInstallMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallMessage(true);
      setInstallMessage('Install LiftLog on your device for a better experience');
      setShowToast(true);
      
      // Auto-hide the toast after 5 seconds
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setInstallMessage('Thank you for installing LiftLog!');
        setShowToast(true);
        
        // Auto-hide the success message after 3 seconds
        setTimeout(() => {
          setShowToast(false);
          setShowInstallMessage(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error during installation:', error);
      setInstallMessage('Failed to install the app. Please try again.');
      setShowToast(true);
    }
    
    setDeferredPrompt(null);
  };

  // Don't show the install button if the app is already installed
  if (!deferredPrompt || !showInstallMessage) {
    return null;
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      {showToast && (
        <div style={{
          backgroundColor: '#3182ce',
          color: 'white',
          padding: '0.75rem 1rem',
          borderRadius: '0.375rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{installMessage}</span>
          <button 
            onClick={() => setShowToast(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '0 0.5rem'
            }}
          >
            &times;
          </button>
        </div>
      )}
      
      <button
        onClick={handleInstallClick}
        style={{
          width: '100%',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#3182ce',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '1rem',
        }}
      >
        Install App
      </button>
    </div>
  );
};
