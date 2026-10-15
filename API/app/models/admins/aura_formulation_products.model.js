const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_formulation_products",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"main_product_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"for_product_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"for_width","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"for_height","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"for_square","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"for_qty","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"for_field","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"for_operation","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"for_caculation","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"for_unit_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
