const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_gym_booking",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"date","auto":false,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"phone","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
  ],
});
