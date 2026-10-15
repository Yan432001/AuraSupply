const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_loan_charges",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"type","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"calculate","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"amount","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"fee_income_account","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
