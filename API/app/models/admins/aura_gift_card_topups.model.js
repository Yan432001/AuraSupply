const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_gift_card_topups",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"timestamp","auto":false,"nullable":false,"hasDefault":true},
    {"name":"card_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"amount","type":"decimal","auto":false,"nullable":false,"hasDefault":false},
    {"name":"created_by","type":"int","auto":false,"nullable":false,"hasDefault":false},
  ],
});
