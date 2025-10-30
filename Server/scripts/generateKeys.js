#!/usr/bin/env node

/**
 * Generate Secure Keys for CryptGuard
 * 
 * This script generates cryptographically secure keys for:
 * - JWT_SECRETKEY (access tokens)
 * - JWT_REFRESH_SECRETKEY (refresh tokens)
 * - MASTER_ENCRYPTION_KEY (encrypts user keys)
 * 
 * Usage:
 *   node Server/scripts/generateKeys.js
 * 
 * Copy the output to your .env file (NEVER commit .env to git!)
 */

const crypto = require('crypto');

console.log('\n🔐 CryptGuard - Secure Key Generator\n');
console.log('═'.repeat(70));
console.log('\n⚠️  IMPORTANT: Keep these keys secure! Never commit them to git!\n');
console.log('Copy these to your .env file:\n');
console.log('─'.repeat(70));

// Generate JWT Access Token Secret
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('\n# JWT Authentication - Access Token (15 minutes)');
console.log(`JWT_SECRETKEY=${jwtSecret}`);

// Generate JWT Refresh Token Secret
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');
console.log('\n# JWT Authentication - Refresh Token (7 days)');
console.log(`JWT_REFRESH_SECRETKEY=${jwtRefreshSecret}`);

// Generate Master Encryption Key
const masterKey = crypto.randomBytes(32).toString('hex');
console.log('\n# Master Encryption Key (encrypts all user keys)');
console.log(`MASTER_ENCRYPTION_KEY=${masterKey}`);

console.log('\n' + '─'.repeat(70));
console.log('\n✅ All keys are 256-bit (32 bytes) cryptographically secure\n');

// Show key properties
console.log('📊 Key Properties:');
console.log(`  - Length: 64 hex characters (32 bytes = 256 bits)`);
console.log(`  - Entropy: ~256 bits (cryptographically secure)`);
console.log(`  - Algorithm: crypto.randomBytes() from Node.js`);

console.log('\n💡 Next Steps:');
console.log('  1. Copy the keys above to your Server/.env file');
console.log('  2. Make sure .env is in .gitignore (should already be)');
console.log('  3. If you have existing users, run: node Server/migrations/encryptExistingKeys.js');
console.log('  4. Restart your server');
console.log('  5. Keep a secure backup of these keys (encrypted storage)\n');

console.log('⚠️  Security Warnings:');
console.log('  - Never share these keys with anyone');
console.log('  - Never commit .env to version control');
console.log('  - If keys are compromised, regenerate immediately');
console.log('  - Store backups in encrypted password manager');
console.log('  - Use different keys for dev/staging/production\n');

console.log('═'.repeat(70));
console.log('\n🔒 Keys generated successfully!\n');
