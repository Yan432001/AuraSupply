const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_member_cards",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"timestamp","auto":false,"nullable":false,"hasDefault":true},
    {"name":"card_no","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"discount","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"customer_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"customer","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"start_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"expiry","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"suspend_note","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
    {"name":"booking","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
    {"name":"price","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
