# Production Cleanup Checklist

## Files to Clean:

### Server Controllers:
- ❌ `authController.js` - Remove: "Recovered Address", "User Created", "Generated Access Token" logs
- ❌ `preUploadFileController.js` - Remove all emoji console.logs (🔑, ✅, ❌)

### Server Routes:
- ❌ `decryptRoute.js` - Remove all emoji console.logs

### Server Models:
- ❌ `User.js` - Keep error logs but remove "Failed to decrypt/encrypt" console.errors

### Server Utils:
- ❌ `keyEncryption.js` - Remove emoji console.logs
- ❌ `keyDerivation.js` - Remove all test console.logs (keep only in test mode)
- ✅ `logger.js` - KEEP (this is professional logging)

### Server Config:
- ❌ `index.js` - Remove emoji startup logs, keep minimal production logs
- ⚠️ `serverConfig.js` - Keep error validation, remove emojis

### Test Files:
- ✅ KEEP ALL (test files need verbose output)
  - `testKeyEncryption.js`
  - `testKeyDerivation.js`
  - `test-validation.js`

## What to KEEP:
- ✅ `logger.js` structured logging (audit, security, error)
- ✅ Rate limit warnings (security monitoring)
- ✅ Critical error messages
- ✅ Database connection status

## What to REMOVE:
- ❌ All emoji logs (🔑, ✅, ❌, 🔒, etc.)
- ❌ Debug console.logs
- ❌ "Using wallet-based derivation" type messages
- ❌ Verbose startup messages
- ❌ Development-only logs

