const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_installments_penalty",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"from_day","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"to_day","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"type","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"amount","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
