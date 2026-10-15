const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_con_mission_types",
  primaryKey: [],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"fuel","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"road_fee","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"food_expense","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"other_expense","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"road_acc","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"food_acc","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"other_acc","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
