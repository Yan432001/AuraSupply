const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_employees_family",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"firstname","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"lastname","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"occupation","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"dob","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"relationship","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"telephone","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"pob","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"address","type":"text","auto":false,"nullable":true,"hasDefault":false},
  ],
});
