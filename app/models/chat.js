var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var bcrypt = require('bcrypt-nodejs');
var titlize = require('mongoose-title-case');
var validate = require('mongoose-validator');
var autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection("mongodb://localhost/backendtravinesia");

autoIncrement.initialize(connection);

var ChatSchema = new Schema({
    id_chat: { type: String },
    nick: { type: String },
    msg: { type: String },
    created: { type: Date, default: Date.now }
});

ChatSchema.plugin(autoIncrement.plugin, { model: 'Chat', field: 'id_chat', startAt: 1 });

module.exports = mongoose.model('Chat', ChatSchema);