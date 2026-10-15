const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_api_keys",
  primaryKey: ["id"],
  hidden: ["key","is_private_key"],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"user_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"reference","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"key","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"level","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"ignore_limits","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
    {"name":"is_private_key","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
    {"name":"ip_addresses","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"date_created","type":"int","auto":false,"nullable":false,"hasDefault":false},
  ],
});
