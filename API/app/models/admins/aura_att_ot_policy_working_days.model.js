const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_att_ot_policy_working_days",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"policy_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"ot_policy_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"day","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
