var mongoose = require('mongoose');
var User = require('../models/user');
var Trip = require('../models/trip');
var Provider = require('../models/provider');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var titlize = require('mongoose-title-case');
var validate = require('mongoose-validator');
var autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection("mongodb://localhost/backendtravinesia");

autoIncrement.initialize(connection);

var BookingSchema = new Schema({
    id_booking: { type: String },
    trx_id: { type: String },
    id_user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    id_type_trip: {
        type: Schema.Types.ObjectId,
        ref: 'Typetrip'
    },
    id_trip: {
        type: Schema.Types.ObjectId,
        ref: 'Trip'
    },
    id_paymentMethod: {
        type: Schema.Types.ObjectId,
        ref: 'Paymentmethod'
    },
    id_typePayment: {
        type: Schema.Types.ObjectId,
        ref: 'Typepayment'
    },
    id_statusPayment: {
        type: Schema.Types.ObjectId,
        ref: 'Statuspayment'
    },
    id_statusTrip: {
        type: Schema.Types.ObjectId,
        ref: 'Statustrip',
        default: '5b8d045a28b9dcb79743f73e'
    },
    id_promo: {
        type: Schema.Types.ObjectId,
        ref: 'Promo'
    },
    id_provider: {
        type: Schema.Types.ObjectId,
        ref: 'Provider'
    },
    no_booking: { type: String },
    transaction_code: { type: String },
    order_name: { type: String },
    order_email: { type: String },
    order_telephone: { type: String },
    quota_trip: { type: Number },
    quantity: { type: Number },
    flag_asuransi: { type: Boolean, default: false },
    flag_promo: { type: Boolean, default: false },
    flag_checkout: { type: Boolean, default: false },
    promo_fee: { type: Number },
    admin_fee: { type: Number },
    asuransi_price: { type: Number },
    notes_for_provider: { type: String },
    startDate_trip: { type: Date },
    endDate_trip: { type: Date },
    publish_price: { type: Number },
    fixed_price: { type: Number },
    uniq_code: { type: Number, required: true, default: 0 },
    coded_amount: { type: Number },
    date_pay: { type: Date },
    flag_expired: { type: Boolean, default: true },
    deletion_date: { type: Date },
    traveller_name: { type: [String] },
    traveller_age: { type: [String] },
    traveller_identity: { type: [String] },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

BookingSchema.plugin(autoIncrement.plugin, { model: 'Booking', field: 'id_booking', startAt: 1 });

module.exports = mongoose.model('Booking', BookingSchema);