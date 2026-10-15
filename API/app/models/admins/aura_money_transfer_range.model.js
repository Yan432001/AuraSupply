const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_money_transfer_range",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"company_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"from_amount","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"to_amount","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"commission","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"transfer_fee","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
