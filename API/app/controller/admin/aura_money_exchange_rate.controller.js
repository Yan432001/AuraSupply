const createController = require('../core/createController');
const model = require('../models/aura_money_exchange_rate.model');

// Add custom handlers here, e.g. module.exports = { ...createController(model), myHandler };
module.exports = createController(model);
