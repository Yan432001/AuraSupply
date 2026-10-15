const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_id_card_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"id_card_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
