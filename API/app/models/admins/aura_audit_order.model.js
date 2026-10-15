const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_audit_order",
  primaryKey: ["audit_id"],
  hidden: [],
  columns: [
    {"name":"audit_id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"suspended_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"suspend_note","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"reference","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"customer_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"user_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"warehouse_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"tran_date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"description","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"status","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"change_status","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
    {"name":"print_index","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"order_status","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
  ],
});
