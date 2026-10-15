const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_pages",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"title","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"description","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"slug","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"body","type":"text","auto":false,"nullable":false,"hasDefault":false},
    {"name":"active","type":"tinyint","auto":false,"nullable":false,"hasDefault":false},
    {"name":"updated_at","type":"timestamp","auto":false,"nullable":false,"hasDefault":true},
    {"name":"order_no","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
  ],
});
