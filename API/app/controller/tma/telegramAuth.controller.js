const axios = require('axios');
const poolWrapper = require('../../config/utill/connection');

const botToken = process.env.TELEGRAM_BOT_TOKEN || '8613686625:AAFe8-04LvQumEXZ8-MBjbNSDozba3E1lCw';
const botUsername = 'aura_emenu_order_bot';

// Active auth sessions: { [token]: { token, status, user, credentials, createdAt } }
const telegramAuthSessions = new Map();

// Helper to generate secure credentials
function generateUserCredentials(baseName) {
  const cleanBase = (baseName || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10) || 'member';
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const username = `${cleanBase}_${randomSuffix}`;
  const password = `Aura#${Math.floor(1000 + Math.random() * 9000)}`;
  return { username, password };
}

// Function to send credentials directly to user's Telegram personal chat
async function sendCredentialsToUserTelegram(chatId, { username, password, name, telegramId }) {
  if (!botToken || !chatId) {
    console.log(`[Telegram Auth] Notice: No bot token or chat ID provided (${chatId})`);
    return false;
  }

  const messageText =
    `🎉 <b>Welcome to Aura Global, ${name || 'Valued Member'}!</b>\n\n` +
    `Your member account has been registered via our Telegram Bot.\n\n` +
    `🔑 <b>Your Personal Login Credentials:</b>\n` +
    `• <b>Username:</b> <code>${username}</code>\n` +
    `• <b>Password:</b> <code>${password}</code>\n` +
    `• <b>Telegram ID:</b> <code>${telegramId || chatId}</code>\n\n` +
    `✨ <b>Account Privileges:</b>\n` +
    `• 🎁 <b>150 VIP Welcome Loyalty Points</b> credited!\n` +
    `• 🧾 Digital order receipts will be sent directly to this chat.\n` +
    `• ⚡ Instant table ordering and store delivery.\n\n` +
    `<i>Keep your password safe. You can log in on the website with these credentials anytime.</i>`;

  try {
    const res = await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML'
      },
      { timeout: 8000 }
    );
    console.log(`[Telegram Auth] Credentials sent to Telegram chat ${chatId}: OK`);
    return { sent: Boolean(res.data && res.data.ok), ok: true };
  } catch (err) {
    const desc = err.response?.data?.description || err.message;
    console.log(`[Telegram Auth] Info: Telegram notification to chat ${chatId} (${desc}). Chat may not be initialized yet.`);
    return { sent: false, ok: false, reason: desc };
  }
}

// Helper to register user into user table
function insertUserIntoTable(profile) {
  const users = poolWrapper.mockStore?.users || [];
  const { username, password } = generateUserCredentials(profile.username || profile.firstName);

  const firstName = profile.firstName || profile.name?.split(' ')[0] || 'Telegram';
  const lastName = profile.lastName || profile.name?.split(' ').slice(1).join(' ') || 'Member';
  const email = profile.email || `${username}@telegram.aura`;
  const telegramId = profile.telegramId || profile.id || Date.now();

  // Check if user already exists with this telegramId
  const existingIndex = users.findIndex((u) => String(u.telegram_id) === String(telegramId));
  if (existingIndex !== -1) {
    const existing = users[existingIndex];
    return {
      user: existing,
      credentials: { username: existing.username, password: existing.password || password }
    };
  }

  const newUser = {
    id: users.length + 1,
    username: username,
    first_name: firstName,
    last_name: lastName,
    email: email,
    phone: profile.phone || '',
    password: password,
    telegram_id: telegramId,
    group_id: 2, // Customer member
    active: 1,
    role: 'customer',
    tier: 'Gold VIP Member',
    loyaltyPoints: 150,
    created_at: new Date().toISOString()
  };

  users.push(newUser);
  console.log(`[Telegram Auth] Inserted new user into user table: ID=${newUser.id}, username=${newUser.username}`);

  return {
    user: newUser,
    credentials: { username, password }
  };
}

