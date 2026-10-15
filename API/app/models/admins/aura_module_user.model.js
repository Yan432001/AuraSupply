const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_module_user",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"user_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"allow_using_user","type":"int","auto":false,"nullable":false,"hasDefault":true},
    {"name":"plan_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"subscribe_id","type":"int","auto":false,"nullable":false,"hasDefault":true},
    {"name":"duration","type":"int","auto":false,"nullable":false,"hasDefault":true},
    {"name":"branch_id","type":"int","auto":false,"nullable":false,"hasDefault":true},
    {"name":"modules","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"website_url","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"register_date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"start_using_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"expired_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"status","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
    {"name":"suspend_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
  ],
});
