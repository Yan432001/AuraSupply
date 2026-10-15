const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_installment_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"installment_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"period","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"deadline","type":"date","auto":false,"nullable":false,"hasDefault":false},
    {"name":"payment","type":"double","auto":false,"nullable":false,"hasDefault":false},
    {"name":"principal","type":"double","auto":false,"nullable":false,"hasDefault":false},
    {"name":"interest","type":"double","auto":false,"nullable":false,"hasDefault":false},
    {"name":"balance","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"paid","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"principal_paid","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"interest_paid","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"penalty_paid","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"penalty","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"status","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
