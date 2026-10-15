const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_promos",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"product2buy","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"product2get","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"start_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"end_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"text","auto":false,"nullable":true,"hasDefault":false},
  ],
});
