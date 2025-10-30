/**
 * CryptGuard - Wallet-Based Key Derivation Test Suite
 * 
 * Tests the key derivation system that eliminates database key storage
 */

const { deriveKeyFromSignature, deriveKeyHex, verifyKeyDerivation, getKeyDerivationMessage } = require('../utils/keyDerivation');
const crypto = require('crypto');

console.log('\n🧪 CryptGuard - Wallet-Based Key Derivation Test Suite\n');
console.log('══════════════════════════════════════════════════════════════════════\n');

let testsPass = 0;
let testsFail = 0;

// Test 1: Basic key derivation
console.log('📝 Test 1: Basic Key Derivation');
try {
  const mockSig = '0x' + crypto.randomBytes(65).toString('hex');
  const mockAddr = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  
  const key = deriveKeyFromSignature(mockSig, mockAddr);
  
  if (key.length === 32) {
    console.log('  ✅ PASS: Key is 32 bytes');
    console.log(`     Key (first 16 bytes): ${key.slice(0, 16).toString('hex')}...`);
    testsPass++;
  } else {
    console.log(`  ❌ FAIL: Expected 32 bytes, got ${key.length}`);
    testsFail++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}`);
  testsFail++;
}

// Test 2: Deterministic output
console.log('\n📝 Test 2: Deterministic (Same input = Same output)');
try {
  const sig = '0x' + crypto.randomBytes(65).toString('hex');
  const addr = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  
  const key1 = deriveKeyFromSignature(sig, addr);
  const key2 = deriveKeyFromSignature(sig, addr);
  
  if (key1.equals(key2)) {
    console.log('  ✅ PASS: Keys are identical (deterministic)');
    testsPass++;
  } else {
    console.log('  ❌ FAIL: Keys should be identical but differ');
    testsFail++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}`);
  testsFail++;
}

// Test 3: Different signatures produce different keys
console.log('\n📝 Test 3: Different Signatures = Different Keys');
try {
  const sig1 = '0x' + crypto.randomBytes(65).toString('hex');
  const sig2 = '0x' + crypto.randomBytes(65).toString('hex');
  const addr = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  
  const key1 = deriveKeyFromSignature(sig1, addr);
  const key2 = deriveKeyFromSignature(sig2, addr);
  
  if (!key1.equals(key2)) {
    console.log('  ✅ PASS: Different signatures produce different keys');
    testsPass++;
  } else {
    console.log('  ❌ FAIL: Keys should differ but are identical');
    testsFail++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}`);
  testsFail++;
}

// Test 4: Different addresses produce different keys
console.log('\n📝 Test 4: Different Addresses = Different Keys');
try {
  const sig = '0x' + crypto.randomBytes(65).toString('hex');
  const addr1 = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const addr2 = '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199';
  
  const key1 = deriveKeyFromSignature(sig, addr1);
  const key2 = deriveKeyFromSignature(sig, addr2);
  
  if (!key1.equals(key2)) {
    console.log('  ✅ PASS: Different addresses produce different keys');
    testsPass++;
  } else {
    console.log('  ❌ FAIL: Keys should differ but are identical');
    testsFail++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}`);
  testsFail++;
}

// Test 5: Hex output format
console.log('\n📝 Test 5: Hex Format Output');
try {
  const sig = '0x' + crypto.randomBytes(65).toString('hex');
  const addr = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  
  const hexKey = deriveKeyHex(sig, addr);
  
  if (hexKey.length === 64 && /^[a-f0-9]{64}$/i.test(hexKey)) {
    console.log('  ✅ PASS: Hex key is 64 characters');
    console.log(`     Hex key: ${hexKey.substring(0, 32)}...`);
    testsPass++;
  } else {
    console.log(`  ❌ FAIL: Expected 64 hex chars, got ${hexKey.length}`);
    testsFail++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}`);
  testsFail++;
}

// Test 6: Key verification function
console.log('\n📝 Test 6: Verification Function');
try {
  const sig = '0x' + crypto.randomBytes(65).toString('hex');
  const addr = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  
  const isValid = verifyKeyDerivation(sig, addr);
  
  if (isValid === true) {
    console.log('  ✅ PASS: Verification returns true for valid inputs');
    testsPass++;
  } else {
    console.log('  ❌ FAIL: Verification should return true');
    testsFail++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}`);
  testsFail++;
}

// Test 7: Handle invalid inputs
console.log('\n📝 Test 7: Error Handling (Invalid Inputs)');
try {
  let errorCaught = false;
  try {
    deriveKeyFromSignature(null, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
  } catch (err) {
    errorCaught = true;
  }
  
  if (errorCaught) {
    console.log('  ✅ PASS: Properly rejects invalid signature');
    testsPass++;
  } else {
    console.log('  ❌ FAIL: Should reject invalid signature');
    testsFail++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}`);
  testsFail++;
}

// Test 8: Standard message retrieval
console.log('\n📝 Test 8: Standard Message');
try {
  const message = getKeyDerivationMessage();
  
  if (message && message.includes('CryptGuard')) {
    console.log('  ✅ PASS: Standard message retrieved');
    console.log(`     Message: "${message}"`);
    testsPass++;
  } else {
    console.log('  ❌ FAIL: Invalid message');
    testsFail++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}`);
  testsFail++;
}

// Test 9: Consistency across multiple derivations
console.log('\n📝 Test 9: Stress Test (100 derivations)');
try {
  const sig = '0x' + crypto.randomBytes(65).toString('hex');
  const addr = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  
  const firstKey = deriveKeyFromSignature(sig, addr);
  let allMatch = true;
  
  for (let i = 0; i < 99; i++) {
    const key = deriveKeyFromSignature(sig, addr);
    if (!key.equals(firstKey)) {
      allMatch = false;
      break;
    }
  }
  
  if (allMatch) {
    console.log('  ✅ PASS: All 100 derivations produced identical keys');
    testsPass++;
  } else {
    console.log('  ❌ FAIL: Derivations produced different keys');
    testsFail++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}`);
  testsFail++;
}

// Test 10: Signature with and without 0x prefix
console.log('\n📝 Test 10: Signature Normalization (0x prefix)');
try {
  const sigWithout0x = crypto.randomBytes(65).toString('hex');
  const sigWith0x = '0x' + sigWithout0x;
  const addr = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  
  const key1 = deriveKeyFromSignature(sigWithout0x, addr);
  const key2 = deriveKeyFromSignature(sigWith0x, addr);
  
  if (key1.equals(key2)) {
    console.log('  ✅ PASS: 0x prefix is properly normalized');
    testsPass++;
  } else {
    console.log('  ❌ FAIL: Keys should be identical regardless of 0x prefix');
    testsFail++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}`);
  testsFail++;
}

// Final results
console.log('\n══════════════════════════════════════════════════════════════════════');
console.log('\n📊 Test Results:\n');
console.log(`  ✅ Passed: ${testsPass}/10`);
console.log(`  ❌ Failed: ${testsFail}/10`);
console.log(`  📈 Success Rate: ${(testsPass/10*100).toFixed(0)}%`);

if (testsFail === 0) {
  console.log('\n🎉 All tests passed! Wallet-based key derivation is working perfectly.\n');
  console.log('══════════════════════════════════════════════════════════════════════\n');
  process.exit(0);
} else {
  console.log('\n⚠️ Some tests failed. Please review the implementation.\n');
  console.log('══════════════════════════════════════════════════════════════════════\n');
  process.exit(1);
}
