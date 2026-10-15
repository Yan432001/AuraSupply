const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_receive_payment_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"receive_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"payment_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"payment_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"sale_ref","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"payment_ref","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"payment_paid_by","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"payment_amount","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"payment_created_by","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"customer","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
