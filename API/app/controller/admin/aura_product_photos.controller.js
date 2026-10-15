const createController = require('../core/createController');
const model = require('../models/aura_product_photos.model');

// Add custom handlers here, e.g. module.exports = { ...createController(model), myHandler };
module.exports = createController(model);
