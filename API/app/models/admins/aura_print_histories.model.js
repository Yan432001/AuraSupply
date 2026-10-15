const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_print_histories",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"transaction","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"transaction_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"reference_no","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"print_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"print_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
  ],
});
