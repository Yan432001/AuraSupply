const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_att_apply_ot",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"from_time","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"to_time","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"approve_status","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"attachment","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
