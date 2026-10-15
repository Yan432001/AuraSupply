const telegramStoreConfigService = require('../../services/telegramStoreConfig.service');

exports.getConfigs = (req, res) => {
  try {
    const configs = telegramStoreConfigService.getAllConfigs();
    return res.status(200).json({ status: true, data: configs });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
};

exports.getConfigBySlug = (req, res) => {
  try {
    const { slug } = req.params;
    const config = telegramStoreConfigService.getConfig(slug);
    if (!config) {
      return res.status(404).json({ status: false, message: 'Store config not found' });
    }
    return res.status(200).json({ status: true, data: config });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
};

exports.saveConfig = (req, res) => {
  try {
    const { storeSlug, ...updates } = req.body;
    if (!storeSlug) {
      return res.status(400).json({ status: false, message: 'storeSlug is required' });
    }
    const saved = telegramStoreConfigService.saveConfig(storeSlug, updates);
    return res.status(200).json({
      status: true,
      message: `Telegram settings saved for ${saved.storeName || storeSlug}`,
      data: saved,
    });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
};

exports.testPing = async (req, res) => {
  try {
    const { storeSlug, groupId, groupTitle, botUsername, botToken } = req.body;
    if (!storeSlug && !groupId) {
      return res.status(400).json({ status: false, message: 'storeSlug or groupId is required' });
    }
    const result = await telegramStoreConfigService.sendTestPing({
      storeSlug,
      groupId,
      groupTitle,
      botUsername,
      botToken,
    });
    return res.status(result.success ? 200 : 400).json({
      status: result.success,
      ...result,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      success: false,
      error: err.message,
      message: `Internal error sending test ping: ${err.message}`,
    });
  }
};

exports.getLogs = (req, res) => {
  try {
    const { slug } = req.query;
    const logs = telegramStoreConfigService.getLogs(slug);
    return res.status(200).json({ status: true, data: logs });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
};
