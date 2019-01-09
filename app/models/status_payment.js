var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var StatuspaymentSchema = new Schema({
    id_status_payment: { type: String, },
    payment_status: { type: String, }
});

module.exports = mongoose.model('Statuspayment', StatuspaymentSchema);