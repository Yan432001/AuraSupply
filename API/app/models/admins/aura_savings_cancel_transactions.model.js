const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_savings_cancel_transactions",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false}
  ],
});
