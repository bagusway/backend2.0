var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var bcrypt = require('bcrypt-nodejs');
var titlize = require('mongoose-title-case');
var validate = require('mongoose-validator');
var autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection("mongodb://localhost/backendtravinesia");
 
autoIncrement.initialize(connection);

var StatusBookingProviderSchema = new Schema({
    id_status_booking_provider: { type: String },
    status_booking_provider:{type:String}
});



module.exports = mongoose.model('status_booking_provider', StatusBookingProviderSchema);