const TelegramAuthController = {
  // 1. Initialize an auth session for bot interaction
  initSession: async (req, res) => {
    try {
      const token = `auth_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
      const session = {
        token,
        status: 'pending',
        createdAt: Date.now()
      };
      telegramAuthSessions.set(token, session);

      // Clean up old sessions (> 15 mins)
      const now = Date.now();
      for (const [k, v] of telegramAuthSessions.entries()) {
        if (now - v.createdAt > 15 * 60 * 1000) {
          telegramAuthSessions.delete(k);
        }
      }

      const botUrl = `https://t.me/${botUsername}?start=${token}`;

      res.json({
        status: true,
        token,
        botUsername,
        botUrl
      });
    } catch (err) {
      console.error('[Telegram Auth] Init error:', err);
      res.status(500).json({ status: false, error: err.message });
    }
  },

  // 2. Poll check if session completed
  checkSession: async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ status: false, error: 'Token is required' });
      }

      const session = telegramAuthSessions.get(token);
      if (!session) {
        return res.json({ status: false, completed: false, error: 'Session not found or expired' });
      }

      if (session.status === 'completed') {
        return res.json({
          status: true,
          completed: true,
          user: session.user,
          credentials: session.credentials
        });
      }

      res.json({
        status: true,
        completed: false,
        status_text: session.status
      });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  },

  // 3. Direct registration from web (catches info, inserts user into table, sends credentials to user's Telegram)
  directRegister: async (req, res) => {
    try {
      const {
        telegramUsername,
        telegramId,
        firstName,
        lastName,
        phone,
        email,
        token
      } = req.body;

      const cleanHandle = (telegramUsername || '').replace('@', '').trim() || 'member';
      const tgId = telegramId || Math.floor(10000000 + Math.random() * 90000000);

      // Insert into User table & create username/password
      const { user, credentials } = insertUserIntoTable({
        username: cleanHandle,
        firstName: firstName || cleanHandle,
        lastName: lastName || '',
        telegramId: tgId,
        phone: phone || '',
        email: email || `${cleanHandle}@telegram.aura`
      });

      // Send username & password directly to user's Telegram personal chat via bot!
      const dispatchResult = await sendCredentialsToUserTelegram(tgId, {
        username: credentials.username,
        password: credentials.password,
        name: `${user.first_name} ${user.last_name}`.trim(),
        telegramId: tgId
      });

      // Mark session completed if token provided
      if (token && telegramAuthSessions.has(token)) {
        telegramAuthSessions.set(token, {
          token,
          status: 'completed',
          user,
          credentials,
          createdAt: Date.now()
        });
      }

      res.json({
        status: true,
        message: 'User registered via Telegram Bot successfully!',
        user,
        credentials,
        sentToTelegram: Boolean(dispatchResult?.sent),
        telegramNotice: dispatchResult?.sent
          ? 'Credentials sent to your Telegram chat!'
          : 'Credentials created! Tap /start in @aura_emenu_order_bot to link your Telegram chat for real-time order updates.',
        botUsername
      });
    } catch (err) {
      console.error('[Telegram Auth] Direct register error:', err);
      res.status(500).json({ status: false, error: err.message });
    }
  },

  // Called internally when the actual Telegram bot catches /start auth_<token>
  handleBotStartAuth: async (token, ctxFrom) => {
    try {
      const tgId = ctxFrom.id;
      const cleanHandle = ctxFrom.username || ctxFrom.first_name || 'member';

      const { user, credentials } = insertUserIntoTable({
        username: cleanHandle,
        firstName: ctxFrom.first_name || cleanHandle,
        lastName: ctxFrom.last_name || '',
        telegramId: tgId
      });

      // Update in-memory session so the website polling immediately logs the user in!
      const sessionData = {
        token,
        status: 'completed',
        user,
        credentials,
        createdAt: Date.now()
      };

      telegramAuthSessions.set(token, sessionData);

      if (token.startsWith('auth_')) {
        telegramAuthSessions.set(token.replace('auth_', ''), sessionData);
      } else {
        telegramAuthSessions.set(`auth_${token}`, sessionData);
      }

      // Also update any currently pending session
      for (const [k, v] of telegramAuthSessions.entries()) {
        if (v.status === 'pending') {
          telegramAuthSessions.set(k, {
            ...v,
            status: 'completed',
            user,
            credentials
          });
        }
      }

      return { user, credentials };
    } catch (err) {
      console.error('[Telegram Auth] Bot start error:', err);
      return null;
    }
  }
};

module.exports = TelegramAuthController;
