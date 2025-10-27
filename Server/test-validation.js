// test-validation.js - Test input validation middleware
const { validators, validationSchemas } = require('./middleware/validation');

console.log('🔍 TESTING INPUT VALIDATION MIDDLEWARE\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

// Helper function to test validator
const testValidator = (name, validator, testCases) => {
  console.log(`\n✅ Testing: ${name}`);
  console.log('-'.repeat(60));
  
  testCases.forEach(({ value, shouldPass, description }) => {
    const result = validator.validate(value);
    const success = shouldPass ? !result.error : !!result.error;
    
    if (success) {
      console.log(`   ✅ PASS: ${description}`);
      console.log(`      Input: "${value}"`);
      passed++;
    } else {
      console.log(`   ❌ FAIL: ${description}`);
      console.log(`      Input: "${value}"`);
      console.log(`      Expected: ${shouldPass ? 'valid' : 'invalid'}`);
      console.log(`      Got: ${result.error ? 'invalid' : 'valid'}`);
      if (result.error) {
        console.log(`      Error: ${result.error.message}`);
      }
      failed++;
    }
  });
};

// Test Ethereum Address Validator
testValidator('Ethereum Address Validator', validators.ethereumAddress, [
  {
    value: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    shouldPass: false,
    description: 'Invalid - too short'
  },
  {
    value: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    shouldPass: true,
    description: 'Valid lowercase address'
  },
  {
    value: '0x742D35CC6634C0532925A3B844BC9E7595F0BEB1',
    shouldPass: true,
    description: 'Valid uppercase address'
  },
  {
    value: '742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    shouldPass: false,
    description: 'Invalid - missing 0x prefix'
  },
  {
    value: '0xGGGG35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    shouldPass: false,
    description: 'Invalid - contains non-hex characters'
  }
]);

// Test IPFS CID Validator
testValidator('IPFS CID Validator', validators.ipfsCID, [
  {
    value: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    shouldPass: true,
    description: 'Valid CIDv0 (Qm...)'
  },
  {
    value: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    shouldPass: true,
    description: 'Valid CIDv1 (bafy...)'
  },
  {
    value: 'QmInvalidCID123',
    shouldPass: false,
    description: 'Invalid - wrong length'
  },
  {
    value: 'InvalidCID',
    shouldPass: false,
    description: 'Invalid - wrong prefix'
  }
]);

// Test File Hash Validator
testValidator('File Hash Validator (SHA-256)', validators.fileHash, [
  {
    value: '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    shouldPass: true,
    description: 'Valid SHA-256 hash'
  },
  {
    value: '0xE3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855',
    shouldPass: true,
    description: 'Valid SHA-256 hash (uppercase)'
  },
  {
    value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    shouldPass: false,
    description: 'Invalid - missing 0x prefix'
  },
  {
    value: '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b8',
    shouldPass: false,
    description: 'Invalid - too short'
  },
  {
    value: '0xGGGGc44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    shouldPass: false,
    description: 'Invalid - non-hex characters'
  }
]);

// Test Signature Validator
testValidator('Signature Validator', validators.signature, [
  {
    value: '0x' + 'a'.repeat(130),
    shouldPass: true,
    description: 'Valid signature (130 hex chars after 0x)'
  },
  {
    value: '0x' + 'A'.repeat(130),
    shouldPass: true,
    description: 'Valid signature (uppercase)'
  },
  {
    value: '0x' + 'a'.repeat(128),
    shouldPass: false,
    description: 'Invalid - too short'
  },
  {
    value: 'a'.repeat(132),
    shouldPass: false,
    description: 'Invalid - missing 0x prefix'
  }
]);

// Test File Name Validator
testValidator('File Name Validator', validators.fileName, [
  {
    value: 'document.pdf',
    shouldPass: true,
    description: 'Valid file name'
  },
  {
    value: 'my-file_2024 (1).txt',
    shouldPass: true,
    description: 'Valid with special characters'
  },
  {
    value: '../../../etc/passwd',
    shouldPass: false,
    description: 'Invalid - path traversal attempt'
  },
  {
    value: 'file<script>.js',
    shouldPass: false,
    description: 'Invalid - XSS attempt'
  },
  {
    value: 'a'.repeat(256),
    shouldPass: false,
    description: 'Invalid - too long (> 255 chars)'
  },
  {
    value: '',
    shouldPass: false,
    description: 'Invalid - empty'
  }
]);

// Test File Size Validator
testValidator('File Size Validator', validators.fileSize, [
  {
    value: 1024,
    shouldPass: true,
    description: 'Valid - 1KB'
  },
  {
    value: 5 * 1024 * 1024,
    shouldPass: true,
    description: 'Valid - 5MB'
  },
  {
    value: 10 * 1024 * 1024,
    shouldPass: true,
    description: 'Valid - 10MB (max)'
  },
  {
    value: 11 * 1024 * 1024,
    shouldPass: false,
    description: 'Invalid - over 10MB'
  },
  {
    value: 0,
    shouldPass: false,
    description: 'Invalid - zero bytes'
  },
  {
    value: -100,
    shouldPass: false,
    description: 'Invalid - negative'
  }
]);

// Test complete validation schemas
console.log('\n\n' + '='.repeat(60));
console.log('🔍 TESTING VALIDATION SCHEMAS');
console.log('='.repeat(60));

// Test Authentication Schema
console.log('\n✅ Testing: Authentication Schema');
console.log('-'.repeat(60));

const authValid = {
  body: { signature: '0x' + 'a'.repeat(130) },
  query: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1' }
};

const authInvalid = {
  body: { signature: 'invalid' },
  query: { address: 'invalid' }
};

let result = validationSchemas.authentication.validate(authValid);
if (!result.error) {
  console.log('   ✅ PASS: Valid authentication data accepted');
  passed++;
} else {
  console.log('   ❌ FAIL: Valid data rejected');
  console.log('   Error:', result.error.message);
  failed++;
}

result = validationSchemas.authentication.validate(authInvalid);
if (result.error) {
  console.log('   ✅ PASS: Invalid authentication data rejected');
  passed++;
} else {
  console.log('   ❌ FAIL: Invalid data accepted');
  failed++;
}

// Test Confirm Upload Schema
console.log('\n✅ Testing: Confirm Upload Schema');
console.log('-'.repeat(60));

const uploadValid = {
  body: {
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    ipfsCID: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    metadataCID: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    fileHash: '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    fileName: 'test.pdf',
    fileSize: 1024,
    fileType: 'application/pdf'
  }
};

result = validationSchemas.confirmUpload.validate(uploadValid);
if (!result.error) {
  console.log('   ✅ PASS: Valid upload data accepted');
  passed++;
} else {
  console.log('   ❌ FAIL: Valid data rejected');
  console.log('   Error:', result.error.message);
  failed++;
}

// Test SQL Injection Prevention
console.log('\n\n' + '='.repeat(60));
console.log('🔍 TESTING INJECTION ATTACK PREVENTION');
console.log('='.repeat(60));

const injectionTests = [
  {
    name: 'SQL Injection',
    value: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1' OR '1'='1",
    validator: validators.ethereumAddress
  },
  {
    name: 'NoSQL Injection',
    value: { $gt: '' },
    validator: validators.ethereumAddress
  },
  {
    name: 'Path Traversal',
    value: '../../../etc/passwd',
    validator: validators.fileName
  },
  {
    name: 'XSS Attack',
    value: '<script>alert("XSS")</script>',
    validator: validators.fileName
  },
  {
    name: 'Command Injection',
    value: '`rm -rf /`',
    validator: validators.fileName
  }
];

injectionTests.forEach(({ name, value, validator }) => {
  result = validator.validate(value);
  if (result.error) {
    console.log(`   ✅ PASS: ${name} blocked`);
    console.log(`      Attempted: "${typeof value === 'object' ? JSON.stringify(value) : value}"`);
    passed++;
  } else {
    console.log(`   ❌ FAIL: ${name} NOT blocked`);
    console.log(`      Attempted: "${typeof value === 'object' ? JSON.stringify(value) : value}"`);
    failed++;
  }
});

// Summary
console.log('\n\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${passed + failed}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);

if (failed === 0) {
  console.log('\n🎉 ALL VALIDATION TESTS PASSED!');
  console.log('\n✅ Summary:');
  console.log('   • Ethereum addresses validated correctly');
  console.log('   • IPFS CIDs validated correctly');
  console.log('   • File hashes validated correctly');
  console.log('   • Signatures validated correctly');
  console.log('   • File names validated and sanitized');
  console.log('   • File sizes validated correctly');
  console.log('   • Complete schemas work as expected');
  console.log('   • Injection attacks blocked successfully');
  console.log('');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED');
  console.log('Please review the failures above.');
  process.exit(1);
}
