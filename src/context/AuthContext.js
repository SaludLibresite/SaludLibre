import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { detectUserType } from "../lib/userTypeService";
import { useUserStore } from "../store/userStore";
import { checkEmailExists, checkEmailExistsTraditional, createDoctorFromGoogle, getDoctorByUserId, getDoctorByEmail, updateDoctor } from "../lib/doctorsService";

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

  // Google Sign In function for LOGIN (only existing users)
  async function loginWithGoogle() {
    console.log('loginWithGoogle called - should only be for existing users');
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log('Google popup successful, user details:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });
      
      // First, try to find by userId
      let doctorProfile = await getDoctorByUserId(user.uid);
      
      console.log('Doctor profile found by userId:', doctorProfile ? 'YES' : 'NO');
      
      // If not found by userId, try by email (for migration cases)
      if (!doctorProfile) {
        console.log('Trying to find doctor by email as fallback...');
        doctorProfile = await getDoctorByEmail(user.email);
        
        if (doctorProfile) {
          console.log('Doctor found by email, updating userId...');
          // Update the doctor's userId to match current Google user
          await updateDoctor(doctorProfile.id, { 
            userId: user.uid,
            isGoogleUser: true,
            updatedAt: new Date()
          });
          // Update local object
          doctorProfile.userId = user.uid;
          doctorProfile.isGoogleUser = true;
          console.log('Doctor userId updated successfully');
        }
      }
      
      if (doctorProfile) {
        console.log('Doctor profile details:', {
          id: doctorProfile.id,
          email: doctorProfile.email,
          userId: doctorProfile.userId,
          isGoogleUser: doctorProfile.isGoogleUser
        });
      }
      
      if (!doctorProfile) {
        // No doctor profile exists - this is not a registered doctor
        console.log('No doctor profile found by userId or email, signing out user');
        await signOut(auth);
        throw new Error("ACCOUNT_NOT_FOUND");
      }
      
      if (doctorProfile && !doctorProfile.isGoogleUser) {
        // User exists but registered with email/password
        console.log('Doctor exists but is not a Google user, signing out');
        await signOut(auth);
        throw new Error("EMAIL_EXISTS_WITH_PASSWORD");
      }
      
      console.log('Login successful for existing Google user');
      return { result, doctorProfile };
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  }

  // Google Sign Up function for REGISTRATION (create new users)
  async function registerWithGoogle(referralCode = null) {
    console.log('registerWithGoogle called - creating new user account');
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log('Google registration popup successful, checking if account already exists...', user.email);
      
      // Check if this doctor already exists in our system
      const existingProfile = await getDoctorByUserId(user.uid);
      
      console.log('Existing profile found:', existingProfile ? 'YES' : 'NO');
      
      if (existingProfile) {
        // Account already exists
        console.log('Account already exists, signing out');
        await signOut(auth);
        throw new Error("ACCOUNT_ALREADY_EXISTS");
      }
      
      // Check if email exists with traditional registration
      const emailExists = await checkEmailExistsTraditional(user.email);
      console.log('Email exists with traditional registration:', emailExists ? 'YES' : 'NO');
      
      if (emailExists) {
        console.log('Email exists with password registration, signing out');
        await signOut(auth);
        throw new Error("EMAIL_EXISTS_WITH_PASSWORD");
      }
      
      // Create doctor profile for new Google user
      console.log('Creating new doctor profile for Google user...');
      const newDoctorProfile = await createDoctorFromGoogle(user, referralCode);
      
      console.log('Doctor profile created successfully:', newDoctorProfile.id);
      return { result, isNewUser: true, doctorProfile: newDoctorProfile };
    } catch (error) {
      console.error("Google registration error:", error);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('onAuthStateChanged triggered:', user ? user.email : 'null');
      setCurrentUser(user);
      
      if (user) {
        try {
          setUserStoreLoading(true);
          console.log('Detecting user type for:', user.email);
          // Detect user type and profile
          const { type, profile } = await detectUserType(user);
          console.log('User type detected:', type, profile ? 'with profile' : 'no profile');
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
        console.log('User logged out, clearing data');
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
    loginWithGoogle,
    registerWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
