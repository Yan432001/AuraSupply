const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_modules",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"status","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
    {"name":"module","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"active","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
    {"name":"image","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"favicon","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"style","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"controller","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"description","type":"text","auto":false,"nullable":false,"hasDefault":false},
  ],
});
