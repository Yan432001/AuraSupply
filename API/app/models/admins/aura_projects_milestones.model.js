const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_projects_milestones",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"project_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"client","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"title","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"start_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"end_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"status","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
