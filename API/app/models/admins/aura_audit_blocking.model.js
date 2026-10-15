const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_audit_blocking",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"product_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"product_name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"realise_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_code","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"current_date","type":"date","auto":false,"nullable":false,"hasDefault":false},
    {"name":"expiry_date","type":"date","auto":false,"nullable":false,"hasDefault":false},
    {"name":"create_by","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"note","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"status","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
