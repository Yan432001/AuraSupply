const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_money_exchange_rate",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"currency_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"from_currency","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"to_currency","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"exchange_rate","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
