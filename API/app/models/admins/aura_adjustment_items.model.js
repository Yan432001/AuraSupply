const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_adjustment_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"adjustment_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"product_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"option_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"quantity","type":"decimal","auto":false,"nullable":false,"hasDefault":false},
    {"name":"warehouse_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"serial_no","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"type","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"expiry","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"real_unit_cost","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
