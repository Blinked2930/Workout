import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

type AuthContextType = {
  currentUser: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check localStorage for existing authentication
    const storedAuth = localStorage.getItem('liftlog_auth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.isAuthenticated) {
          setCurrentUser({ username: authData.username });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error parsing stored auth:', error);
        localStorage.removeItem('liftlog_auth');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Check hardcoded credentials
      const correctUsername = import.meta.env.VITE_APP_USERNAME;
      const correctPassword = import.meta.env.VITE_APP_PASSWORD;
      
      if (username === correctUsername && password === correctPassword) {
        const user = { username };
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        // Store in localStorage for persistence
        localStorage.setItem('liftlog_auth', JSON.stringify({
          isAuthenticated: true,
          username: username,
          timestamp: Date.now()
        }));
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    // For compatibility with existing code
    return await login(import.meta.env.VITE_APP_USERNAME, import.meta.env.VITE_APP_PASSWORD);
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('liftlog_auth');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
    login,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Main provider wrapper
export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ConvexProvider>
  );
};
