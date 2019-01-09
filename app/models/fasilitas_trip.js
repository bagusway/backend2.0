var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var titlize = require('mongoose-title-case');
var validate = require('mongoose-validator');
var autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection("mongodb://localhost/backendtravinesia");
 
autoIncrement.initialize(connection);

var FasiltasSchema = new Schema({

	id_fasilitas: { type: String, require:true},
    fasilitas_name: { type: String }
	});

FasiltasSchema.plugin(autoIncrement.plugin, {model: 'Fasilitas', field: 'id_fasilitas', startAt: 1});
