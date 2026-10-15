const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_addon_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"product_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"item_code","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"price","type":"decimal","auto":false,"nullable":false,"hasDefault":true},
    {"name":"description","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
