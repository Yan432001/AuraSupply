const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_promotion_categories",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"promotion_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"category_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"discount","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
