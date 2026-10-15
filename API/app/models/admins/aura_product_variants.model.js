const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_product_variants",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"product_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"cost","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"price","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"quantity","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"qty_unit","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
  ],
});
