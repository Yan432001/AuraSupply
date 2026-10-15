const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_payment_term",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"description","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"due_day","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"due_day_for_discount","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"discount","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
