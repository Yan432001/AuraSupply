const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_machine_types",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"price_group_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
  ],
});
