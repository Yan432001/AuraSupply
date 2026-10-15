const createController = require('../core/createController');
const model = require('../models/aura_service_package.model');

// Add custom handlers here, e.g. module.exports = { ...createController(model), myHandler };
module.exports = createController(model);
