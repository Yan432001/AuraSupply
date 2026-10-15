const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_maintenance_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"main_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"date","type":"date","auto":false,"nullable":false,"hasDefault":false},
    {"name":"note","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"status","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_at","type":"date","auto":false,"nullable":true,"hasDefault":true},
  ],
});
