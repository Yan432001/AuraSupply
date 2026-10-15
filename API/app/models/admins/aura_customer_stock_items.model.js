const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_customer_stock_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"customer_stock_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"product_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"option_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"quantity","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"warehouse_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_unit_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_unit_code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"unit_quantity","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"serial_no","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
