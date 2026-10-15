const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_login_attempts",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"mediumint","auto":true,"nullable":false,"hasDefault":false},
    {"name":"ip_address","type":"varbinary","auto":false,"nullable":false,"hasDefault":false},
    {"name":"login","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"time","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
