# CryptGuard Scripts

Utility scripts for key management and system maintenance.

---

## 📁 Available Scripts

### 1. `generateKeys.js` - Initial Key Generator

**Purpose:** Generate new cryptographically secure keys for first-time setup.

**Usage:**
```bash
node Server/scripts/generateKeys.js
```

**What it does:**
- Generates 3 new 256-bit (32-byte) keys
- Displays keys in a format ready to copy to `.env`
- Does NOT modify any files automatically
- Shows security warnings and setup instructions

**When to use:**
- First-time setup of CryptGuard
- Manual key generation
- Getting a preview of what keys look like

**Output Example:**
```bash
JWT_SECRETKEY=a5a4bedc84c6db67e248673bc600899734ac743a74f86478517e9247a9ef9b66
JWT_REFRESH_SECRETKEY=5dc126aebf13c131c7a1b291baed14fc5273e8d27465b86f18d2fb3f638ad0ad
MASTER_ENCRYPTION_KEY=548001db1402be02effd5418aaec78f03bb3652bfb185963652521580ccef620
```

---

### 2. `updateKeys.js` - Automated Key Rotator ⭐ **RECOMMENDED**

**Purpose:** Generate new keys AND automatically update your `.env` file with backup.

**Usage:**
```bash
# Run from project root (CryptGuard directory)
node Server/scripts/updateKeys.js
```

**What it does:**
1. ✅ Reads current `.env` file
2. ✅ Validates existing keys
3. ✅ Generates 3 new cryptographically secure keys
4. ✅ Creates timestamped backup of current `.env`
5. ✅ Updates `.env` file with new keys
6. ✅ Validates all changes

**When to use:**
- Regular key rotation (security best practice)
- After a security incident
- Updating from old/weak keys
- Automated deployment workflows

**Features:**
- 🔒 **Safe:** Creates backup before making changes
- 🎯 **Smart:** Only updates key values, preserves file structure
- ✅ **Validated:** Ensures all keys are 64 hex characters (256 bits)
- 📊 **Informative:** Shows before/after status

**Output:**
```
🔐 CryptGuard - Automated Key Generator & Updater

📊 Current Key Status:
  JWT_SECRETKEY: ✅ EXISTS (valid format)
  JWT_REFRESH_SECRETKEY: ✅ EXISTS (valid format)
  MASTER_ENCRYPTION_KEY: ✅ EXISTS (valid format)

🔄 Generating new cryptographically secure keys...
💾 Creating backup of current .env file...
  ✓ Backup created: .env.backup.2025-10-29T05-38-17-194Z
📝 Updating .env file with new keys...
  ✓ .env file updated successfully

✅ Key update completed successfully!
```

**Important Notes:**
- ⚠️ Old keys become invalid immediately
- 🔄 Users must re-authenticate after key rotation
- 💾 Backup file contains old keys - keep secure or delete
- 📦 If you have existing users with encrypted keys, run migration after

---

## 🔐 Key Specifications

All keys are generated using Node.js `crypto.randomBytes()`:

| Key | Purpose | Length | Format |
|-----|---------|--------|--------|
| `JWT_SECRETKEY` | Signs access tokens (15 min) | 256 bits | 64 hex chars |
| `JWT_REFRESH_SECRETKEY` | Signs refresh tokens (7 days) | 256 bits | 64 hex chars |
| `MASTER_ENCRYPTION_KEY` | Encrypts user encryption keys | 256 bits | 64 hex chars |

**Validation Rules:**
- Must be exactly 64 hexadecimal characters
- Must be different from each other
- Generated using cryptographically secure random source

---

## 🔄 Key Rotation Workflow

### For Production Systems:

1. **Schedule Regular Rotation** (every 90 days recommended)
   ```bash
   node Server/scripts/updateKeys.js
   ```

2. **Notify Users** (if changing JWT keys)
   - Users will need to re-authenticate
   - Consider gradual rollout

3. **Run Migration** (if needed)
   ```bash
   node Server/migrations/encryptExistingKeys.js
   ```

4. **Verify System**
   ```bash
   node Server/test/testKeyEncryption.js
   npm start
   ```

5. **Secure/Delete Backup**
   - Backup contains old keys
   - Either encrypt and store securely, or delete

### Emergency Key Rotation (Security Incident):

```bash
# 1. Stop the server immediately
# 2. Rotate keys
node Server/scripts/updateKeys.js

# 3. Run migration
node Server/migrations/encryptExistingKeys.js

# 4. Verify
node Server/test/testKeyEncryption.js

# 5. Restart server
npm start

# 6. Invalidate all user sessions (force re-login)
# 7. Delete old backup file
```

---

## 🧪 Testing After Key Updates

Always run these tests after updating keys:

```bash
# 1. Test encryption system
node Server/test/testKeyEncryption.js

# 2. Start server (validates keys on startup)
npm start

# 3. Test file upload (client)
# 4. Test file download (client)
```

---

## 🔒 Security Best Practices

### DO:
- ✅ Run `updateKeys.js` regularly (every 90 days)
- ✅ Keep `.env` in `.gitignore`
- ✅ Store backups in encrypted password manager
- ✅ Use different keys for dev/staging/production
- ✅ Validate keys on server startup (already implemented)
- ✅ Delete old backups after confirming new keys work

### DON'T:
- ❌ Never commit `.env` or backup files to git
- ❌ Never share keys via email/chat
- ❌ Never use the same keys across environments
- ❌ Never skip testing after key rotation
- ❌ Never lose your MASTER_ENCRYPTION_KEY (data unrecoverable)

---

## 📦 Backup Management

Backups are created in the root directory with format:
```
.env.backup.2025-10-29T05-38-17-194Z
```

**What to do with backups:**

1. **Immediately after rotation:**
   - Keep for 24-48 hours
   - Verify new keys work in production

2. **After verification:**
   - Option A: Encrypt and store in password manager
   - Option B: Delete permanently
   - Never leave unencrypted on disk

3. **Emergency recovery:**
   - If new keys fail, restore from backup
   - Fix the issue, rotate again

---

## 🆘 Troubleshooting

### Error: "Cannot find module"
**Solution:** Run from project root (CryptGuard directory)
```bash
cd D:\CryptGuard
node Server/scripts/updateKeys.js
```

### Error: ".env file not found"
**Solution:** Create `.env` from `.env.example` first
```bash
cp Server/.env.example Server/.env
```

### Error: "Invalid key generated"
**Solution:** This should never happen. If it does:
1. Check Node.js version (v14+)
2. Try again
3. Report as bug if persists

### Keys not working after update
**Solution:**
1. Check backup file exists
2. Verify `.env` was updated (open in editor)
3. Restart server completely
4. Check server logs for validation errors
5. If still broken, restore from backup

---

## 📚 Related Documentation

- **Setup Guide:** See `MASTER_KEY_SETUP_GUIDE.md`
- **Implementation Details:** See `MASTER_KEY_IMPLEMENTATION_SUMMARY.md`
- **Security Analysis:** See `ENCRYPTION_KEY_SECURITY_ANALYSIS.md`
- **Migration Script:** See `Server/migrations/README.md`

---

## 🤝 Contributing

When adding new scripts:
1. Follow the same output formatting style
2. Always create backups before modifying files
3. Validate all changes before saving
4. Provide clear next steps
5. Update this README

---

**Last Updated:** October 29, 2025
**CryptGuard Version:** 1.0.0
