const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_con_adjustment_items",
  primaryKey: [],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"adjustment_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"system_qty","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"machine_qty","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"different_qty","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
