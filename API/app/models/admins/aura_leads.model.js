const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_leads",
  primaryKey: ["task_id"],
  hidden: [],
  columns: [
    {"name":"task_id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"company","type":"text","auto":false,"nullable":false,"hasDefault":false},
    {"name":"closed_date","type":"timestamp","auto":false,"nullable":true,"hasDefault":true},
    {"name":"lead_group","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"lead_order","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"lead_color","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
