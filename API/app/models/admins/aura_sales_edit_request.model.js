const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_sales_edit_request",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false}
  ],
});
