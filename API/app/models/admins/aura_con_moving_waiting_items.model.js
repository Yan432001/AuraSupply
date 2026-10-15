const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_con_moving_waiting_items",
  primaryKey: [],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"moving_waiting_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"truck_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"truck_code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"driver_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"driver_name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"times_hours","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
