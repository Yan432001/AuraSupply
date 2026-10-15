const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_asset_evaluation",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"expense_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"evaluation_date","type":"date","auto":false,"nullable":false,"hasDefault":false},
    {"name":"current_cost","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"accumulated","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"net_value","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"is_expense","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
    {"name":"dp_account","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"acc_account","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"reference_no","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
