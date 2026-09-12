import * as crypto from 'crypto';

/**
 * Derives a cryptographically secure, unpredictable topic name using HMAC-SHA256.
 * Ensures public ntfy directories cannot guess the channel name.
 */
export function deriveSecureTopic(appSecretKey: string, namespace: string): string {
  return 'vcl-' + crypto
    .createHmac('sha256', appSecretKey)
    .update(namespace)
    .digest('hex')
    .substring(0, 24);
}

/**
 * Encrypts arbitrary message content using AES-256-GCM for Zero-Knowledge E2EE.
 */
export function encryptPayload(plaintext: string, base64Key: string): { ciphertext: string; iv: string; tag: string } {
  const key = Buffer.from(base64Key, 'base64');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag().toString('base64');

  return {
    ciphertext: encrypted,
    iv: iv.toString('base64'),
    tag
  };
}
