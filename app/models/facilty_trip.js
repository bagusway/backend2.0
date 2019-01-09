var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var titlize = require('mongoose-title-case');
var validate = require('mongoose-validator');
var autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection("mongodb://localhost/backendtravinesia");
 
autoIncrement.initialize(connection);

var FaciltySchema = new Schema({
    id_facilty: { type: String },
    facilty_name: { type: String }
});

module.exports = mongoose.model('Facilty', FaciltySchema);