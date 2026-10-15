const express = require('express');
const router = express.Router();
const EMenuController = require('../../controller/emenu.controller');

router.get('/stores', EMenuController.getStoreList);
router.get('/dispatches', EMenuController.getDispatches);
router.get('/store/:identifier', EMenuController.resolveStore);
router.get('/store/:identifier/menu', EMenuController.getStoreMenu);
router.post('/store/:identifier/checkout', EMenuController.submitOrder);
router.get('/data', (req, res) => res.json({ status: true, message: 'EMenu API active' }));

module.exports = router;
