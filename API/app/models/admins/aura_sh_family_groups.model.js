const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_sh_family_groups",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false}
  ],
});
