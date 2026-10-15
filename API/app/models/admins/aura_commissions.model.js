const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_commissions",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"sale_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"payment_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"amount","type":"decimal","auto":false,"nullable":false,"hasDefault":false},
    {"name":"status","type":"varchar","auto":false,"nullable":false,"hasDefault":true},
    {"name":"note","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"percent","type":"decimal","auto":false,"nullable":false,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"paid_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"paid_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
  ],
});
