const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_clinic_medication_dose",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"patience_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"medicine_category","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"medicine_name","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"dosage","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
  ],
});
