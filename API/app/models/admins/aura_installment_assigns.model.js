const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_installment_assigns",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"installment_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"old_customer","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"new_customer","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"assigned_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"assigned_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
  ],
});
