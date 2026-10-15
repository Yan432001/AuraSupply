const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_containers",
  primaryKey: ["container_id"],
  hidden: [],
  columns: [
    {"name":"container_id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"container_board","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"container_name","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"container_order","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"container_color","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"container_done","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
  ],
});
