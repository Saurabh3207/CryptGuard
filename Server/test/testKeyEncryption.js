/**
 * Test Script: Verify Master Key Encryption Implementation
 * 
 * This script tests that key encryption/decryption works correctly
 * WITHOUT connecting to the database.
 * 
 * Usage:
 *   node Server/test/testKeyEncryption.js
 */

const crypto = require('crypto');

// Mock config for testing (we'll set a test key)
process.env.MASTER_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');

const { encryptKey, decryptKey, verifyKeyEncryption } = require('../utils/keyEncryption');

console.log('\n🧪 Testing Master Key Encryption System\n');
console.log('═'.repeat(60));

let passedTests = 0;
let failedTests = 0;

// Test 1: Encrypt and decrypt a key
console.log('\n📝 Test 1: Basic Encryption/Decryption');
try {
  const originalKey = crypto.randomBytes(32);
  console.log(`  Original key: ${originalKey.toString('hex').substring(0, 16)}...`);
  
  const encrypted = encryptKey(originalKey);
  console.log(`  Encrypted length: ${encrypted.length} bytes (IV + authTag + encrypted)`);
  console.log(`  Expected length: ${12 + 16 + 32} bytes`);
  
  const decrypted = decryptKey(encrypted);
  console.log(`  Decrypted key: ${decrypted.toString('hex').substring(0, 16)}...`);
  
  if (originalKey.equals(decrypted)) {
    console.log('  ✅ PASS: Keys match!');
    passedTests++;
  } else {
    console.log('  ❌ FAIL: Keys do not match');
    failedTests++;
  }
} catch (error) {
  console.log('  ❌ FAIL:', error.message);
  failedTests++;
}

// Test 2: Verify encrypted key is different each time (due to random IV)
console.log('\n📝 Test 2: Random IV (Different Ciphertexts)');
try {
  const key = crypto.randomBytes(32);
  const encrypted1 = encryptKey(key);
  const encrypted2 = encryptKey(key);
  
  if (!encrypted1.equals(encrypted2)) {
    console.log('  ✅ PASS: Encrypted keys are different (random IV working)');
    passedTests++;
  } else {
    console.log('  ❌ FAIL: Encrypted keys are identical (IV not random?)');
    failedTests++;
  }
} catch (error) {
  console.log('  ❌ FAIL:', error.message);
  failedTests++;
}

// Test 3: Tampering detection
console.log('\n📝 Test 3: Tampering Detection (Auth Tag)');
try {
  const key = crypto.randomBytes(32);
  const encrypted = encryptKey(key);
  
  // Tamper with the encrypted data
  const tampered = Buffer.from(encrypted);
  tampered[40] ^= 0xFF;  // Flip bits in encrypted data
  
  try {
    decryptKey(tampered);
    console.log('  ❌ FAIL: Tampered data was accepted (auth tag not working)');
    failedTests++;
  } catch (error) {
    if (error.message.includes('decrypt')) {
      console.log('  ✅ PASS: Tampering detected and rejected');
      passedTests++;
    } else {
      console.log('  ❌ FAIL: Wrong error type:', error.message);
      failedTests++;
    }
  }
} catch (error) {
  console.log('  ❌ FAIL:', error.message);
  failedTests++;
}

// Test 4: Wrong master key detection
console.log('\n📝 Test 4: Wrong Master Key Detection');
try {
  const key = crypto.randomBytes(32);
  const encrypted = encryptKey(key);
  
  // Change master key
  const originalMasterKey = process.env.MASTER_ENCRYPTION_KEY;
  process.env.MASTER_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  
  // Delete require cache to reload module with new master key
  delete require.cache[require.resolve('../config/serverConfig')];
  delete require.cache[require.resolve('../utils/keyEncryption')];
  const { decryptKey: decryptKeyNew } = require('../utils/keyEncryption');
  
  try {
    decryptKeyNew(encrypted);
    console.log('  ❌ FAIL: Wrong master key was accepted');
    failedTests++;
  } catch (error) {
    console.log('  ✅ PASS: Wrong master key rejected');
    passedTests++;
  }
  
  // Restore master key
  process.env.MASTER_ENCRYPTION_KEY = originalMasterKey;
} catch (error) {
  console.log('  ❌ FAIL:', error.message);
  failedTests++;
}

// Test 5: System verification function
console.log('\n📝 Test 5: System Verification Function');
try {
  // Reload modules with correct master key
  delete require.cache[require.resolve('../config/serverConfig')];
  delete require.cache[require.resolve('../utils/keyEncryption')];
  const { verifyKeyEncryption: verify } = require('../utils/keyEncryption');
  
  verify();  // Should not throw
  console.log('  ✅ PASS: System verification successful');
  passedTests++;
} catch (error) {
  console.log('  ❌ FAIL:', error.message);
  failedTests++;
}

// Test 6: Multiple encryptions/decryptions (stress test)
console.log('\n📝 Test 6: Stress Test (100 cycles)');
try {
  let allPassed = true;
  for (let i = 0; i < 100; i++) {
    const key = crypto.randomBytes(32);
    const encrypted = encryptKey(key);
    const decrypted = decryptKey(encrypted);
    
    if (!key.equals(decrypted)) {
      allPassed = false;
      break;
    }
  }
  
  if (allPassed) {
    console.log('  ✅ PASS: All 100 cycles successful');
    passedTests++;
  } else {
    console.log('  ❌ FAIL: Some cycles failed');
    failedTests++;
  }
} catch (error) {
  console.log('  ❌ FAIL:', error.message);
  failedTests++;
}

// Summary
console.log('\n' + '═'.repeat(60));
console.log('\n📊 Test Results:');
console.log(`  ✅ Passed: ${passedTests}/6`);
console.log(`  ❌ Failed: ${failedTests}/6`);

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! Master key encryption is working correctly.\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.\n');
  process.exit(1);
}
