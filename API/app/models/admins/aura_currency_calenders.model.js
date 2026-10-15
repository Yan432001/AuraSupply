const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_currency_calenders",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"currency_id","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
    {"name":"date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"rate","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
