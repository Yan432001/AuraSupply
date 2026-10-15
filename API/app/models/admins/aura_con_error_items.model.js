const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_con_error_items",
  primaryKey: [],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"error_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"stregth_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"stregth_code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"stregth_name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"quantity","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
