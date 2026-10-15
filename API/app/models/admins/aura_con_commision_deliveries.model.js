const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_con_commision_deliveries",
  primaryKey: [],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"commission_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"delivery_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"driver_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"officer_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
