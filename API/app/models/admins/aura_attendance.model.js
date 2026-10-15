const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_attendance",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"status","type":"enum","auto":false,"nullable":false,"hasDefault":true},
    {"name":"user_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"in_time","type":"datetime","auto":false,"nullable":false,"hasDefault":false},
    {"name":"out_time","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"checked_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"checked_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"reject_reason","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"deleted","type":"int","auto":false,"nullable":false,"hasDefault":true},
  ],
});
