const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_api_logs",
  primaryKey: ["id"],
  hidden: ["api_key"],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"uri","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"method","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"params","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"api_key","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"ip_address","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"time","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"rtime","type":"float","auto":false,"nullable":true,"hasDefault":true},
    {"name":"authorized","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"response_code","type":"smallint","auto":false,"nullable":true,"hasDefault":true},
  ],
});
