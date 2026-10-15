const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_currencies",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"code","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"rate","type":"decimal","auto":false,"nullable":false,"hasDefault":false},
    {"name":"auto_update","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
    {"name":"symbol","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"day","type":"date","auto":false,"nullable":true,"hasDefault":true},
  ],
});
