const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_consumers",
  primaryKey: [],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"first_name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"last_name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"company_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"phone","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"gender","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"create_date","type":"datetime","auto":false,"nullable":false,"hasDefault":false},
    {"name":"update_date","type":"datetime","auto":false,"nullable":false,"hasDefault":false},
  ],
});
