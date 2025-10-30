const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * CryptGuard - Automated Key Generator & Updater
 * 
 * This script:
 * 1. Generates new cryptographically secure keys
 * 2. Updates the .env file automatically
 * 3. Creates a backup of the old .env file
 * 4. Validates the updated configuration
 */

// Generate a 256-bit (32-byte) cryptographically secure key
function generateKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Read .env file
function readEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    throw new Error(`.env file not found at: ${envPath}`);
  }
  return fs.readFileSync(envPath, 'utf8');
}

// Parse .env content into key-value object
function parseEnv(content) {
  const env = {};
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        env[key] = { value, lineIndex: index };
      }
    }
  });
  
  return env;
}

// Update specific keys in .env content
function updateEnvKeys(content, updates) {
  const lines = content.split('\n');
  const env = parseEnv(content);
  
  Object.keys(updates).forEach(key => {
    if (env[key]) {
      // Update existing key
      const lineIndex = env[key].lineIndex;
      lines[lineIndex] = `${key} = ${updates[key]}`;
    } else {
      // Add new key at the end
      lines.push(`${key} = ${updates[key]}`);
    }
  });
  
  return lines.join('\n');
}

// Create backup of .env file
function createBackup(envPath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(
    path.dirname(envPath),
    `../.env.backup.${timestamp}`
  );
  
  fs.copyFileSync(envPath, backupPath);
  return backupPath;
}

// Validate key format (64 hex characters)
function validateKey(key) {
  return /^[a-f0-9]{64}$/i.test(key);
}

// Main execution
async function main() {
  try {
    console.log('\n🔐 CryptGuard - Automated Key Generator & Updater\n');
    console.log('══════════════════════════════════════════════════════════════════════\n');
    
    // Path to .env file
    const envPath = path.join(__dirname, '../.env');
    
    // Read current .env
    console.log('📖 Reading current .env file...');
    const currentEnv = readEnvFile(envPath);
    const parsedEnv = parseEnv(currentEnv);
    
    // Check which keys exist
    const existingKeys = {
      JWT_SECRETKEY: parsedEnv.JWT_SECRETKEY?.value,
      JWT_REFRESH_SECRETKEY: parsedEnv.JWT_REFRESH_SECRETKEY?.value,
      MASTER_ENCRYPTION_KEY: parsedEnv.MASTER_ENCRYPTION_KEY?.value
    };
    
    console.log('\n📊 Current Key Status:');
    Object.keys(existingKeys).forEach(key => {
      const exists = existingKeys[key] ? '✅ EXISTS' : '❌ MISSING';
      const valid = existingKeys[key] && validateKey(existingKeys[key]) ? '(valid format)' : '';
      console.log(`  ${key}: ${exists} ${valid}`);
    });
    
    // Generate new keys
    console.log('\n🔄 Generating new cryptographically secure keys...');
    const newKeys = {
      JWT_SECRETKEY: generateKey(),
      JWT_REFRESH_SECRETKEY: generateKey(),
      MASTER_ENCRYPTION_KEY: generateKey()
    };
    
    // Validate generated keys
    console.log('\n✅ Validating generated keys...');
    Object.keys(newKeys).forEach(key => {
      if (!validateKey(newKeys[key])) {
        throw new Error(`Invalid key generated for ${key}`);
      }
      console.log(`  ✓ ${key}: 64 hex chars (256 bits)`);
    });
    
    // Create backup
    console.log('\n💾 Creating backup of current .env file...');
    const backupPath = createBackup(envPath);
    console.log(`  ✓ Backup created: ${path.basename(backupPath)}`);
    
    // Update .env file
    console.log('\n📝 Updating .env file with new keys...');
    const updatedContent = updateEnvKeys(currentEnv, newKeys);
    fs.writeFileSync(envPath, updatedContent, 'utf8');
    console.log('  ✓ .env file updated successfully');
    
    // Display new keys
    console.log('\n══════════════════════════════════════════════════════════════════════');
    console.log('\n🔑 NEW KEYS GENERATED AND SAVED:\n');
    console.log('──────────────────────────────────────────────────────────────────────\n');
    
    Object.keys(newKeys).forEach(key => {
      console.log(`${key}=${newKeys[key]}`);
    });
    
    console.log('\n──────────────────────────────────────────────────────────────────────');
    
    // Security warnings
    console.log('\n⚠️  IMPORTANT SECURITY NOTES:\n');
    console.log('  1. Old keys are no longer valid - users will need to re-authenticate');
    console.log('  2. If you have existing users, you MUST run migration:');
    console.log('     node Server/migrations/encryptExistingKeys.js');
    console.log('  3. Backup file contains old keys - keep it secure or delete it');
    console.log(`  4. Backup location: ${backupPath}`);
    console.log('  5. Restart your server to apply changes');
    
    // Next steps
    console.log('\n💡 NEXT STEPS:\n');
    console.log('  1. ✅ Keys generated and saved to .env');
    console.log('  2. 🔄 Restart your server: npm start');
    console.log('  3. 🧪 Test the encryption system: node test/testKeyEncryption.js');
    console.log('  4. 📦 If existing users: node migrations/encryptExistingKeys.js');
    console.log('  5. 🔒 Securely store backup or delete it');
    
    console.log('\n══════════════════════════════════════════════════════════════════════');
    console.log('\n✅ Key update completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateKey, updateEnvKeys, validateKey };
