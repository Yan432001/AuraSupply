const createController = require('../core/createController');
const model = require('../models/aura_purchase_shipping_items.model');

// Add custom handlers here, e.g. module.exports = { ...createController(model), myHandler };
module.exports = createController(model);
