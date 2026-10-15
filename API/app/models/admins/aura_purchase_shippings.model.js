const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_purchase_shippings",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"reference_no","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"purchase_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"receive_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"supplier_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"supplier","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"f_cost","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"order_tax_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"order_tax","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"total","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
