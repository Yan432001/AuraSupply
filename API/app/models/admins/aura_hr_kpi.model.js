const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_kpi",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"month","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"kpi_type","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"result","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"measure","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"measure_kh","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"measure_color","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"manager_note","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"employee_note","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"attachment","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
