var User = require('../models/user');
var Payment = require('../models/payment_method');
var Billing = require('../models/billing');
var Booking = require('../models/booking');
var { secret } = require('../config/index');
var { user_faspay } = require('../config/index');
var { pass_faspay } = require('../config/index');
var { merchant_id_faspay } = require('../config/index');
var { merchant_name } = require('../config/index');
var request = require('request');
var md5 = require('md5');
var sha1 = require('sha1');



var addBilling = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            return res.send(err);
        } else if (!user) {
            res.json({ status: 404, success: false, message: "User not found!" });
        } else {
            Booking.findById(req.params.id, function(err, booking) {
                var billing = new Billing();
                var md5_signature = md5(user_faspay + pass_faspay + req.body.bill_no);
                var sha1_signature = sha1(md5_signature);
                billing.merchant_id = merchant_id_faspay;
                billing.merchant = merchant_name;
                billing.bill_no = req.body.bill_no;
                billing.bill_date = booking.created_at;
                billing.bill_expired = booking.deletion_date;
                billing.bill_desc = "Pembayaran Trip " + booking.no_booking;
                billing.bill_currency = "IDR";
                billing.bill_total = booking.coded_amount * 100;
                billing.cust_no = user.id_user;
                billing.cust_name = booking.order_name;
                billing.payment_channel = req.body.payment_channel;
                billing.pay_type = "1";
                billing.msisdn = booking.order_telephone;
                billing.email = booking.order_email;
                billing.terminal = 10;
                billing.item = [{
                    product: req.body.product,
                    qty: booking.quantity,
                    amount: booking.publish_price * 100,
                    payment_plan: 1,
                    merchant_id: merchant_id_faspay,
                    tenor: 00
                }];
                billing.signature = sha1_signature;
                console.log(billing)
                billing.save(function(err, data) {
                    if (err) {
                        res.status(500).send(err)
                    } else {
                        Billing.findOne({ _id: data._id }, { '_id': 0, 'id_billing': 0, '__v': 0 },
                            function(err, result) {
                                if (err) {
                                    res.status(500).send(err)
                                } else {
                                    request.post({
                                            method: 'POST',
                                            url: 'https://dev.faspay.co.id/cvr/300011/10',
                                            json: true,
                                            body: result,
                                            headers: { "Content-Type": 'application/json' }
                                        },
                                        function(err, httpResponse, body) {
                                            if (err) {
                                                console.log('error:', err);
                                            } else if (!err && httpResponse.statusCode === 200) {
                                                console.log('statusCode:', httpResponse && httpResponse.statusCode);
                                                console.log('body:', body);
                                                Booking.findByIdAndUpdate(req.params.id, { $set: { "trx_id": body.trx_id } }, function(err, booking_update) {
                                                    if (err) {
                                                        res.status(500).send(err)
                                                    } else {
                                                        res.send({ status: 200, body });
                                                    }
                                                })
                                            }
                                        });
                                }
                            })
                    }
                });
            })
        }
    })
}



module.exports = {
    addBilling: addBilling
}