var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection("mongodb://localhost/backendtravinesia");

autoIncrement.initialize(connection);

var TravellerdetailSchema = new Schema({
    id_traveller: { type: String },
    id_booking: {
        type: Schema.Types.ObjectId,
        ref: 'Booking'
    },
    traveller_name: { type: String },
    traveller_age: { type: Number },
    traveller_identity: { type: String }
});

module.exports = mongoose.model('Travellerdetail', TravellerdetailSchema);