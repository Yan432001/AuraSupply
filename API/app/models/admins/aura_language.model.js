const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_language",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"code","type":"varchar","auto":false,"nullable":false,"hasDefault":true},
    {"name":"khmer","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"english","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"chinese","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"thai","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"vietnamese","type":"text","auto":false,"nullable":true,"hasDefault":false},
  ],
});
