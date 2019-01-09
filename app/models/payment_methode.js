var mongoose = require('mongoose');
var payment_methode = require('../models/payment_methode');
var user = require('../models/user');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var titlize = require('mongoose-title-case');
var validate = require('mongoose-validator');
var autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection("mongodb://localhost/backendtravinesia");

autoIncrement.initialize(connection);

var paymentSchema = new Schema({
	id_payment:{type:String, require:true },
	code:{type:String},
	chanel:{type:String},
	type:{type:String},
	price:{type:Number},
	created_at:{type:Date,default:Date.now},
    updated_at:{type:Date,default:Date.now}
});
paymentSchema.plugin(autoIncrement.plugin, {model: 'payment_methode', field: 'id_payment', startAt: 1});
module.exports = mongoose.model('payment_methode', paymentSchema);