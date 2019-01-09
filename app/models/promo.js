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

var PromoSchema = new Schema({
    id_promo: { type: String },
    promo_name: { type: String },
    photo_promo: { type: String },
    promo_code: { type: String },
    validity_date: { type: Date },
    expiration_date: { type: Date },
    type: { type: Number },
    discount_amount: { type: Number },
    reduced_fee: { type: Number },
    description: { type: String },
    min_price: { type: Number },
    promo_category: { type: Number },
    by_category: {
        type: Schema.Types.ObjectId,
        ref: 'Categorytrip'
    },
    by_location: {
        type: Schema.Types.ObjectId,
        ref: 'Province'
    },
    terms_conditions: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }

});
PromoSchema.plugin(autoIncrement.plugin, { model: 'Promo', field: 'id_promo', startAt: 1 });

module.exports = mongoose.model('Promo', PromoSchema);