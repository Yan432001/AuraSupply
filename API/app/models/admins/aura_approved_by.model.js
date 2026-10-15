const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_approved_by",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"group_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"form","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"approved_by","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"preparation_by","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"issued_by","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"acknowledged_by","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"received_by","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"stock_received_by","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"quality_checked_by","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"procurement_by","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
