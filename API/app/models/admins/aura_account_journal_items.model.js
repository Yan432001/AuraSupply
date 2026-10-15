const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_account_journal_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"journal_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"account_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"account_code","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"account_name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"amount","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"text","auto":false,"nullable":true,"hasDefault":false},
  ],
});
