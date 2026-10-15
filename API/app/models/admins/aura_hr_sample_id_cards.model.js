const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_sample_id_cards",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"width","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"height","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"front_card","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"back_card","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"description","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"profile_padding_top","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"profile_padding_left","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"working_padding_left","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"font_size","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"qrcode_padding_left","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"qrcode_padding_top","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"qrcode_size","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"photo_width","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"photo_height","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
