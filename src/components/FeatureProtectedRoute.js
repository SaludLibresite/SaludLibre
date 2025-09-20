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
    async function checkFeatureAccess() {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        console.log(`🔍 Checking feature access for feature: ${feature}, user: ${currentUser.uid}`);
        const access = await hasFeatureAccess(currentUser.uid, feature);
        console.log(`✅ Feature access result for ${feature}:`, access);
        setHasAccess(access);
      } catch (error) {
        console.error("Error checking feature access:", error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }

    checkFeatureAccess();
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
