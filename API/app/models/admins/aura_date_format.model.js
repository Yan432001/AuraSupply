const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_date_format",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"js","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"php","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"sql","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
