const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_category_projects",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"category_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"project_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
