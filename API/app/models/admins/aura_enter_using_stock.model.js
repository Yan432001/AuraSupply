const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_enter_using_stock",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"using_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"warehouse_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"authorize_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"customer_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"plan_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"address_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"account","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"create_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"reference_no","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"total_cost","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"using_reference_no","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"total_using_cost","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"shop","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
