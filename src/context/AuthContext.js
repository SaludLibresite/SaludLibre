import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { detectUserType } from "../lib/userTypeService";
import { useUserStore } from "../store/userStore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setUserData, clearUserData, setLoading: setUserStoreLoading } = useUserStore();

  // Sign up function
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Login function
  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // User type will be detected in the auth state change listener
    return userCredential;
  }

  // Logout function
  async function logout() {
    try {
      clearUserData(); // Clear user store data
      await signOut(auth);
    } catch (error) {
      console.error("Error during logout:", error);
      throw error;
    }
  }

  // Reset password function
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          setUserStoreLoading(true);
          // Detect user type and profile
          const { type, profile } = await detectUserType(user);
          setUserData(type, profile);
        } catch (error) {
          console.error("Error detecting user type:", error);
          // If detection fails, clear user data
          clearUserData();
        } finally {
          setUserStoreLoading(false);
        }
      } else {
        // User is logged out
        clearUserData();
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [setUserData, clearUserData, setUserStoreLoading]);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
