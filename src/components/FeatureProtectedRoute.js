import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { hasFeatureAccess } from "../lib/subscriptionPermissions";
import SubscriptionRestriction from "./SubscriptionRestriction";

export default function FeatureProtectedRoute({ 
  children, 
  feature,
  fallback,
  showRestriction = true 
}) {
  const { currentUser } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function checkFeatureAccess() {
      if (!currentUser) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        console.log(`🔍 FeatureProtectedRoute: Checking access for feature "${feature}"`);
        console.log(`👤 User ID: ${currentUser.uid}`);
        console.log(`📧 User email: ${currentUser.email}`);
        console.log(`📅 Check time: ${new Date().toISOString()}`);
        
        // Obtener datos frescos directamente desde Firebase cada vez
        const { getDoctorByUserId } = await import('../lib/doctorsService');
        const freshDoctor = await getDoctorByUserId(currentUser.uid);
        
        if (freshDoctor) {
          console.log(`👨‍⚕️ Fresh doctor data obtained:`, {
            subscriptionStatus: freshDoctor.subscriptionStatus,
            subscriptionPlan: freshDoctor.subscriptionPlan,
            subscriptionExpiresAt: freshDoctor.subscriptionExpiresAt,
            subscriptionExpiresAtType: typeof freshDoctor.subscriptionExpiresAt,
            isExpired: freshDoctor.subscriptionExpiresAt 
              ? freshDoctor.subscriptionExpiresAt <= new Date()
              : 'N/A'
          });
        }
        
        const access = await hasFeatureAccess(currentUser.uid, feature);
        
        console.log(`${access ? '✅ ACCESS GRANTED' : '❌ ACCESS DENIED'} for feature "${feature}"`);
        console.log(`─────────────────────────────────────────`);
        
        if (isMounted) setHasAccess(access);
      } catch (error) {
        console.error("Error checking feature access:", error);
        if (isMounted) setHasAccess(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkFeatureAccess();
    
    return () => {
      isMounted = false;
    };
  }, [currentUser, feature]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }
    
    if (showRestriction) {
      return <SubscriptionRestriction feature={feature} />;
    }
    
    return null;
  }

  return children;
}
