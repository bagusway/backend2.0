var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PaymentmethodSchema = new Schema({
    id_payment_method: { type: String, },
    id_type_payment: {
        type: Schema.Types.ObjectId,
        ref: 'Typepayment'
    },
    payment_method: { type: String, },
    photo_payment: { type: String },
    owner_name: { type: String },
    no_rek_owner: { type: String }
});

module.exports = mongoose.model('Paymentmethod', PaymentmethodSchema);