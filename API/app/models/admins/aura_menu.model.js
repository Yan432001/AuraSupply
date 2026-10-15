const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_menu",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"parent_id","type":"int","auto":false,"nullable":false,"hasDefault":true},
    {"name":"module","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"permission","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"selected_name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"slug","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"icon","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"image","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"status","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
    {"name":"order_number","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"is_modal","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
  ],
});
