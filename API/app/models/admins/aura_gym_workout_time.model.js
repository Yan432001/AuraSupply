const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_gym_workout_time",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"workout_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"day","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"activity_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"kg","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"sets","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"reps","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"rest_time","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
