const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_migrations",
  primaryKey: [],
  hidden: [],
  columns: [
    {"name":"version","type":"bigint","auto":false,"nullable":false,"hasDefault":false},
  ],
});
