const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_gl_sections",
  primaryKey: ["sectionid"],
  hidden: [],
  columns: [
    {"name":"sectionid","type":"int","auto":false,"nullable":false,"hasDefault":true},
    {"name":"code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"sectionname","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"sectionname_kh","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"AccountType","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"nature","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"order_stat","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
