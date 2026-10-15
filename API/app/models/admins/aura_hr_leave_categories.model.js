const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_leave_categories",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"days","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
