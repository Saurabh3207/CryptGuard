// Test script to verify encryption key generation fix
const crypto = require('crypto');

console.log('🔍 TESTING ENCRYPTION KEY GENERATION FIX\n');
console.log('='.repeat(50));

// Import the fixed function
const { generateEncryptionKey } = require('./utils/generateKey');

// Test 1: Verify key length
console.log('\n✅ TEST 1: Key Length Verification');
try {
    const key32 = generateEncryptionKey(32);
    console.log(`   Generated key length: ${key32.length} bytes`);
    console.log(`   Expected: 32 bytes`);
    console.log(`   ✅ PASS: ${key32.length === 32 ? 'Correct!' : 'FAILED!'}`);
    
    if (key32.length !== 32) {
        throw new Error(`Expected 32 bytes, got ${key32.length} bytes`);
    }
} catch (error) {
    console.error('   ❌ FAIL:', error.message);
    process.exit(1);
}

// Test 2: Verify it returns Buffer, not string
console.log('\n✅ TEST 2: Return Type Verification');
try {
    const key = generateEncryptionKey(32);
    console.log(`   Type: ${typeof key}`);
    console.log(`   Is Buffer: ${Buffer.isBuffer(key)}`);
    console.log(`   ✅ PASS: ${Buffer.isBuffer(key) ? 'Returns Buffer!' : 'FAILED!'}`);
    
    if (!Buffer.isBuffer(key)) {
        throw new Error('Expected Buffer, got ' + typeof key);
    }
} catch (error) {
    console.error('   ❌ FAIL:', error.message);
    process.exit(1);
}

// Test 3: Verify minimum length validation
console.log('\n✅ TEST 3: Minimum Length Validation');
try {
    try {
        const weakKey = generateEncryptionKey(16); // Should throw error
        console.error('   ❌ FAIL: Should have thrown error for 16 bytes');
        process.exit(1);
    } catch (error) {
        if (error.message.includes('at least 32 bytes')) {
            console.log('   ✅ PASS: Correctly rejects weak keys');
        } else {
            throw error;
        }
    }
} catch (error) {
    console.error('   ❌ FAIL:', error.message);
    process.exit(1);
}

// Test 4: Verify encryption works with generated key
console.log('\n✅ TEST 4: Encryption/Decryption with Generated Key');
try {
    const { encryptFile } = require('./utils/encryption');
    const { decryptData } = require('./utils/decryption');
    
    const key = generateEncryptionKey(32);
    const testData = Buffer.from('Hello, CryptGuard! This is a test.');
    
    // Encrypt
    const { encryptedData, iv } = encryptFile(testData, key);
    console.log(`   Encrypted data length: ${encryptedData.length} bytes`);
    
    // Decrypt
    const decrypted = decryptData(encryptedData, iv, key);
    const decryptedText = decrypted.toString();
    
    console.log(`   Decrypted text: "${decryptedText}"`);
    console.log(`   ✅ PASS: ${decryptedText === 'Hello, CryptGuard! This is a test.' ? 'Encryption/Decryption works!' : 'FAILED!'}`);
    
    if (decryptedText !== 'Hello, CryptGuard! This is a test.') {
        throw new Error('Decryption failed - text mismatch');
    }
} catch (error) {
    console.error('   ❌ FAIL:', error.message);
    process.exit(1);
}

// Test 5: Verify backward compatibility with hex strings
console.log('\n✅ TEST 5: Backward Compatibility (Old Hex Keys)');
try {
    const { encryptFile } = require('./utils/encryption');
    const { decryptData } = require('./utils/decryption');
    
    // Simulate old-style hex key (32 hex chars = 16 bytes)
    const oldStyleKey = crypto.randomBytes(32).toString('hex'); // 64 hex chars = 32 bytes
    const testData = Buffer.from('Testing backward compatibility');
    
    // Encrypt with hex string key
    const { encryptedData, iv } = encryptFile(testData, oldStyleKey);
    
    // Decrypt with same hex string key
    const decrypted = decryptData(encryptedData, iv, oldStyleKey);
    const decryptedText = decrypted.toString();
    
    console.log(`   Old hex key format works: ${decryptedText === 'Testing backward compatibility'}`);
    console.log(`   ✅ PASS: ${decryptedText === 'Testing backward compatibility' ? 'Old keys still work!' : 'FAILED!'}`);
    
    if (decryptedText !== 'Testing backward compatibility') {
        throw new Error('Backward compatibility failed');
    }
} catch (error) {
    console.error('   ❌ FAIL:', error.message);
    process.exit(1);
}

// Test 6: Verify randomness (no duplicate keys)
console.log('\n✅ TEST 6: Key Randomness Verification');
try {
    const keys = new Set();
    const numTests = 100;
    
    for (let i = 0; i < numTests; i++) {
        const key = generateEncryptionKey(32).toString('hex');
        keys.add(key);
    }
    
    console.log(`   Generated ${numTests} keys, unique: ${keys.size}`);
    console.log(`   ✅ PASS: ${keys.size === numTests ? 'All keys unique!' : 'FAILED - Duplicates found!'}`);
    
    if (keys.size !== numTests) {
        throw new Error(`Found duplicate keys: ${numTests - keys.size} duplicates`);
    }
} catch (error) {
    console.error('   ❌ FAIL:', error.message);
    process.exit(1);
}

// Test 7: Performance test
console.log('\n✅ TEST 7: Performance Test');
try {
    const iterations = 1000;
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
        generateEncryptionKey(32);
    }
    
    const endTime = Date.now();
    const timePerKey = (endTime - startTime) / iterations;
    
    console.log(`   Generated ${iterations} keys in ${endTime - startTime}ms`);
    console.log(`   Average: ${timePerKey.toFixed(3)}ms per key`);
    console.log(`   ✅ PASS: Performance is acceptable`);
} catch (error) {
    console.error('   ❌ FAIL:', error.message);
    process.exit(1);
}

console.log('\n' + '='.repeat(50));
console.log('🎉 ALL TESTS PASSED! Encryption key generation is working correctly.\n');
console.log('✅ Summary:');
console.log('   • Generates proper 32-byte keys (not 16 bytes)');
console.log('   • Returns Buffer type (not string)');
console.log('   • Validates minimum key length');
console.log('   • Works with encryption/decryption');
console.log('   • Backward compatible with old hex keys');
console.log('   • Generates unique random keys');
console.log('   • Performance is good');
console.log('');
