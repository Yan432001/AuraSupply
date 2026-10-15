const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_down_payments",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"title","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"sale_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"amount","type":"float","auto":false,"nullable":true,"hasDefault":true},
    {"name":"percent","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"type","type":"char","auto":false,"nullable":false,"hasDefault":true},
    {"name":"payment_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"status","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"created_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
