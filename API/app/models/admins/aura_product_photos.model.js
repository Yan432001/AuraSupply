const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_product_photos",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"product_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"photo","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
  ],
});
