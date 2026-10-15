const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_account_transfer_item",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"transfer_account_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"date","type":"timestamp","auto":false,"nullable":false,"hasDefault":true},
    {"name":"reference_no","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"paid_by","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"amount","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"charge_amount","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"transfer_amount","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
  ],
});
