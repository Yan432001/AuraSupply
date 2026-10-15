const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_con_fuel_items",
  primaryKey: [],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"fuel_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"truck_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"truck_code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"driver_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"driver_name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"quantity","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"diesel_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"cost","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"from_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"to_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"driver_assistant","type":"text","auto":false,"nullable":true,"hasDefault":false},
  ],
});
