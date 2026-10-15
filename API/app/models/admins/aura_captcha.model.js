const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_captcha",
  primaryKey: ["captcha_id"],
  hidden: [],
  columns: [
    {"name":"captcha_id","type":"bigint","auto":true,"nullable":false,"hasDefault":false},
    {"name":"captcha_time","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"ip_address","type":"varchar","auto":false,"nullable":false,"hasDefault":true},
    {"name":"word","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
  ],
});
