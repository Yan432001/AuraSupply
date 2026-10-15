const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_progress_note",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"project_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"date","type":"timestamp","auto":false,"nullable":false,"hasDefault":true},
    {"name":"reference","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"customer_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"type_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"effective_date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"note","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"doctor_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"updated_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_at","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"attachment","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"status","type":"char","auto":false,"nullable":true,"hasDefault":true},
  ],
});
