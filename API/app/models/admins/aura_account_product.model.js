const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_account_product",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"product_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"revenue_account","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"ar_account","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"stock_account","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"costing_account","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"adjustment_account","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"using_account","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"convert_account","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"discount_account","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"expense_account","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"pawn_account","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"consignment_acc","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"customer_stock_acc","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
