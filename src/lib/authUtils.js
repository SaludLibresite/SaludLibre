/**
 * Utility functions for handling authentication timing and user experience
 */

/**
 * Wait for user type to be detected with timeout
 * @param {Function} getUserType - Function that returns the current user type
 * @param {number} maxWaitTime - Maximum time to wait in milliseconds
 * @param {number} checkInterval - How often to check in milliseconds
 * @returns {Promise<string|null>} User type or null if timeout
 */
export function waitForUserType(getUserType, maxWaitTime = 3000, checkInterval = 100) {
  return new Promise((resolve) => {
    let timeElapsed = 0;
    
    const checkUserType = () => {
      const userType = getUserType();
      
      if (userType && userType !== 'unknown') {
        resolve(userType);
        return;
      }
      
      if (timeElapsed >= maxWaitTime) {
        console.warn('Timeout waiting for user type detection');
        resolve(null);
        return;
      }
      
      timeElapsed += checkInterval;
      setTimeout(checkUserType, checkInterval);
    };
    
    checkUserType();
  });
}

/**
 * Create a smooth transition delay to prevent UI flickering
 * @param {number} minDelay - Minimum delay in milliseconds
 * @returns {Promise<void>}
 */
export function createSmoothTransition(minDelay = 300) {
  return new Promise(resolve => setTimeout(resolve, minDelay));
}

/**
 * Wait for authentication state to stabilize
 * @param {Function} getCurrentUser - Function that returns current user
 * @param {Function} getUserType - Function that returns user type
 * @param {Function} getLoadingStates - Function that returns loading states
 * @returns {Promise<Object>} Resolved auth state
 */
export async function waitForAuthStabilization(getCurrentUser, getUserType, getLoadingStates) {
  const maxWait = 5000; // 5 seconds max
  const checkInterval = 100;
  let timeElapsed = 0;
  
  return new Promise((resolve, reject) => {
    const checkState = () => {
      const { authLoading, userStoreLoading } = getLoadingStates();
      const currentUser = getCurrentUser();
      const userType = getUserType();
      
      // If still loading, continue waiting
      if (authLoading || userStoreLoading) {
        if (timeElapsed >= maxWait) {
          reject(new Error('Timeout waiting for auth stabilization'));
          return;
        }
        
        timeElapsed += checkInterval;
        setTimeout(checkState, checkInterval);
        return;
      }
      
      // Auth has stabilized
      resolve({
        currentUser,
        userType,
        isComplete: Boolean(currentUser && userType)
      });
    };
    
    checkState();
  });
}