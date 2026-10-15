const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_att_roster_code",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"code","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"hour","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"from_time","type":"time","auto":false,"nullable":true,"hasDefault":true},
    {"name":"to_time","type":"time","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
  ],
});
