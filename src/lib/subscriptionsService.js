import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Colecciones
const SUBSCRIPTIONS_COLLECTION = "subscriptions";
const SUBSCRIPTION_PLANS_COLLECTION = "subscriptionPlans";
const PAYMENTS_COLLECTION = "payments";

// Servicios para Planes de Suscripción
export const createSubscriptionPlan = async (planData) => {
  try {
    const docRef = await addDoc(collection(db, SUBSCRIPTION_PLANS_COLLECTION), {
      ...planData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isActive: true,
    });
    return { id: docRef.id, ...planData };
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    throw error;
  }
};

export const getAllSubscriptionPlans = async () => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, SUBSCRIPTION_PLANS_COLLECTION), orderBy("price"))
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting subscription plans:", error);
    throw error;
  }
};

export const getActiveSubscriptionPlans = async () => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, SUBSCRIPTION_PLANS_COLLECTION),
        where("isActive", "==", true),
        orderBy("price")
      )
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting active subscription plans:", error);
    throw error;
  }
};

export const updateSubscriptionPlan = async (planId, updates) => {
  try {
    const planRef = doc(db, SUBSCRIPTION_PLANS_COLLECTION, planId);
    await updateDoc(planRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return { id: planId, ...updates };
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    throw error;
  }
};

export const deleteSubscriptionPlan = async (planId) => {
  try {
    await deleteDoc(doc(db, SUBSCRIPTION_PLANS_COLLECTION, planId));
    return true;
  } catch (error) {
    console.error("Error deleting subscription plan:", error);
    throw error;
  }
};

// Servicios para Suscripciones de Usuarios
export const createSubscription = async (subscriptionData) => {
  try {
    const docRef = await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), {
      ...subscriptionData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { id: docRef.id, ...subscriptionData };
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
};

export const getUserSubscription = async (userId) => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, SUBSCRIPTIONS_COLLECTION),
        where("userId", "==", userId),
        where("status", "in", ["active", "pending"])
      )
    );
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const subscription = querySnapshot.docs[0];
    return {
      id: subscription.id,
      ...subscription.data(),
    };
  } catch (error) {
    console.error("Error getting user subscription:", error);
    throw error;
  }
};

export const updateSubscription = async (subscriptionId, updates) => {
  try {
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    await updateDoc(subscriptionRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return { id: subscriptionId, ...updates };
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
};

export const getAllSubscriptions = async () => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, SUBSCRIPTIONS_COLLECTION), orderBy("createdAt", "desc"))
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting all subscriptions:", error);
    throw error;
  }
};

// Servicios para Pagos
export const createPayment = async (paymentData) => {
  try {
    const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), {
      ...paymentData,
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id, ...paymentData };
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};

export const updatePayment = async (paymentId, updates) => {
  try {
    const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    await updateDoc(paymentRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return { id: paymentId, ...updates };
  } catch (error) {
    console.error("Error updating payment:", error);
    throw error;
  }
};

export const getPaymentsBySubscription = async (subscriptionId) => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, PAYMENTS_COLLECTION),
        where("subscriptionId", "==", subscriptionId),
        orderBy("createdAt", "desc")
      )
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting payments by subscription:", error);
    throw error;
  }
};

// Utilidades
export const isSubscriptionActive = (subscription) => {
  if (!subscription) return false;
  
  const now = new Date();
  const expiresAt = subscription.expiresAt?.toDate?.() || new Date(subscription.expiresAt);
  
  return subscription.status === "active" && expiresAt > now;
};

export const getSubscriptionDaysRemaining = (subscription) => {
  if (!subscription || !subscription.expiresAt) return 0;
  
  const now = new Date();
  const expiresAt = subscription.expiresAt?.toDate?.() || new Date(subscription.expiresAt);
  const diffTime = expiresAt - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};
