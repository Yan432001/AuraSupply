const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_att_devices",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"project_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"ip_address","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"port","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"clear","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
    {"name":"max_att_log","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"inactive","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
    {"name":"protocol","type":"char","auto":false,"nullable":true,"hasDefault":true},
  ],
});
