const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_event_schedule",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"title","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"description","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"start","type":"datetime","auto":false,"nullable":false,"hasDefault":false},
    {"name":"end","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"ticket_limit","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"status","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"updated_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"photo","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
