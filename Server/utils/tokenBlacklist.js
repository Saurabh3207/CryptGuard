/**
 * Token Blacklist for Refresh Token Revocation
 * In production, replace with Redis for multi-instance support
 */

const revokedTokens = new Set();

/**
 * Add a token to the blacklist
 * @param {string} token - The refresh token to revoke
 */
const revokeToken = (token) => {
  revokedTokens.add(token);
};

/**
 * Check if a token is revoked
 * @param {string} token - The token to check
 * @returns {boolean} - True if token is revoked
 */
const isTokenRevoked = (token) => {
  return revokedTokens.has(token);
};

/**
 * Clear expired tokens from blacklist (optional cleanup)
 * In production with Redis, use TTL instead
 */
const cleanupExpiredTokens = () => {
  // For now, keep all revoked tokens in memory
  // In production with Redis: use EXPIRE command with 7-day TTL
};

module.exports = {
  revokeToken,
  isTokenRevoked,
  cleanupExpiredTokens
};
