const createController = require('../core/createController');
const model = require('../models/aura_pay_salaries.model');

// Add custom handlers here, e.g. module.exports = { ...createController(model), myHandler };
module.exports = createController(model);
