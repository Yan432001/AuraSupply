const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_att_dailies_ot",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"policy_ot_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"check_in","type":"time","auto":false,"nullable":true,"hasDefault":true},
    {"name":"check_out","type":"time","auto":false,"nullable":true,"hasDefault":true},
    {"name":"ot","type":"time","auto":false,"nullable":true,"hasDefault":true},
    {"name":"type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"food_fee","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
