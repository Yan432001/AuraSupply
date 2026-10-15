const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_booking",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"product_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"product_name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"product_code","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"customer","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"customer_name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"status","type":"int","auto":false,"nullable":false,"hasDefault":true},
    {"name":"note","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"booking_price","type":"decimal","auto":false,"nullable":false,"hasDefault":false},
    {"name":"create_by","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"expiry_date","type":"date","auto":false,"nullable":false,"hasDefault":false},
    {"name":"current_date","type":"date","auto":false,"nullable":false,"hasDefault":false},
  ],
});
