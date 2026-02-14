import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Make sure this path points to your supabase.js file

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // 1. Restore session from localStorage on app load
    const restoreSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
          setUser(session.user);
          const role = session.user?.user_metadata?.role || 'citizen';
          setUserRole(role);
          // Store in localStorage for quick access
          localStorage.setItem('authSession', JSON.stringify({
            user: session.user,
            role: role,
            timestamp: Date.now()
          }));
        } else {
          // Try to restore from localStorage if session fetch failed
          const stored = localStorage.getItem('authSession');
          if (stored) {
            const { user: storedUser, role: storedRole } = JSON.parse(stored);
            setUser(storedUser);
            setUserRole(storedRole);
          }
        }
      } catch (error) {
        console.error('Session restore error:', error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    // 2. Listen for changes (login, logout, auto-refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        const role = session.user?.user_metadata?.role || 'citizen';
        setUserRole(role);
        // Update localStorage
        localStorage.setItem('authSession', JSON.stringify({
          user: session.user,
          role: role,
          timestamp: Date.now()
        }));
      } else {
        setUser(null);
        setUserRole(null);
        localStorage.removeItem('authSession');
      }
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // --- Auth Functions ---

  const signup = async (email, password, full_name, role) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name,
          role: role || 'citizen', // Default to citizen
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const login = async (data) => {
    const { data: response, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error){
      console.log(error)
      throw error;
    }
    return response;
  };

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Clear localStorage
    localStorage.removeItem('authSession');
  };

  // Get user role
  const getUserRole = () => {
    return userRole || user?.user_metadata?.role || 'citizen';
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!session;
  };

  // Expose these values to the rest of the app
  const value = {
    user,
    session,
    login,
    signup,
    logout,
    loginWithGoogle,
    loading,
    userRole,
    getUserRole,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom Hook to use the context
export const useAuth = () => {
  return useContext(AuthContext);
};