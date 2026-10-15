const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_combo_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"product_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"item_code","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"quantity","type":"decimal","auto":false,"nullable":false,"hasDefault":false},
    {"name":"unit_price","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
  ],
});
