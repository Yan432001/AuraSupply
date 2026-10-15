const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_pos_register",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"timestamp","auto":false,"nullable":false,"hasDefault":true},
    {"name":"user_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"cash_in_hand","type":"decimal","auto":false,"nullable":false,"hasDefault":false},
    {"name":"status","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"total_cash","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"total_cheques","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"total_cc_slips","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"total_cash_submitted","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"total_cheques_submitted","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"total_cc_slips_submitted","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"closed_at","type":"timestamp","auto":false,"nullable":true,"hasDefault":true},
    {"name":"transfer_opened_bills","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"closed_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"pushed","type":"tinyint","auto":false,"nullable":false,"hasDefault":true},
  ],
});
