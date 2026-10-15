const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_att_day_off_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"day_off","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"day_off_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"text","auto":false,"nullable":true,"hasDefault":false},
  ],
});
