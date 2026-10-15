const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_sh_student_faults",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false}
  ],
});
