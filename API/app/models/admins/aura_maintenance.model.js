const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_maintenance",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"timestamp","auto":false,"nullable":true,"hasDefault":true},
    {"name":"sale_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"amount","type":"double","auto":false,"nullable":false,"hasDefault":true},
    {"name":"payment","type":"double","auto":false,"nullable":false,"hasDefault":true},
    {"name":"customer_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"reference_no","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"maintenance_date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"attachment","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"maintenance_status","type":"varchar","auto":false,"nullable":false,"hasDefault":true},
    {"name":"frequency","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"term","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
    {"name":"status","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
  ],
});
