const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_clinic_medical_record",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"patience_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"category","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"test_name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"test_type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"method","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"report_day","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"result","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"attachment","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
  ],
});
