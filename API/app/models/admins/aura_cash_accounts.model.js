const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_cash_accounts",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"account_code","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"type","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"order","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
  ],
});
