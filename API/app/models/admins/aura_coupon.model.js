const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_coupon",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"timestamp","auto":false,"nullable":false,"hasDefault":true},
    {"name":"card_no","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"value","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"used","type":"int","auto":false,"nullable":false,"hasDefault":true},
    {"name":"customer_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"customer","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"expiry","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
  ],
});
