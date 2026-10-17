const { db } = require('../../config/utill/helper');
const { sendSuccess, sendError, sendPaginated } = require('../../config/utill/response');

const SUPPORTED_LANGUAGES = [
  {
    code: 'english',
    iso: 'en',
    name: 'English',
    native: 'English',
    flag: '🇺🇸',
    direction: 'ltr',
    is_default: true
  },
  {
    code: 'khmer',
    iso: 'kh',
    name: 'Khmer',
    native: 'ភាសាខ្មែរ',
    flag: '🇰🇭',
    direction: 'ltr',
    is_default: false
  },
  {
    code: 'chinese',
    iso: 'zh',
    name: 'Simplified Chinese',
    native: '简体中文',
    flag: '🇨🇳',
    direction: 'ltr',
    is_default: false
  },
  {
    code: 'thai',
    iso: 'th',
    name: 'Thai',
    native: 'ภาษาไทย',
    flag: '🇹🇭',
    direction: 'ltr',
    is_default: false
  },
  {
    code: 'vietnamese',
    iso: 'vi',
    name: 'Vietnamese',
    native: 'Tiếng Việt',
    flag: '🇻🇳',
    direction: 'ltr',
    is_default: false
  }
];

// In-memory translation dictionary cache
const translationCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function normalizeLangCode(lang) {
  if (!lang) return 'english';
  const l = String(lang).toLowerCase().trim();
  if (l === 'en' || l === 'english' || l === 'us') return 'english';
  if (l === 'kh' || l === 'km' || l === 'khmer') return 'khmer';
  if (l === 'zh' || l === 'cn' || l === 'chinese' || l === 'simplified-chinese') return 'chinese';
  if (l === 'th' || l === 'thai') return 'thai';
  if (l === 'vi' || l === 'vn' || l === 'vietnamese') return 'vietnamese';
  return 'english';
}

/**
 * GET /api/languages
 * Returns metadata of all supported languages
 */
exports.getSupportedLanguages = async (req, res) => {
  return sendSuccess(res, SUPPORTED_LANGUAGES, 'Supported languages list');
};

/**
 * GET /api/languages/translations/:lang or /api/language/:lang
 * Returns dictionary of all key-value translations for requested language
 */
exports.getTranslations = async (req, res) => {
  try {
    const rawLang = req.params.lang || req.query.lang || 'english';
    const lang = normalizeLangCode(rawLang);

    // Check memory cache
    const cacheKey = `dict_${lang}`;
    const cached = translationCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return res.json({
        success: true,
        language: lang,
        count: Object.keys(cached.data).length,
        data: cached.data
      });
    }

    // Query aura_language from MySQL
    const [rows] = await db.query('SELECT code, english, khmer, chinese, thai, vietnamese FROM aura_language');

    const dict = {};
    for (const r of rows) {
      if (!r.code) continue;
      // Get value in target language, fallback to english, fallback to code
      const val = (r[lang] && String(r[lang]).trim())
        ? String(r[lang]).trim()
        : (r.english && String(r.english).trim() ? String(r.english).trim() : r.code);

      const code = String(r.code).trim();
      dict[code] = val;
      dict[code.toLowerCase()] = val;
      dict[code.replace(/-/g, '_')] = val;
      dict[code.replace(/_/g, '-')] = val;
      dict[code.toLowerCase().replace(/-/g, '_')] = val;
      dict[code.toLowerCase().replace(/_/g, '-')] = val;

      if (r.english && typeof r.english === 'string' && r.english.trim()) {
        const eng = r.english.trim();
        dict[eng] = val;
        dict[eng.toLowerCase()] = val;
        dict[eng.toLowerCase().replace(/[\s-]+/g, '_')] = val;
        dict[eng.toLowerCase().replace(/[\s_]+/g, '-')] = val;
      }
    }

    translationCache.set(cacheKey, { timestamp: Date.now(), data: dict });

    return res.json({
      success: true,
      language: lang,
      count: Object.keys(dict).length,
      data: dict
    });
  } catch (err) {
    console.error('[Language Controller Error]', err);
    return sendError(res, 'Failed to fetch translations', 500);
  }
};

/**
 * POST /api/user/language or GET /api/admin/welcome/language/:lang
 * Cloned from CodeIgniter 3 AURA_v1 Welcome::language($lang)
 * Sets session/cookie and updates aura_users.language for logged in user
 */
