import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserSubscription, isSubscriptionActive } from "../lib/subscriptionsService";
import SubscriptionRestriction from "./SubscriptionRestriction";

export default function SubscriptionProtectedRoute({ 
  children, 
  feature,
  fallback,
  showRestriction = true 
}) {
  const { currentUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSubscription() {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userSubscription = await getUserSubscription(currentUser.uid);
        setSubscription(userSubscription);
      } catch (error) {
        console.error("Error checking subscription:", error);
      } finally {
        setLoading(false);
      }
    }

    checkSubscription();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasActiveSubscription = isSubscriptionActive(subscription);

  if (!hasActiveSubscription) {
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
