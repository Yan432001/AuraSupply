const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_attendances",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"bigint","auto":true,"nullable":false,"hasDefault":false},
    {"name":"employee_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"user_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"shift_date","type":"date","auto":false,"nullable":false,"hasDefault":false},
    {"name":"shift_starttime","type":"datetime","auto":false,"nullable":false,"hasDefault":false},
    {"name":"shift_endtime","type":"datetime","auto":false,"nullable":false,"hasDefault":false},
    {"name":"shift_status","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
    {"name":"shift_intype","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
    {"name":"shift_outtype","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
    {"name":"company_status","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
    {"name":"shift_total_time","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"checkin_location","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"checkout_location","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"created_at","type":"datetime","auto":false,"nullable":false,"hasDefault":false},
    {"name":"updated_at","type":"datetime","auto":false,"nullable":false,"hasDefault":false},
  ],
});
