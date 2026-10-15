const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_pawn_rate_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"pawn_rate_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"pawn_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"pawn_item_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"pawn_price","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"pawn_rate","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"pawn_quantity","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"pawn_unit_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"pawn_unit_quantity","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"pawn_serial_no","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"pawn_expiry","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"price","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"payment_rate","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"next_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
  ],
});
