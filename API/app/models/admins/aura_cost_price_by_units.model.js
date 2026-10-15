const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_cost_price_by_units",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"product_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"unit_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"cost","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"price","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
