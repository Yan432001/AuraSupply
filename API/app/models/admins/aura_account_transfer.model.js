const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_account_transfer",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"timestamp","auto":false,"nullable":false,"hasDefault":true},
    {"name":"reference_no","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"charge_account","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"charge_amount","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"transfer_account","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"transfer_amount","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"transfer_amount2","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"transfer_amount3","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"transfer_amount4","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"attachment","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"status","type":"int","auto":false,"nullable":false,"hasDefault":true},
  ],
});
