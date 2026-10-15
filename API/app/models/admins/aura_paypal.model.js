const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_paypal",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"active","type":"tinyint","auto":false,"nullable":false,"hasDefault":false},
    {"name":"account_email","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"paypal_currency","type":"varchar","auto":false,"nullable":false,"hasDefault":true},
    {"name":"fixed_charges","type":"decimal","auto":false,"nullable":false,"hasDefault":true},
    {"name":"extra_charges_my","type":"decimal","auto":false,"nullable":false,"hasDefault":true},
    {"name":"extra_charges_other","type":"decimal","auto":false,"nullable":false,"hasDefault":true},
  ],
});
