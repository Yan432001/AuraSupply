const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_notifications",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"comment","type":"text","auto":false,"nullable":false,"hasDefault":false},
    {"name":"date","type":"timestamp","auto":false,"nullable":false,"hasDefault":true},
    {"name":"from_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"till_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"scope","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
