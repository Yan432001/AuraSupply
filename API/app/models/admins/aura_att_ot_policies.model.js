const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_att_ot_policies",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"ot_policy","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"time_in","type":"time","auto":false,"nullable":true,"hasDefault":true},
    {"name":"start_in","type":"time","auto":false,"nullable":true,"hasDefault":true},
    {"name":"end_in","type":"time","auto":false,"nullable":true,"hasDefault":true},
    {"name":"time_out","type":"time","auto":false,"nullable":true,"hasDefault":true},
    {"name":"start_out","type":"time","auto":false,"nullable":true,"hasDefault":true},
    {"name":"end_out","type":"time","auto":false,"nullable":true,"hasDefault":true},
    {"name":"type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"minimum_min","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"round_min","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
  ],
});
