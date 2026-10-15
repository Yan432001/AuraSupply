const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_con_commission_items",
  primaryKey: [],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"commission_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"delivery_ids","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"officer_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"driver_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"quantity","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"commission_rate","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"normal_qty","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"overtime_qty","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"truck_commission_rate","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"truck_commission_rate_ot","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"normal_amount","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"ot_amount","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"total_commission","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
