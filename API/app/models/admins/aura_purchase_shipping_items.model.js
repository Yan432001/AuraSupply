const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_purchase_shipping_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"purchase_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"receive_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"purchase_item_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"quantity","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"unit_quantity","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"cost","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"unit_cost","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"unit_percent","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
