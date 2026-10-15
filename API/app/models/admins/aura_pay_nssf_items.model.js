const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_pay_nssf_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"nssf_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"contributory_wage","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"OR_scheme","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"HC_scheme","type":"decimal","auto":false,"nullable":false,"hasDefault":true},
  ],
});
