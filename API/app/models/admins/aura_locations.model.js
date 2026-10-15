const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_locations",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"parent_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
