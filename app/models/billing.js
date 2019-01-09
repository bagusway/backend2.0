var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection("mongodb://localhost/backendtravinesia");

autoIncrement.initialize(connection);

var BillingSchema = new Schema({
    id_billing: { type: String },
    request: { type: String, default: "Transmisi Info Detil Pembelian" },
    merchant_id: { type: Number },
    merchant: { type: String },
    bill_no: { type: String },
    bill_reff: { type: String },
    bill_date: { type: Date },
    bill_expired: { type: Date },
    bill_desc: { type: String },
    bill_currency: { type: String },
    bill_gross: { type: Number },
    bill_miscfee: { type: Number },
    bill_total: { type: Number },
    cust_no: { type: String },
    cust_name: { type: String },
    payment_channel: { type: Number },
    pay_type: { type: String },
    bank_userid: { type: String },
    msisdn: { type: Number },
    email: { type: String },
    terminal: { type: Number },
    billing_name: { type: String },
    billing_lastname: { type: String },
    billing_address: { type: String },
    billing_address_city: { type: String },
    billing_address_region: { type: String },
    billing_address_state: { type: String },
    billing_address_poscode: { type: String },
    billing_msisdn: { type: String },
    billing_address_country_code: { type: String },
    receiver_name_for_shipping: { type: String },
    shipping_lastname: { type: String },
    shipping_address: { type: String },
    shipping_address_city: { type: String },
    shipping_address_region: { type: String },
    shipping_address_state: { type: String },
    shipping_address_poscode: { type: String },
    shipping_msisdn: { type: String },
    shipping_address_country_code: { type: String },
    item: [{
        product: { type: String },
        qty: { type: String },
        amount: { type: Number },
        payment_plan: { type: Number },
        merchant_id: { type: Number },
        tenor: { type: Number }
    }],
    reserve1: { type: String },
    reserve2: { type: String },
    signature: { type: String }
});

BillingSchema.plugin(autoIncrement.plugin, { model: 'Billing', field: 'id_billing', startAt: 1 });

module.exports = mongoose.model('Billing', BillingSchema);