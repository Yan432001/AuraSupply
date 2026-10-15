const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_employees_relationship",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"is_children","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
    {"name":"is_spouse","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
  ],
});
