const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_salary_review_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"salary_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"old_salary","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"old_addition","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"result","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"increase_salary","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"new_salary","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"new_addition","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"gross_salary","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
