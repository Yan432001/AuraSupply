const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_pay_additions",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"value","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"account","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
