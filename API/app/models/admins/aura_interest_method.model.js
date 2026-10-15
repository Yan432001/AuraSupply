const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_interest_method",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
