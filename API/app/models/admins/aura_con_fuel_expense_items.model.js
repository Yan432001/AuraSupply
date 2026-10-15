const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_con_fuel_expense_items",
  primaryKey: [],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"fuel_expense_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"truck_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"driver_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"used_fuel_ids","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"in_range_litre","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"out_range_litre","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"pump_litre","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"waiting_litre","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"moving_litre","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"mission_litre","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"total_used","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"fuel_litre","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"balance","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"fuel_price","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"over_amount","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"subtotal","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
