const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_clinic_operations",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"patience_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"operation_category","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"operation_name","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"doctor","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"assistant","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"assistant_2","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"anesthetist","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"anesthesia_type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"ot_technician","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"ot_assistant","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"result","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"attachment","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
  ],
});
