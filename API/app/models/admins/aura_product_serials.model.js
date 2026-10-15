const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_product_serials",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"purchase_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"transfer_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_id","type":"int","auto":false,"nullable":false,"hasDefault":true},
    {"name":"warehouse_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"serial","type":"varchar","auto":false,"nullable":false,"hasDefault":true},
    {"name":"description","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"color","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"cost","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"price","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"inactive","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
    {"name":"supplier_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"customer_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"supplier","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"adjustment_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"pawn_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"receive_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
