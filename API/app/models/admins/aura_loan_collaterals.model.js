const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_loan_collaterals",
  primaryKey: [],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"application_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"value","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"attachment","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"model","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"serial_number","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"registered_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"registered_by","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
