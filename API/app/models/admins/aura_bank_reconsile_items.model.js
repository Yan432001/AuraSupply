const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_bank_reconsile_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"reconsile_id","type":"tinyint","auto":false,"nullable":false,"hasDefault":false},
    {"name":"bank_type","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
    {"name":"gl_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"amount","type":"decimal","auto":false,"nullable":false,"hasDefault":false},
    {"name":"description","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
  ],
});
