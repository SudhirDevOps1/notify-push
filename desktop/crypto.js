const crypto = require('crypto');

/**
 * Derives a 256-bit AES key from a passphrase using SHA-256.
 */
function deriveKey(passphrase) {
  return crypto.createHash('sha256').update(passphrase).digest();
}

/**
 * Encrypts an object into an E2EE JSON envelope using AES-256-GCM.
 * Wire format: { _e2e: 1, iv: "<base64_12_bytes>", data: "<base64_ciphertext_plus_tag>" }
 */
function encryptE2ee(payloadObj, passphrase) {
  if (!passphrase) throw new Error('Passphrase is required for E2EE');
  const key = deriveKey(passphrase);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const plaintext = typeof payloadObj === 'string' ? payloadObj : JSON.stringify(payloadObj);
  let ciphertext = cipher.update(plaintext, 'utf8');
  ciphertext = Buffer.concat([ciphertext, cipher.final()]);
  const tag = cipher.getAuthTag();

  const combinedData = Buffer.concat([ciphertext, tag]);

  return JSON.stringify({
    _e2e: 1,
    iv: iv.toString('base64'),
    data: combinedData.toString('base64')
  });
}

/**
 * Decrypts an incoming E2EE JSON envelope using AES-256-GCM.
 * Returns { title, message, tags, clickUrl } or null on authentication failure.
 */
function decryptE2ee(rawEnvelope, passphrase) {
  if (!passphrase || !rawEnvelope) return null;
  try {
    let parsed = rawEnvelope;
    if (typeof rawEnvelope === 'string') {
      const trimmed = rawEnvelope.trim();
      if (!trimmed.startsWith('{')) return null;
      parsed = JSON.parse(trimmed);
    }
    if (!parsed || parsed._e2e !== 1 || !parsed.iv || !parsed.data) return null;

    const iv = Buffer.from(parsed.iv, 'base64');
    const combinedData = Buffer.from(parsed.data, 'base64');
    if (combinedData.length < 16) return null;

    // Last 16 bytes is the GCM auth tag
    const tag = combinedData.subarray(combinedData.length - 16);
    const ciphertext = combinedData.subarray(0, combinedData.length - 16);

    const key = deriveKey(passphrase);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    if (decrypted.trim().startsWith('{')) {
      try {
        const inner = JSON.parse(decrypted.trim());
        return {
          title: inner.title || null,
          message: inner.message || decrypted,
          tags: Array.isArray(inner.tags) ? inner.tags : null,
          clickUrl: inner.click || inner.clickUrl || null
        };
      } catch (e) {}
    }
    return { title: null, message: decrypted };
  } catch (err) {
    return null;
  }
}

module.exports = {
  encryptE2ee,
  decryptE2ee,
  deriveKey
};
