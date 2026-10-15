const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_loan_working_status",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
