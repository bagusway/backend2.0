var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TypepaymentSchema = new Schema({
    id_type_payment: { type: String },
    type_payment: { type: String },
    payment_method: [{
        type: Schema.Types.ObjectId,
        ref: 'Paymentmethod'
    }],
    pg_code: { type: Number }
});

module.exports = mongoose.model('Typepayment', TypepaymentSchema);