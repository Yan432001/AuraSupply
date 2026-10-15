const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_product_options",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"product_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"option_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"start_no","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"last_no","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
