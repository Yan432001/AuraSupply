const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_att_attedances",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"working_day","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"present","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"permission","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"absent","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"weekend_ot","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"normal_ot","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"holiday_ot","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"late","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"leave_early","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"month","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"year","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"status","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
    {"name":"approve_att_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"project_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
