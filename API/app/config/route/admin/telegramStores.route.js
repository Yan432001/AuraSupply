const express = require('express');
const router = express.Router();
const controller = require('../../../controller/admin/telegramStores.controller');

router.get('/', controller.getConfigs);
router.get('/configs', controller.getConfigs);
router.get('/configs/:slug', controller.getConfigBySlug);
router.post('/save', controller.saveConfig);
router.post('/test-ping', controller.testPing);
router.get('/logs', controller.getLogs);

module.exports = router;
