const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_kpi_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"kpi_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"question_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"question","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"question_kh","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"min_rate","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"max_rate","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"value_percentage","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"comment","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"rate","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
