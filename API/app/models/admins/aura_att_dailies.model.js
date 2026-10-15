const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_att_dailies",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"check_in_out_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"check_time","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"check_type","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"timeshift","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"before_time","type":"time","auto":false,"nullable":true,"hasDefault":true},
    {"name":"after_time","type":"time","auto":false,"nullable":true,"hasDefault":true},
    {"name":"project_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
