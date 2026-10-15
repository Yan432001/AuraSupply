const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_resignation",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"attachment","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"status","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"position_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"department_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"group_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"notice_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"resignation_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"returned_asset","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
  ],
});
