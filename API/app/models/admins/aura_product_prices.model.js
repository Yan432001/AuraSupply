const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_product_prices",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"price_group_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"product_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"unit_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"price","type":"decimal","auto":false,"nullable":false,"hasDefault":false},
    {"name":"qty_from","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"qty_to","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"academic_year","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
