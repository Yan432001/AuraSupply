const createController = require('../core/createController');
const model = require('../models/aura_cost_price_by_units.model');

// Add custom handlers here, e.g. module.exports = { ...createController(model), myHandler };
module.exports = createController(model);
