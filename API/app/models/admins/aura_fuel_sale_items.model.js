const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_fuel_sale_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"fuel_sale_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"tank_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"nozzle_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"nozzle_no","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"nozzle_start_no","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"nozzle_end_no","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"quantity","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"unit_price","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"subtotal","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"customer_qty","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"customer_amount","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"using_qty","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
