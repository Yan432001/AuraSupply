const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_fuel_times",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"open_time","type":"time","auto":false,"nullable":true,"hasDefault":true},
    {"name":"close_time","type":"time","auto":false,"nullable":true,"hasDefault":true},
  ],
});
