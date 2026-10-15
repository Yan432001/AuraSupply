const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_projects",
  primaryKey: ["project_id"],
  hidden: [],
  columns: [
    {"name":"project_id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"user_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"clients_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"customer_id","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"warehouse_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"project_name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"project_code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"start_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"end_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"target","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"status","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"approve_status","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"approve_note","type":"text","auto":false,"nullable":true,"hasDefault":false},
  ],
});
