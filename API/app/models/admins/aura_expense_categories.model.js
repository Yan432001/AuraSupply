const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_expense_categories",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"code","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"parent_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"expense_account","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
  ],
});
