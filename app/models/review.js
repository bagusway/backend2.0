var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var bcrypt = require('bcrypt-nodejs');
var titlize = require('mongoose-title-case');
var validate = require('mongoose-validator');
var autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection("mongodb://localhost/backendtravinesia");

autoIncrement.initialize(connection);

var ReviewSchema = new Schema({
    id_user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    id_trip: {
        type: Schema.Types.ObjectId,
        ref: 'Trip'
    },
    id_booking: {
        type: Schema.Types.ObjectId,
        ref: 'Booking'
    },
    rate: { type: Number },
    field: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

ReviewSchema.plugin(autoIncrement.plugin, { model: 'Review', field: 'id_review', startAt: 1 });

module.exports = mongoose.model('Review', ReviewSchema);