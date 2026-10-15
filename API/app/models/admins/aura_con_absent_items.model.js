const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_con_absent_items",
  primaryKey: [],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"absent_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"officer_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"absent_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
  ],
});
