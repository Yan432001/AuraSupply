const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_frequency",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"description","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"day","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
