const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_costing",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"sale_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"sale_item_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"purchase_item_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"service_cost","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"purchase_net_unit_cost","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"purchase_unit_cost","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"sale_net_unit_price","type":"decimal","auto":false,"nullable":false,"hasDefault":false},
    {"name":"sale_unit_price","type":"decimal","auto":false,"nullable":false,"hasDefault":false},
    {"name":"quantity","type":"decimal","auto":false,"nullable":false,"hasDefault":false},
    {"name":"quantity_balance","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"inventory","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
    {"name":"overselling","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
    {"name":"option_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"expiry","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"hide","type":"int","auto":false,"nullable":false,"hasDefault":true},
  ],
});
