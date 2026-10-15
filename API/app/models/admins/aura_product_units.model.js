const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_product_units",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"unit_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"product_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"unit_qty","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"unit_price","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
