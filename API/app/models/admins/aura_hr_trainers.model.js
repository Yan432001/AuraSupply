const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_trainers",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"full_name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"full_name_kh","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"phone","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"gender","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"address","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"attachment","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"start_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"end_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
  ],
});
