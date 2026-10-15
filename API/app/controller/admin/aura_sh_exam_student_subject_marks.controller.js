const createController = require('../core/createController');
const model = require('../models/aura_sh_exam_student_subject_marks.model');

// Add custom handlers here, e.g. module.exports = { ...createController(model), myHandler };
module.exports = createController(model);
