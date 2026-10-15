const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_att_check_in_out_raw",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"finger_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"check_time","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"check_time_int","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"device_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"pushed","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
  ],
});
