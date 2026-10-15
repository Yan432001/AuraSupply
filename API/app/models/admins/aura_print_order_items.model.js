const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_print_order_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"printer","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"text","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"item","type":"mediumtext","auto":false,"nullable":true,"hasDefault":false},
    {"name":"suspend_note","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"stock_type","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"status","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
  ],
});
