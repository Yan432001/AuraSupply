const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_bom_products",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"standard_product_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"bom_type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"unit_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"quantity","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
