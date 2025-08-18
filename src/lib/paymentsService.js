import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where,
  doc,
  getDoc
} from "firebase/firestore";
import { db } from "./firebase";

// Obtener todos los pagos
export const getAllPayments = async (limitCount = 100) => {
  try {
    const paymentsRef = collection(db, 'payments');
    const paymentsQuery = query(
      paymentsRef, 
      orderBy('createdAt', 'desc'), 
      limit(limitCount)
    );
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    return paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting payments:", error);
    throw error;
  }
};

// Obtener pagos por usuario
export const getPaymentsByUserId = async (userId) => {
  try {
    const paymentsRef = collection(db, 'payments');
    const paymentsQuery = query(
      paymentsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    return paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting payments by user:", error);
    throw error;
  }
};

// Obtener pagos por estado
export const getPaymentsByStatus = async (status) => {
  try {
    const paymentsRef = collection(db, 'payments');
    const paymentsQuery = query(
      paymentsRef, 
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    return paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting payments by status:", error);
    throw error;
  }
};

// Obtener un pago específico
export const getPaymentById = async (paymentId) => {
  try {
    const paymentDoc = doc(db, 'payments', paymentId);
    const paymentSnapshot = await getDoc(paymentDoc);
    
    if (paymentSnapshot.exists()) {
      return {
        id: paymentSnapshot.id,
        ...paymentSnapshot.data()
      };
    } else {
      throw new Error('Payment not found');
    }
  } catch (error) {
    console.error("Error getting payment:", error);
    throw error;
  }
};

// Estadísticas de pagos
export const getPaymentStats = async () => {
  try {
    const paymentsRef = collection(db, 'payments');
    const paymentsSnapshot = await getDocs(paymentsRef);
    
    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const stats = {
      total: payments.length,
      approved: payments.filter(p => p.status === 'approved').length,
      pending: payments.filter(p => p.status === 'pending').length,
      rejected: payments.filter(p => p.status === 'rejected').length,
      totalAmount: payments
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      avgAmount: 0
    };

    if (stats.approved > 0) {
      stats.avgAmount = stats.totalAmount / stats.approved;
    }

    return stats;
  } catch (error) {
    console.error("Error getting payment stats:", error);
    throw error;
  }
};
