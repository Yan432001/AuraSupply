const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_api_limits",
  primaryKey: [],
  hidden: ["api_key"],
  columns: [
    {"name":"id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"uri","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"count","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"hour_started","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"api_key","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
  ],
});
