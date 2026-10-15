const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_gl_charts",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"accountcode","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"accountname","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"parent_acc","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"sectionid","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"account_tax_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"acc_level","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"lineage","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"bank","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
    {"name":"value","type":"decimal","auto":false,"nullable":false,"hasDefault":true},
    {"name":"type","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
    {"name":"inactive","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
    {"name":"parent_code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"cash_flow","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
    {"name":"nature","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
