const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_warehouses_products",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false}
  ],
});
