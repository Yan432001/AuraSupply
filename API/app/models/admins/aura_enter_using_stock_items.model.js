const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_enter_using_stock_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"using_stock_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"reason","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"qty_use","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"product_unit_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"unit","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"reference_no","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"warehouse_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"expiry","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"qty_by_unit","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"cost","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"exp_cate_id","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"option_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
