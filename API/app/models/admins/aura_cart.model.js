const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_cart",
  primaryKey: [],
  hidden: [],
  columns: [
    {"name":"id","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"time","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"user_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"data","type":"text","auto":false,"nullable":true,"hasDefault":false},
  ],
});
