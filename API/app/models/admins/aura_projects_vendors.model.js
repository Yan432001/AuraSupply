const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_projects_vendors",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"project_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"supplier_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"title","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"description","type":"text","auto":false,"nullable":false,"hasDefault":false},
    {"name":"price","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"paid","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
  ],
});
