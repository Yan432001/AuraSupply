const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_customer_package",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"code","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"period","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"period_type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"price","type":"decimal","auto":false,"nullable":false,"hasDefault":true},
    {"name":"class","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"text","auto":false,"nullable":true,"hasDefault":false},
  ],
});
