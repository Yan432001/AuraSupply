const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_loan_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"loan_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"deadline","type":"date","auto":false,"nullable":false,"hasDefault":false},
    {"name":"period","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"payment","type":"double","auto":false,"nullable":false,"hasDefault":false},
    {"name":"principal","type":"double","auto":false,"nullable":false,"hasDefault":false},
    {"name":"interest","type":"double","auto":false,"nullable":false,"hasDefault":false},
    {"name":"penalty","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"fee_charge","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"balance","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"paid","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"status","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
