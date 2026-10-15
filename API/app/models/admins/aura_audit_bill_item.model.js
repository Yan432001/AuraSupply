const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_audit_bill_item",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"audit_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"reference","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"item_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"item_code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"item_name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"price","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"qty","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"new_qty","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"customer_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"user_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"warehouse_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"tran_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"status","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"print_index","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"row_id","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
