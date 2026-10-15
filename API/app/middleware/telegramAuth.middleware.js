const crypto = require('crypto');

function verifyTelegramWebAppData(req, res, next) {
  const initData = req.headers['x-telegram-init-data'];
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '8613686625:AAFe8-04LvQumEXZ8-MBjbNSDozba3E1lCw';

  if (!initData) {
    return res.status(401).json({ status: false, message: 'Missing Telegram initData credentials' });
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    // Lexicographically sort parameters
    const params = Array.from(urlParams.entries())
      .map(([key, val]) => `${key}=${val}`)
      .sort()
      .join('\n');

    // HMAC-SHA-256 derivation
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(params).digest('hex');

    if (calculatedHash !== hash) {
      return res.status(403).json({ status: false, message: 'Invalid or forged Telegram initData' });
    }

    const userRaw = urlParams.get('user');
    if (userRaw) {
      req.telegramUser = JSON.parse(userRaw);
    }
    next();
  } catch (err) {
    return res.status(403).json({ status: false, message: 'Failed to authenticate Telegram data', error: err.message });
  }
}

module.exports = { verifyTelegramWebAppData };