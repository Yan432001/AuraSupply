const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_con_mission_items",
  primaryKey: [],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"mission_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"truck_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"truck_code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"driver_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"driver_name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"mission_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"mission_type_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"fuel","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"road_fee","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"food_expense","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"other_expense","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
