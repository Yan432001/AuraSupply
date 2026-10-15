const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_pawn_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"pawn_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"product_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"product_code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"quantity","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"price","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_unit_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"unit_quantity","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_note","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"expiry","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"next_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"serial_no","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"rate","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
