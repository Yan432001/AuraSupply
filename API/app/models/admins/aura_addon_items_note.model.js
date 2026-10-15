const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_addon_items_note",
  primaryKey: [],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"suspend_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"suspend_item_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"suspend_item_qty","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"item_number","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"addon_product_code","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"addon_product_qty","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"addon_status","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"row_id","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
  ],
});
