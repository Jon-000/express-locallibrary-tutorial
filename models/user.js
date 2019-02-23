const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  // display_name: {type: String, required: true, max: 100}, // 本应用展示名
  github_login: {type: String}, // github登录名
  github_name: { type: String}, //github展示名
  github_id: {type: Number },
  github_avatar_url: {type: String},
  github_email: {type: String},
  github_node_id: {type: String}

})

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
