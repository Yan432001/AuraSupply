const crypto = require('crypto');

// 32-byte secret key derived from environment or secure application fallback
const SECRET_SEED = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'aura_global_dedicated_telegram_bot_secret_2026';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(SECRET_SEED).digest();
const IV_LENGTH = 16;

/**
 * Encrypts a sensitive string (such as a Telegram Bot Token) using AES-256-CBC.
 * Returns a hex string in format: iv:encryptedData
 */
function encrypt(text) {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  // If already encrypted (format: 32 hex chars + ':' + hex chars)
  if (/^[a-f0-9]{32}:[a-f0-9]+$/i.test(trimmed)) {
    return trimmed;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(trimmed, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a ciphertext previously encrypted with encrypt().
 * If text is not encrypted, returns text as-is.
 */
function decrypt(ciphertext) {
  if (!ciphertext || typeof ciphertext !== 'string') return '';
  const trimmed = ciphertext.trim();
  if (!trimmed) return '';

  // Check if it matches iv:encrypted format
  const parts = trimmed.split(':');
  if (parts.length !== 2 || parts[0].length !== 32) {
    // Not encrypted or raw token
    return trimmed;
  }

  try {
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.warn('[Crypto] Decryption notice, returning raw token fallback:', err.message);
    return trimmed;
  }
}

/**
 * Masks a Telegram bot token so the full token is never exposed to the frontend.
 * Example: 8613686625:AAFe8-04LvQumEXZ8-MBjbNSDozba3E1lCw -> 8613686...1lCw
 */
function maskBotToken(token) {
  if (!token) return '••••••••••••';
  const clean = decrypt(token).trim();
  if (clean.length < 12) return '••••••••••••';
  const prefix = clean.substring(0, 7);
  const suffix = clean.substring(clean.length - 4);
  return `${prefix}...${suffix}`;
}

/**
 * Validates Telegram Mini App initData against store bot token using HMAC-SHA256
 * Per Telegram specifications: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
function validateTelegramInitData(initDataString, botToken) {
  if (!initDataString || !botToken) {
    return { valid: false, error: 'Missing initData or botToken' };
  }

  try {
    const params = new URLSearchParams(initDataString);
    const hash = params.get('hash');
    if (!hash) {
      return { valid: false, error: 'No hash found in initData' };
    }

    // Sort parameters alphabetically
    const dataCheckArr = [];
    for (const [key, val] of params.entries()) {
      if (key !== 'hash') {
        dataCheckArr.push(`${key}=${val}`);
      }
    }
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    // Secret key = HMAC_SHA256("WebAppData", botToken)
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    // Calculated hash = HMAC_SHA256(secretKey, dataCheckString)
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const isValid = calculatedHash === hash;
    let user = null;
    const userParam = params.get('user');
    if (userParam) {
      try {
        user = JSON.parse(userParam);
      } catch (_) {}
    }

    return {
      valid: isValid,
      user,
      authDate: params.get('auth_date'),
      queryId: params.get('query_id')
    };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

module.exports = {
  encrypt,
  decrypt,
  maskBotToken,
  validateTelegramInitData
};
