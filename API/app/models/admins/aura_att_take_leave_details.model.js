const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_att_take_leave_details",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"take_leave_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"employee_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"leave_type","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"start_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"end_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"timeshift","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"reason","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"leave_category_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
