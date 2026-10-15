const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_agreement",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"customer_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"customer","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"biller_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"biller","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"warehouse_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"date","type":"timestamp","auto":false,"nullable":false,"hasDefault":true},
    {"name":"reference_no","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"unit_price","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"quantity","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"total_amount","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"payment_term","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"delivery","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"account_no","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
