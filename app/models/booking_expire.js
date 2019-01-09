var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var BookingexpireSchema = new Schema({
    booking_expire: {
        type: Schema.Types.ObjectId,
        ref: 'Booking'
    },
    deletionDate: {
        type: Date,
        default: function() { return new Date(Date.now() + 1000 * 60 * 10); }
    },
})
module.exports = mongoose.model('Bookingexpire', BookingexpireSchema);