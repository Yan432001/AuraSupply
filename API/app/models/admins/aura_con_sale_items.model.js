const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_con_sale_items",
  primaryKey: [],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"sale_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"product_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"product_code","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"product_name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"product_type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"real_unit_price","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"net_unit_price","type":"double","auto":false,"nullable":false,"hasDefault":false},
    {"name":"unit_price","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"quantity","type":"double","auto":false,"nullable":false,"hasDefault":true},
    {"name":"unit_quantity","type":"double","auto":false,"nullable":false,"hasDefault":true},
    {"name":"cost","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"subtotal","type":"double","auto":false,"nullable":false,"hasDefault":false},
    {"name":"product_unit_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_unit_code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"raw_materials","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"con_delivery_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"warehouse_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
