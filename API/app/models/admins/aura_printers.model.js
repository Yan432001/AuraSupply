const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_printers",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"title","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"type","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"stock_type","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"order_number","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"profile","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"char_per_line","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
    {"name":"path","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"ip_address","type":"varbinary","auto":false,"nullable":true,"hasDefault":true},
    {"name":"port","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"dynamic_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
  ],
});
