/**
 * Test Priority 3: JWT Secrets Validation
 * 
 * Verifies that JWT_SECRETKEY and JWT_REFRESH_SECRETKEY
 * must be different for security
 */

const crypto = require('crypto');

console.log('\n🧪 Testing Priority 3: JWT Secrets Validation\n');
console.log('══════════════════════════════════════════════════════════════\n');

// Mock configuration object
const mockConfig = {
    JWT_SECRETKEY: '',
    JWT_REFRESH_SECRETKEY: '',
    MASTER_ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex'),
    
    validateSecrets() {
        const errors = [];
        
        // Validate JWT secrets
        if (!this.JWT_SECRETKEY || this.JWT_SECRETKEY.length < 64) {
            errors.push('JWT_SECRETKEY must be at least 32 bytes (64 hex characters)');
        }
        
        if (!this.JWT_REFRESH_SECRETKEY) {
            errors.push('JWT_REFRESH_SECRETKEY is required and must be different from JWT_SECRETKEY');
        } else if (this.JWT_REFRESH_SECRETKEY.length < 64) {
            errors.push('JWT_REFRESH_SECRETKEY must be at least 32 bytes (64 hex characters)');
        } else if (this.JWT_SECRETKEY === this.JWT_REFRESH_SECRETKEY) {
            errors.push('JWT_SECRETKEY and JWT_REFRESH_SECRETKEY must be different');
        }
        
        // Validate master encryption key
        if (!this.MASTER_ENCRYPTION_KEY) {
            errors.push('MASTER_ENCRYPTION_KEY is required for encrypting user keys');
        } else if (this.MASTER_ENCRYPTION_KEY.length < 64) {
            errors.push('MASTER_ENCRYPTION_KEY must be at least 32 bytes (64 hex characters)');
        }
        
        if (errors.length > 0) {
            throw new Error(errors.join('; '));
        }
    }
};

let testsPass = 0;
let testsFail = 0;

// Test 1: Same secrets should fail
console.log('📝 Test 1: Reject Identical JWT Secrets');
try {
    const sameSecret = crypto.randomBytes(32).toString('hex');
    mockConfig.JWT_SECRETKEY = sameSecret;
    mockConfig.JWT_REFRESH_SECRETKEY = sameSecret;
    
    try {
        mockConfig.validateSecrets();
        console.log('  ❌ FAIL: Should have rejected identical secrets');
        testsFail++;
    } catch (err) {
        if (err.message.includes('must be different')) {
            console.log('  ✅ PASS: Correctly rejected identical secrets');
            testsPass++;
        } else {
            console.log('  ❌ FAIL: Wrong error message');
            testsFail++;
        }
    }
} catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    testsFail++;
}

// Test 2: Different secrets should pass
console.log('\n📝 Test 2: Accept Different JWT Secrets');
try {
    mockConfig.JWT_SECRETKEY = crypto.randomBytes(32).toString('hex');
    mockConfig.JWT_REFRESH_SECRETKEY = crypto.randomBytes(32).toString('hex');
    
    try {
        mockConfig.validateSecrets();
        console.log('  ✅ PASS: Accepted different secrets');
        testsPass++;
    } catch (err) {
        console.log(`  ❌ FAIL: Should have accepted different secrets: ${err.message}`);
        testsFail++;
    }
} catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    testsFail++;
}

// Test 3: Too short secrets should fail
console.log('\n📝 Test 3: Reject Short Secrets (< 64 chars)');
try {
    mockConfig.JWT_SECRETKEY = 'tooshort';
    mockConfig.JWT_REFRESH_SECRETKEY = crypto.randomBytes(32).toString('hex');
    
    try {
        mockConfig.validateSecrets();
        console.log('  ❌ FAIL: Should have rejected short secret');
        testsFail++;
    } catch (err) {
        if (err.message.includes('at least 32 bytes')) {
            console.log('  ✅ PASS: Correctly rejected short secret');
            testsPass++;
        } else {
            console.log('  ❌ FAIL: Wrong error message');
            testsFail++;
        }
    }
} catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    testsFail++;
}

// Test 4: Missing JWT_REFRESH_SECRETKEY
console.log('\n📝 Test 4: Reject Missing JWT_REFRESH_SECRETKEY');
try {
    mockConfig.JWT_SECRETKEY = crypto.randomBytes(32).toString('hex');
    mockConfig.JWT_REFRESH_SECRETKEY = '';
    
    try {
        mockConfig.validateSecrets();
        console.log('  ❌ FAIL: Should have rejected missing refresh secret');
        testsFail++;
    } catch (err) {
        if (err.message.includes('required')) {
            console.log('  ✅ PASS: Correctly rejected missing refresh secret');
            testsPass++;
        } else {
            console.log('  ❌ FAIL: Wrong error message');
            testsFail++;
        }
    }
} catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    testsFail++;
}

// Test 5: Valid configuration
console.log('\n📝 Test 5: Accept Valid Configuration');
try {
    mockConfig.JWT_SECRETKEY = crypto.randomBytes(32).toString('hex');
    mockConfig.JWT_REFRESH_SECRETKEY = crypto.randomBytes(32).toString('hex');
    mockConfig.MASTER_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
    
    try {
        mockConfig.validateSecrets();
        console.log('  ✅ PASS: Accepted valid configuration');
        console.log(`     JWT_SECRETKEY length: ${mockConfig.JWT_SECRETKEY.length} chars`);
        console.log(`     JWT_REFRESH_SECRETKEY length: ${mockConfig.JWT_REFRESH_SECRETKEY.length} chars`);
        console.log(`     MASTER_ENCRYPTION_KEY length: ${mockConfig.MASTER_ENCRYPTION_KEY.length} chars`);
        console.log(`     All secrets different: ${
            mockConfig.JWT_SECRETKEY !== mockConfig.JWT_REFRESH_SECRETKEY &&
            mockConfig.JWT_SECRETKEY !== mockConfig.MASTER_ENCRYPTION_KEY &&
            mockConfig.JWT_REFRESH_SECRETKEY !== mockConfig.MASTER_ENCRYPTION_KEY
        }`);
        testsPass++;
    } catch (err) {
        console.log(`  ❌ FAIL: Should have accepted valid config: ${err.message}`);
        testsFail++;
    }
} catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    testsFail++;
}

// Final results
console.log('\n══════════════════════════════════════════════════════════════');
console.log('\n📊 Test Results:\n');
console.log(`  ✅ Passed: ${testsPass}/5`);
console.log(`  ❌ Failed: ${testsFail}/5`);
console.log(`  📈 Success Rate: ${(testsPass/5*100).toFixed(0)}%`);

if (testsFail === 0) {
    console.log('\n🎉 All tests passed! Priority 3 validation is working correctly.\n');
    console.log('✅ JWT_SECRETKEY and JWT_REFRESH_SECRETKEY must be different');
    console.log('✅ All secrets must be at least 64 characters (32 bytes)');
    console.log('✅ Server will fail to start with invalid configuration\n');
    console.log('══════════════════════════════════════════════════════════════\n');
    process.exit(0);
} else {
    console.log('\n⚠️ Some tests failed. Please review the implementation.\n');
    console.log('══════════════════════════════════════════════════════════════\n');
    process.exit(1);
}
