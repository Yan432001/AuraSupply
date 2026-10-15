const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_shortlist",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"candidate_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"job_position_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"shortlist_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"interview_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"text","auto":false,"nullable":true,"hasDefault":false},
  ],
});
