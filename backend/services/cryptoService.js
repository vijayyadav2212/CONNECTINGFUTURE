const crypto = require('crypto');

function getEncryptionKey() {
  const secret = process.env.ENCRYPTION_KEY || 'dev-secret-change-me';
  return crypto.createHash('sha256').update(secret).digest();
}

function buildThreadKey(a, b) {
  const [x, y] = [String(a).toLowerCase().trim(), String(b).toLowerCase().trim()].sort();
  return `${x}|${y}`;
}

function encryptText(plainText) {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, tag, encrypted };
}

function decryptText(iv, tag, encryptedBuffer) {
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  return decrypted.toString('utf8');
}

function toBuffer(val) {
  if (Buffer.isBuffer(val)) return val;
  if (typeof val === 'string') {
    if (val.startsWith('\\x')) {
      try {
        return Buffer.from(val.slice(2), 'hex');
      } catch {
        return Buffer.from(val);
      }
    }
    return Buffer.from(val);
  }
  return Buffer.from([]);
}

module.exports = {
  buildThreadKey,
  encryptText,
  decryptText,
  toBuffer
};
