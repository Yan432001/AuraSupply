const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_consignments",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"consignment_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"reference_no","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"customer_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"customer","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"warehouse_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"biller_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"biller","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"project_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"total","type":"double","auto":false,"nullable":false,"hasDefault":false},
    {"name":"grand_total","type":"double","auto":false,"nullable":false,"hasDefault":false},
    {"name":"status","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_at","type":"timestamp","auto":false,"nullable":true,"hasDefault":true},
    {"name":"attachment","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"valid_day","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
