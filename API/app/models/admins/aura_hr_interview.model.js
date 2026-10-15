const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_interview",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"shortlist_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"interviewer_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"total_mark","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"selection","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"text","auto":false,"nullable":true,"hasDefault":false},
  ],
});
