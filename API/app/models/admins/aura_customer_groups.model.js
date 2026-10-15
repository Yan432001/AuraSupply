const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_customer_groups",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"percent","type":"int","auto":false,"nullable":false,"hasDefault":false},
  ],
});
