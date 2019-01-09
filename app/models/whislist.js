var mongoose = require('mongoose');
var User = require('../models/user');
var Trip = require('../models/trip');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var titlize = require('mongoose-title-case');
var validate = require('mongoose-validator');
var autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection("mongodb://localhost/backendtravinesia");

autoIncrement.initialize(connection);

var WhislistSchema = new Schema({
	id_whislist:{type:String},
	id_user : {type:String},
	id_trip : {type:String},
	created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
WhislistSchema.plugin(autoIncrement.plugin, { model: 'Whislist', field: 'id_whislist', startAt: 1 });

module.exports = mongoose.model('Whislist', WhislistSchema);