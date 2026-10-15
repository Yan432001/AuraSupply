const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_clinic_ipd_opd",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"reference_no","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"patient_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"symptoms","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"symptoms_description","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"doctor_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"patience_type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"weight","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"height","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"temperature","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"bed","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"attachment","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
  ],
});
