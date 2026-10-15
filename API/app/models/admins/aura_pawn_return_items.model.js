const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_pawn_return_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"pawn_return_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"pawn_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"pawn_price","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"pawn_rate","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"quantity","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"return_amount","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_unit_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"unit_quantity","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"serial_no","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"expiry","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"payment_rate","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
