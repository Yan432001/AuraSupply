const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_boards",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"board_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"board_name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"board_default","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
    {"name":"board_order","type":"int","auto":false,"nullable":false,"hasDefault":false},
  ],
});
