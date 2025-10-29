/**
 * Logout Utility
 * Handles user logout by revoking tokens and clearing state
 */

import apiClient from './apiClient';
import logger from './logger';

/**
 * Logout user - revokes refresh token and clears cookies
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    // Call backend logout endpoint to revoke refresh token
    await apiClient.post('/logout');
    logger.debug('Logout successful');
  } catch (error) {
    logger.error('Logout error:', error);
    // Continue with local cleanup even if backend call fails
  } finally {
    // Clear local storage
    localStorage.removeItem('address');
    
    // Redirect to wallet connection page
    window.location.href = '/wallet';
  }
};

export default logout;
