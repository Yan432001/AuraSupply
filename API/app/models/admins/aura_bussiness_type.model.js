const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_bussiness_type",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"icon","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"categories","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
