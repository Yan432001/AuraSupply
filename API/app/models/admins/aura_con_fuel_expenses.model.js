const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_con_fuel_expenses",
  primaryKey: [],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"reference_no","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"project_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"grand_total","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"paid","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"balance","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"payment_status","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"attachment","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"from_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"to_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
  ],
});