exports.changeUserLanguage = async (req, res) => {
  try {
    const rawLang = req.body?.language || req.params?.lang || req.query?.lang || 'english';
    const lang = normalizeLangCode(rawLang);

    const userId = req.user?.id || req.session?.user_id || req.user_id;

    if (userId) {
      try {
        await db.query('UPDATE aura_users SET language = ? WHERE id = ?', [lang, userId]);
      } catch (e) {
        console.warn('[Language Controller] Warning updating user language:', e.message);
      }
    }

    if (req.session) {
      req.session.language = lang;
    }

    // Set cookie matching AURA_v1
    res.cookie('aura_language', lang, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: '/',
      sameSite: 'lax'
    });

    return sendSuccess(res, {
      language: lang,
      userId: userId || null
    }, `Language successfully switched to ${lang}`);
  } catch (err) {
    console.error('[Change Language Error]', err);
    return sendError(res, 'Failed to update user language', 500);
  }
};

/**
 * GET /api/admin/languages/entries
 * Paginated list for System Settings Language management table
 */
exports.getLanguageEntries = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit) || 25));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${String(req.query.search).trim()}%` : null;

    let countSql = 'SELECT count(*) as total FROM aura_language';
    let dataSql = 'SELECT * FROM aura_language';
    const params = [];

    if (search) {
      const where = ' WHERE code LIKE ? OR english LIKE ? OR khmer LIKE ? OR chinese LIKE ? OR thai LIKE ? OR vietnamese LIKE ?';
      countSql += where;
      dataSql += where;
      params.push(search, search, search, search, search, search);
    }

    dataSql += ' ORDER BY id DESC LIMIT ? OFFSET ?';

    const [countRows] = await db.query(countSql, params);
    const total = countRows[0]?.total || 0;

    const [rows] = await db.query(dataSql, [...params, limit, offset]);

    return sendPaginated(res, rows, total, page, limit, 'Language entries retrieved');
  } catch (err) {
    console.error('[Get Language Entries Error]', err);
    return sendError(res, 'Failed to retrieve language entries', 500);
  }
};

/**
 * POST /api/admin/languages/entries
 * Add translation key
 */
exports.createLanguageEntry = async (req, res) => {
  try {
    const { code, english, khmer, chinese, thai, vietnamese } = req.body;
    if (!code) {
      return sendError(res, 'Translation code is required', 400);
    }

    const cleanCode = String(code).trim();
    const [result] = await db.query(
      `INSERT INTO aura_language (code, english, khmer, chinese, thai, vietnamese)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       english = VALUES(english),
       khmer = VALUES(khmer),
       chinese = VALUES(chinese),
       thai = VALUES(thai),
       vietnamese = VALUES(vietnamese)`,
      [cleanCode, english || null, khmer || null, chinese || null, thai || null, vietnamese || null]
    );

    // Invalidate cache
    translationCache.clear();

    return sendSuccess(res, {
      id: result.insertId,
      code: cleanCode
    }, 'Translation entry saved successfully');
  } catch (err) {
    console.error('[Create Language Entry Error]', err);
    return sendError(res, err.message || 'Failed to save translation entry', 500);
  }
};

/**
 * PUT /api/admin/languages/entries/:id
 * Update translation key
 */
exports.updateLanguageEntry = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { code, english, khmer, chinese, thai, vietnamese } = req.body;

    if (!id) {
      return sendError(res, 'Invalid translation ID', 400);
    }

    await db.query(
      `UPDATE aura_language
       SET code = COALESCE(?, code),
           english = ?,
           khmer = ?,
           chinese = ?,
           thai = ?,
           vietnamese = ?
       WHERE id = ?`,
      [code || null, english || null, khmer || null, chinese || null, thai || null, vietnamese || null, id]
    );

    // Invalidate cache
    translationCache.clear();

    return sendSuccess(res, { id }, 'Translation entry updated successfully');
  } catch (err) {
    console.error('[Update Language Entry Error]', err);
    return sendError(res, err.message || 'Failed to update translation entry', 500);
  }
};

/**
 * DELETE /api/admin/languages/entries/:id
 * Delete translation key
 */
exports.deleteLanguageEntry = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return sendError(res, 'Invalid translation ID', 400);

    await db.query('DELETE FROM aura_language WHERE id = ?', [id]);
    translationCache.clear();

    return sendSuccess(res, { id }, 'Translation entry deleted successfully');
  } catch (err) {
    console.error('[Delete Language Entry Error]', err);
    return sendError(res, 'Failed to delete translation entry', 500);
  }
};
