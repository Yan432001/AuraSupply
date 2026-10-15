const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_budgets",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"project_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"date","type":"timestamp","auto":false,"nullable":false,"hasDefault":true},
    {"name":"reference","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"title","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"amount","type":"decimal","auto":false,"nullable":false,"hasDefault":false},
    {"name":"note","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"attachment","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"category_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"warehouse_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
