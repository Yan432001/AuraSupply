const express = require('express');
const router = express.Router();
const controller = require('../../controller/telegram/webhook.controller');

// Store-specific webhook route with secret token parameter
router.post('/webhook/:storeSlug/:secretToken', controller.handleStoreWebhook);
router.post('/webhook/:storeSlug', controller.handleStoreWebhook);

module.exports = router;
