const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_multi_buys_prices",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"product_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"price_group_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"qty_from","type":"decimal","auto":false,"nullable":false,"hasDefault":true},
    {"name":"qty_to","type":"decimal","auto":false,"nullable":false,"hasDefault":true},
    {"name":"price","type":"decimal","auto":false,"nullable":false,"hasDefault":false},
  ],
});
