const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_groups",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"mediumint","auto":true,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"description","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"status","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
  ],
});
