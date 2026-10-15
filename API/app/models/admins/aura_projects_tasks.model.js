const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_projects_tasks",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"project_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"milestone_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"title","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"start_date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"end_date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"description","type":"text","auto":false,"nullable":false,"hasDefault":false},
    {"name":"icon","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"user_id","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"status","type":"varchar","auto":false,"nullable":false,"hasDefault":true},
    {"name":"progress","type":"int","auto":false,"nullable":false,"hasDefault":true},
  ],
});
