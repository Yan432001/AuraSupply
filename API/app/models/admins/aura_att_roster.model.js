const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_att_roster",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"employee_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"working_day","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"holiday","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
    {"name":"roster_code_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"policy_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"time_one","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
    {"name":"time_two","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
  ],
});
