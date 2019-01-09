var User = require('../models/user');
var Provider = require('../models/provider');
var Trip = require('../models/trip');
var jwt = require('jsonwebtoken');
var { secret } = require('../config/index');
var ImageSaver = require('image-saver-nodejs/lib');
var multer = require('multer');
var Booking = require('../models/booking');
var Billing = require('../models/billing');
var Promo = require('../models/promo');
var Expire = require('../models/booking_expire');
var Status = require('../models/status_trip');
var Provider_balance = require('../models/provider_balance');
var moment = require('moment');
var fs = require('fs');
var pdf = require('dynamic-html-pdf');
var ejs = require('ejs');
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var hbs = require('nodemailer-express-handlebars');
var Blob = require('blob');
var async = require('async');

var options = {
    auth: {
        api_user: 'travinesia',
        api_key: 'travinesia123'
    }
}

var client = nodemailer.createTransport(sgTransport(options));

client.use('compile', hbs({
    viewPath: './views/email/',
    extName: '.hbs'
}));

var addBooking = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else {
            Trip.findOne({ _id: req.body._id, valid: 1, flag_deleted: false }, function(err, trip) {
                if (!trip) {
                    res.send({ status: 404, success: false, message: 'Trip not availabe!' });
                } else {
                    if (req.body.startDate_trip == null || req.body.startDate_trip == '') {
                        res.json({ status: 400, success: false, message: 'Please choose your date for trip!' });
                    } else {
                        Provider.findOne({ _id: trip.provider }, function(err, providerid) {
                            if (!providerid) {
                                res.send({ status: 404, success: false, message: 'Provider Not Found' });
                            } else if (providerid.user.equals(req.user_id)) {
                                res.send({ status: 400, success: false, message: 'Cannot Booking  your own Trip!' });
                            } else {
                                if (req.body.flag_type_trip == 1) {
                                    var startDate = req.body.startDate_trip;
                                    var sisa_quota;
                                    var price;
                                    var publish;
                                    for (i = 0; i < trip.date_trip.length; i++) {
                                        if (moment(trip.date_trip[i]).isSame(startDate, 'day')) {
                                            sisa_quota = trip.quota_left[i];
                                            if (trip.flag_discount == 1) {
                                                price = trip.publish_price * ((100 - trip.discount_date[i]) / 100);
                                                publish = price;
                                            } else {
                                                price = trip.publish_price;
                                                publish = price;
                                            }
                                        } else {
                                            trip.quota_left[i] = trip.quota_left[i]
                                        }
                                    }
                                    if (sisa_quota < req.body.quantity) {
                                        res.send({ status: 400, success: false, message: 'Quota trip is not enough' });
                                    } else if (sisa_quota >= req.body.quantity && publish == req.body.publish_price) {
                                        var quota_trip_left = sisa_quota - req.body.quantity;
                                        for (i = 0; i < trip.date_trip.length; i++) {
                                            if (moment(trip.date_trip[i]).isSame(startDate, 'day')) {
                                                trip.quota_left[i] = quota_trip_left;
                                            } else {
                                                trip.quota_left[i] = trip.quota_left[i]
                                            }
                                        }
                                        Trip.updateOne({ _id: trip._id }, { $set: { 'quota_left': trip.quota_left } }, function(err, data) {
                                            if (err) {
                                                res.status(500).send(err)
                                            } else if (req.body.quantity == null || req.body.quantity == '') {
                                                res.json({ status: 400, success: false, message: 'Please input your quantity for booking!' });
                                            } else {
                                                var date_now = new Date().getTime();
                                                var compare_date = moment(date_now).add(2, 'hours');
                                                new Booking({
                                                    id_user: user._id,
                                                    id_trip: req.body._id,
                                                    id_provider: trip.provider,
                                                    startDate_trip: startDate,
                                                    endDate_trip: moment(req.body.startDate_trip, "YYYY-MM-DD").add(trip.days, 'day'),
                                                    publish_price: publish,
                                                    fixed_price: publish * 0.95,
                                                    quantity: req.body.quantity,
                                                    id_type_trip: req.body.id_type_trip,
                                                    deletion_date: compare_date
                                                }).save(function(err, booking) {
                                                    if (err) console.log('Add booking err:', err);
                                                    else {
                                                        var expire = new Expire();
                                                        expire.booking_expire = booking._id;
                                                        expire.save(function(err, booking_expire) {
                                                            if (err) {
                                                                res.status(500).send(err)
                                                            } else {
                                                                Booking.findById(booking._id)
                                                                    .populate({
                                                                        path: "id_trip id_type_trip id_user",
                                                                        select: 'trip_name type_trip category id_province provider rate_div rate_total days night photo_trip fixed_price name email telephone',
                                                                        populate: {
                                                                            path: "provider",
                                                                            select: 'travel_name'
                                                                        }
                                                                    })
                                                                    .exec(function(err, data) {
                                                                        if (err) {
                                                                            console.log('Add booking err:', err);
                                                                        } else {
                                                                            res.json({ status: 200, success: true, message: 'Add Booking Success', data: data });
                                                                        }
                                                                    });
                                                            }
                                                        })
                                                    }
                                                });
                                            }
                                        });
                                    } else {
                                        res.send({ status: 403, success: false, message: "Forbidden Access!" })
                                    }
                                } else if (req.body.flag_type_trip == 2) {
                                    if (req.body.quantity == null || req.body.quantity == '') {
                                        res.json({ status: 400, success: false, message: 'Please input your quantity for booking!' });
                                    } else {
                                        var compare_price;
                                        var flag_checked = true;
                                        for (var i = 0; i < trip.min_qty_group.length; i++) {
                                            if (req.body.quantity >= trip.min_qty_group[i] && trip.min_qty_group[i] != "" && trip.min_qty_group[i] != null) {
                                                compare_price = trip.publish_price_group[i];
                                                flag_checked = false;
                                            }
                                        }
                                        if (flag_checked == true) {
                                            compare_price = trip.publish_price;
                                        }
                                        if (req.body.publish_price == compare_price) {
                                            var date_now = new Date().getTime();
                                            var compare_date = moment(date_now).add(2, 'hours');
                                            new Booking({
                                                id_user: user._id,
                                                id_trip: req.body._id,
                                                id_provider: trip.provider,
                                                startDate_trip: req.body.startDate_trip,
                                                endDate_trip: moment(req.body.startDate_trip, "YYYY-MM-DD").add(trip.days, 'day'),
                                                publish_price: req.body.publish_price,
                                                fixed_price: req.body.publish_price * 0.95,
                                                quantity: req.body.quantity,
                                                id_type_trip: req.body.id_type_trip,
                                                deletion_date: compare_date
                                            }).save(function(err, booking) {
                                                if (err) console.log('Add booking err:', err);
                                                else {
                                                    Booking.findById(booking._id)
                                                        .populate({
                                                            path: "id_trip id_type_trip id_user",
                                                            select: 'trip_name type_trip category id_province provider rate_div rate_total days night photo_trip fixed_price name email telephone',
                                                            populate: {
                                                                path: "provider",
                                                                select: 'travel_name'
                                                            }
                                                        })
                                                        .exec(function(err, data) {
                                                            if (err) {
                                                                console.log('Add booking err:', err);
                                                            } else {
                                                                res.json({ status: 200, success: true, message: 'Add Booking Success', data: data });
                                                            }
                                                        });
                                                }
                                            });
                                        } else {
                                            res.send({ status: 403, success: false, message: "Forbidden Access!" })
                                        }
                                    }
                                }
                            }
                        })
                    }
                }
            });
        }
    });
}

var postDetailbooking = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else {
            Booking.findById(req.body._id, function(err, booking) {
                if (!booking) {
                    res.send({ status: 404, success: false, message: 'Booking not found!' });
                } else if (req.body.uniq_code < 1000) {
                    if (req.body.id_promo == '') {
                        booking.id_promo = null;
                        booking.order_name = req.body.order_name;
                        booking.order_email = req.body.order_email;
                        booking.order_telephone = req.body.order_telephone;
                        booking.notes_for_provider = req.body.notes;
                        booking.flag_asuransi = req.body.flag_asuransi || booking.flag_asuransi;
                        var total_asuransi = req.body.asuransi_price * booking.quantity;
                        var total_publish = booking.publish_price * booking.quantity;
                        booking.asuransi_price = total_asuransi;
                        booking.flag_promo = req.body.flag_promo || booking.flag_promo;
                        booking.promo_fee = req.body.promo_fee;
                        booking.uniq_code = req.body.uniq_code;
                        booking.coded_amount = total_publish + booking.asuransi_price - booking.promo_fee - booking.uniq_code;
                        booking.save(function(err, result) {
                            if (err) {
                                res.status(500).send(err)
                            } else {
                                Booking.findById(result._id)
                                    .select('startDate_trip endDate_trip quantity order_name order_email order_telephone publish_price uniq_code asuransi_price promo_fee coded_amount id_trip deletion_date')
                                    .populate({
                                        path: "id_trip",
                                        select: 'trip_name'
                                    })
                                    .exec(function(err, data) {
                                        if (err) {
                                            console.log('Add detail booking err:', err);
                                        } else {
                                            res.json({ status: 200, success: true, message: 'Add Detail Booking Success', data: data });
                                        }
                                    });
                            }
                        });
                    } else {
                        var compare_price
                        Promo.findOne({ _id: req.body.id_promo }, function(err, promo_trip) {
                            if (err) {
                                res.status(500).send(err)
                            } else {
                                if (promo_trip.type == 1) {
                                    compare_price = booking.publish_price * booking.quantity * (promo_trip.discount_amount / 100);
                                } else {
                                    compare_price = promo_trip.reduced_fee;
                                }
                            }
                            booking.id_promo = req.body.id_promo;
                            if (req.body.promo_fee == compare_price) {
                                booking.order_name = req.body.order_name;
                                booking.order_email = req.body.order_email;
                                booking.order_telephone = req.body.order_telephone;
                                booking.notes_for_provider = req.body.notes;
                                booking.flag_asuransi = req.body.flag_asuransi || booking.flag_asuransi;
                                var total_asuransi = req.body.asuransi_price * booking.quantity;
                                var total_publish = booking.publish_price * booking.quantity;
                                booking.asuransi_price = total_asuransi;
                                booking.flag_promo = req.body.flag_promo || booking.flag_promo;
                                booking.promo_fee = req.body.promo_fee;
                                booking.uniq_code = req.body.uniq_code;
                                booking.coded_amount = total_publish + booking.asuransi_price - booking.promo_fee - booking.uniq_code;
                                booking.save(function(err, result) {
                                    if (err) {
                                        res.status(500).send(err)
                                    } else {
                                        Booking.findById(result._id)
                                            .select('startDate_trip endDate_trip quantity order_name order_email order_telephone publish_price uniq_code asuransi_price promo_fee coded_amount id_trip deletion_date')
                                            .populate({
                                                path: "id_trip",
                                                select: 'trip_name'
                                            })
                                            .exec(function(err, data) {
                                                if (err) {
                                                    console.log('Add detail booking err:', err);
                                                } else {
                                                    res.json({ status: 200, success: true, message: 'Add Detail Booking Success', data: data });
                                                }
                                            });
                                    }
                                });
                            } else {
                                res.send({ status: 403, success: false, message: "Forbidden Access" })
                            }
                        })
                    }
                } else {
                    res.send({ status: 403, success: false, message: "Forbidden Access" })
                }
            });

        }
    });
}

var checkPromo = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else {
            var code = new RegExp(req.body.code, "i");
            var date_now = moment(new Date()).format('YYYY-MM-DD');
            Promo.findOne({ promo_code: code }, function(err, promo) {
                if (err) {
                    res.status(500).send(err)
                } else if (!promo) {
                    res.send({ status: 404, success: false, message: 'Promo not found!' });
                } else {
                    var valid_date = moment(promo.validity_date).subtract(1, 'days');
                    var expire_date = moment(promo.expiration_date).add(1, 'days');
                    if (moment(date_now).isBetween(valid_date, expire_date, 'day')) {
                        if (req.body.publish_price >= promo.min_price) {
                            if (promo.promo_category == 1) {
                                var category = req.body.id_category;
                                if (promo.by_category.equals(category)) {
                                    if (promo.type == 1) {
                                        var discount = (req.body.publish_price * promo.discount_amount) / 100;
                                        res.json({ status: 200, success: true, message: 'Get Promo Success', data: [{ _id: promo._id, type_promo: promo.type, reduce: discount }] });
                                    } else {
                                        res.json({ status: 200, success: true, message: 'Get Promo Success', data: [{ _id: promo._id, type_promo: promo.type, reduce: promo.reduced_fee }] });
                                    }
                                } else {
                                    res.send({ status: 400, success: false, message: 'Promo not valid! terms and Conditions apply!' });
                                }
                            } else if (promo.promo_category == 2) {
                                var location = req.body.id_province;
                                if (promo.by_location.equals(location)) {
                                    if (promo.type == 1) {
                                        var discount = (req.body.publish_price * promo.discount_amount) / 100;
                                        res.json({ status: 200, success: true, message: 'Get Promo Success', data: [{ _id: promo._id, type_promo: promo.type, reduce: discount }] });
                                    } else {
                                        res.json({ status: 200, success: true, message: 'Get Promo Success', data: [{ _id: promo._id, type_promo: promo.type, reduce: promo.reduced_fee }] });
                                    }
                                } else {
                                    res.send({ status: 400, success: false, message: 'Promo not valid! terms and Conditions apply!' });
                                }
                            }
                        } else {
                            res.send({ status: 400, success: false, message: 'Promo not valid! terms and Conditions apply!' });
                        }
                    } else {
                        res.send({ status: 400, success: false, message: 'Promo not valid!' });
                    }
                }
            })
        }
    })
}

var addPaymentbooking = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else {
            Booking.findById(req.body._id, function(err, booking) {
                if (!booking) {
                    res.send({ status: 404, success: false, message: 'Booking not found!' });
                } else {
                    var status_payment = 1;
                    Status.findOne({ 'id_status': status_payment }, function(err, status) {
                        if (err) {
                            res.status(500).send(err)
                        } else {
                            if (req.body.id_paymentMethod == null || req.body.id_paymentMethod == '' || req.body.id_typePayment == null || req.body.id_typePayment == '') {
                                res.json({ status: 400, success: false, message: 'Please Chose your payment method for booking!' });
                            } else {
                                var statusPayment = mongoose.Types.ObjectId("5b8d076528b9dcb79744049a");
                                booking.admin_fee = req.body.admin_fee;
                                booking.no_booking = req.body.no_booking;
                                booking.id_paymentMethod = req.body.id_paymentMethod;
                                booking.id_typePayment = req.body.id_typePayment;
                                booking.id_statusTrip = status._id;
                                booking.id_statusPayment = statusPayment;
                                booking.coded_amount = booking.coded_amount + booking.admin_fee;
                                booking.date_pay = new Date().getTime();
                                booking.flag_checkout = true;
                                booking.save(function(err, data) {
                                    if (err) {
                                        res.status(500).send(err)
                                    } else {
                                        Booking.findById(booking._id)
                                            //.select('id_paymentMethod id_typePayment flag_expired coded_amount no_booking')
                                            .populate('id_trip id_paymentMethod id_typePayment')
                                            .exec(function(err, data) {
                                                if (err) console.log('Add payment booking err:', err);
                                                else {
                                                    User.findById(booking.id_user, function(err, user_email) {
                                                        if (err) {
                                                            res.status(500).send(err)
                                                        } else {
                                                            Provider.findById(booking.id_provider, function(err, provider) {
                                                                if (err) {
                                                                    res.status(500).send(err)
                                                                } else {
                                                                    User.findById(provider.user, function(err, provider_email) {
                                                                        var expire_date = moment(booking.deletion_date).locale('id').format('dddd, D MMMM YYYY');
                                                                        var date_pay_trip = moment(booking.date_pay).locale('id').format('dddd, D MMMM YYYY');
                                                                        var start_date = moment(booking.startDate_trip).locale('id').format('dddd, D MMMM YYYY');
                                                                        var expire_date_time = moment(booking.deletion_date).locale('id').format('LT');
                                                                        var email = {
                                                                            from: 'Travinesia, admin@Travinesia.com',
                                                                            subject: 'Pembayaran Trip'
                                                                        };
                                                                        var toEmail = [booking.order_email, provider_email.email];
                                                                        var toTemplate = ['pembayaran_bank_compiled', 'provider_pesanan_masuk_compiled'];
                                                                        var toContext = [{
                                                                                booking: data,
                                                                                expire_date: expire_date,
                                                                                expire_date_time: expire_date_time,
                                                                                user_name: user_email.name,
                                                                                img: "https://img.travinesia.com/logo/travinesia.png"
                                                                            },
                                                                            {
                                                                                booking: data,
                                                                                user_name: user_email.name,
                                                                                date_pay_trip: date_pay_trip,
                                                                                start_date: start_date,
                                                                                img: "https://img.travinesia.com/logo/travinesia.png"
                                                                            }
                                                                        ]
                                                                        async.forEachLimit(toEmail, 1, function(email_user, callback) {
                                                                            email["to"] = email_user;
                                                                            async.forEachLimit(toTemplate, 1, function(template_email, callback) {
                                                                                email["template"] = template_email;
                                                                                async.forEachLimit(toContext, 1, function(context_email, callback) {
                                                                                    email["context"] = context_email;
                                                                                })
                                                                                client.sendMail(email, function(error, response) {
                                                                                    if (error) {
                                                                                        console.log(error);
                                                                                    } else {
                                                                                        console.log("Message sent: " + response.message);
                                                                                    }
                                                                                    callback();
                                                                                });
                                                                            });
                                                                        });
                                                                        res.json({ status: 200, success: true, message: 'Add Payment Booking Success', data: data });
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    })


                                                }
                                            });
                                    }
                                });
                            }
                        }
                    })
                }
            });
        }
    });
}

var getDetailPayment = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else {
            Booking.findById(req.params.id)
                .select('id_paymentMethod id_typePayment flag_expired coded_amount no_booking deletion_date trx_id')
                .populate('id_paymentMethod id_typePayment')
                .exec(function(err, booking) {
                    if (!booking) {
                        res.send({ status: 404, success: false, message: 'Booking not found!' });
                    } else {
                        res.json({ status: 200, success: true, message: 'Get Detail Payment Booking Success', data: booking });
                    }
                })
        }
    })
}

var updateStatuspayment = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else {
            Booking.findById(req.body._id, function(err, booking) {
                if (!booking) {
                    res.send({ status: 404, message: 'Belum ada transaksi' });
                } else {
                    Status.findById(booking.id_statusTrip, function(err, status) {
                        var updatestatus = req.body.id_statusTrip;
                        if (!status) {
                            res.send({ status: 404, message: 'Status Not Found' });
                        } else if (status.id_status != updatestatus - 1) {
                            res.send({ status: 404, message: 'Forbidden!', data: booking });
                        } else {
                            Status.findOne({ 'id_status': updatestatus }, function(err, id_status) {
                                if (err) {
                                    console.log('Add payment booking err:', err);
                                } else {
                                    booking.id_statusTrip = id_status._id;
                                    booking.save(function(err, result) {
                                        if (err) {
                                            res.status(500).send(err)
                                        } else {
                                            res.send({ status: 200, message: 'Status changed!', data: result });
                                        }
                                    });
                                }
                            });
                        }
                    })
                }
            });
        }
    });
}

var addTravellerdetail = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else {
            var booking_id = req.body._id;
            Booking.findById(booking_id, function(err, booking) {
                if (!booking) {
                    res.send({ status: 404, success: false, message: 'Belum ada transaksi' });
                } else if (req.body.save_status == 0) {
                    for (var i = 0; i < booking.quantity; i++) {
                        if (req.body.traveller_name[i] != '') {
                            booking.traveller_name[i] = req.body.traveller_name[i];
                        } else if (req.body.traveller_name[i] == '' || req.body.traveller_name[i] == null) {
                            console.log("Masuk")
                            booking.traveller_name[i] = null;
                        }
                        if (req.body.traveller_age[i] != '') {
                            booking.traveller_age[i] = req.body.traveller_age[i];
                        } else if (req.body.traveller_age[i] == '' || req.body.traveller_age[i] == null) {
                            booking.traveller_age[i] = null;
                        }
                        if (req.body.traveller_identity[i] != '') {
                            booking.traveller_identity[i] = req.body.traveller_identity[i];
                        } else if (req.body.traveller_identity[i] == '' || req.body.traveller_identity[i] == null) {
                            booking.traveller_identity[i] = null;
                        }
                    }
                    Booking.updateOne({ _id: booking._id }, {
                        $set: {
                            'traveller_name': booking.traveller_name,
                            'traveller_age': booking.traveller_age,
                            'traveller_identity': booking.traveller_identity
                        }
                    }, function(err, data_traveller) {
                        if (err) {
                            res.status(500).send(err)
                        } else {
                            res.send({ status: 200, success: true, message: 'Data saved!' });
                        }
                    });
                } else if (req.body.save_status == 1) {
                    Status.findById(booking.id_statusTrip, function(err, status) {
                        var updatestatus = 4;
                        if (!status) {
                            res.send({ status: 404, success: false, message: 'Status Not Found' });
                        } else if (status.id_status != updatestatus - 1) {
                            res.send({ status: 400, success: false, message: 'Forbidden!', data: booking });
                        } else {
                            Status.findOne({ 'id_status': updatestatus }, function(err, id_status) {
                                if (err) {
                                    console.log('Add traveller detail booking err:', err);
                                } else {
                                    for (var i = 0; i < booking.quantity; i++) {
                                        if (req.body.traveller_name[i] != '') {
                                            booking.traveller_name[i] = req.body.traveller_name[i];
                                        } else if (req.body.traveller_name == '' || req.body.traveller_name == null) {
                                            booking.traveller_name[i] = booking.traveller_name[i];
                                        }
                                        if (req.body.traveller_age[i] != '') {
                                            booking.traveller_age[i] = req.body.traveller_age[i];
                                        } else if (req.body.traveller_age == '' || req.body.traveller_age == null) {
                                            booking.traveller_age[i] = booking.traveller_age[i];
                                        }
                                        if (req.body.traveller_identity[i] != '') {
                                            booking.traveller_identity[i] = req.body.traveller_identity[i];
                                        } else if (req.body.traveller_identity == '' || req.body.traveller_identity == null) {
                                            booking.traveller_identity[i] = booking.traveller_identity[i];
                                        }
                                    }
                                    var length_name = req.body.traveller_name.length;
                                    var length_age = req.body.traveller_age.length;
                                    var length_identity = req.body.traveller_identity.length;
                                    if (length_name != booking.quantity) {
                                        res.send({ status: 400, message: 'Complete participant data' });
                                    } else if (length_age != booking.quantity) {
                                        res.send({ status: 400, message: 'Complete participant data' });
                                    } else if (length_identity != booking.quantity) {
                                        res.send({ status: 400, message: 'Complete participant data' });
                                    } else {
                                        Booking.updateOne({ _id: booking._id }, {
                                            $set: {
                                                'id_statusTrip': id_status._id,
                                                'traveller_name': booking.traveller_name,
                                                'traveller_age': booking.traveller_age,
                                                'traveller_identity': booking.traveller_identity
                                            }
                                        }, function(err, data_traveller) {
                                            if (err) {
                                                res.status(500).send(err)
                                            } else {
                                                Booking.findById(booking._id)
                                                    .select('startDate_trip no_booking quantity traveller_name traveller_age traveller_identity id_trip id_provider id_statusTrip')
                                                    .populate({
                                                        path: "id_trip id_provider id_statusTrip",
                                                        select: 'id_type_trip trip_name meeting_point time zone_time days night travel_name office_phone_number',
                                                        populate: {
                                                            path: "id_type_trip",
                                                            model: "Typetrip",
                                                            select: 'type_trip'
                                                        }
                                                    })
                                                    .exec(function(err, data) {
                                                        if (err) {
                                                            res.status(500).send(err)
                                                        } else {
                                                            var booking_name = data.traveller_name;
                                                            var booking_age = data.traveller_age;
                                                            var booking_identity = data.traveller_identity;
                                                            var booking_date = moment(data.startDate_trip).format('dddd, D MMMM YYYY');
                                                            var compiled = fs.readFileSync('./views/e-ticket.html', 'utf8');
                                                            var out = "";
                                                            for (var i = 0; i < data.quantity; i++) {
                                                                out = out + "<tr> <td>" + booking_name[i] + "</td>";
                                                                out = out + "<td>" + booking_age[i] + "</td>";
                                                                out = out + "<td>" + booking_identity[i] + "</td> </tr>";
                                                            }
                                                            var document = {
                                                                type: 'buffer',
                                                                template: compiled,
                                                                context: {
                                                                    booking: data,
                                                                    booking_date: booking_date,
                                                                    out: out,
                                                                    img: "https://img.travinesia.com/logo/travinesia.png"
                                                                }
                                                            };
                                                            pdf.create(document, config)
                                                                .then(file => {
                                                                    var booking_date = moment(data.startDate_trip).format('dddd, D MMMM YYYY');
                                                                    var email = {
                                                                        from: 'Travinesia, admin@Travinesia.com',
                                                                        to: booking.order_email,
                                                                        subject: 'E-ticket Trip',
                                                                        template: 'eticket_email_compiled',
                                                                        context: {
                                                                            data: data,
                                                                            booking_date: booking_date,
                                                                            img: "https://img.travinesia.com/logo/travinesia.png"
                                                                        },
                                                                        attachments: [{
                                                                            filename: 'eticket.pdf',
                                                                            content: new Buffer(file, 'base64'),
                                                                            contentType: 'application/pdf'
                                                                        }]
                                                                    };
                                                                    client.sendMail(email, function(err, info) {
                                                                        if (err) {
                                                                            console.log(err);
                                                                        } else {
                                                                            console.log('Message sent: ' + info.response);
                                                                        }
                                                                    });
                                                                    res.send({ status: 200, success: true, message: 'Status changed and Data saved! and check your email to download eticket', data: data });
                                                                })
                                                                .catch(error => {
                                                                    console.error(error);
                                                                })
                                                        }
                                                    })
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    })
                }
            });
        }
    });
}

var config = {
    format: "A4",
    orientation: "portrait",
    border: "10mm"
}

var geteTicketTraveller = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            return res.send(err);
        } else if (!user) {
            res.json({ status: 402, message: err, data: "User not found!" });
        } else {
            Booking.findById(req.params._id)
                .select('startDate_trip no_booking quantity order_email traveller_name traveller_age traveller_identity id_trip id_provider id_type_trip id_statusTrip')
                .populate({
                    path: "id_trip id_provider id_statusTrip",
                    select: 'id_type_trip trip_name meeting_point time zone_time days night travel_name office_phone_number',
                    populate: {
                        path: "id_type_trip",
                        model: "Typetrip",
                        select: 'type_trip'
                    }
                })
                .exec(function(err, booking) {
                    if (!booking) {
                        res.json({ status: 402, message: err, data: "Booking not found!" });
                    } else {
                        Status.findById(booking.id_statusTrip, function(err, status) {
                            if (err) {
                                return res.send(err);
                            } else if (status.id_status != 4) {
                                res.send({ status: 404, message: 'Forbidden!', data: booking });
                            } else if (status.id_status == 4) {
                                var booking_name = booking.traveller_name;
                                var booking_age = booking.traveller_age;
                                var booking_identity = booking.traveller_identity;
                                var booking_date = moment(booking.startDate_trip).format('dddd, D MMMM YYYY');
                                var compiled = fs.readFileSync('./views/e-ticket.html', 'utf8');
                                var out = "";
                                for (var i = 0; i < booking.quantity; i++) {
                                    out = out + "<tr> <td>" + booking_name[i] + "</td>";
                                    out = out + "<td>" + booking_age[i] + "</td>";
                                    out = out + "<td>" + booking_identity[i] + "</td> </tr>";
                                }
                                //console.log(out);
                                var document = {
                                    type: 'buffer',
                                    template: compiled,
                                    context: {
                                        booking: booking,
                                        booking_date: booking_date,
                                        out: out,
                                        img: "https://img.travinesia.com/logo/travinesia.png"
                                    },
                                    //path: '../e-ticket.pdf'
                                };
                                pdf.create(document, config)
                                    .then(file => {
                                        var buffer = Buffer.from(file);
                                        var booking_date = moment(booking.startDate_trip).format('dddd, D MMMM YYYY');
                                        var email = {
                                            from: 'Travinesia, admin@Travinesia.com',
                                            to: booking.order_email,
                                            subject: 'E-ticket Trip',
                                            template: 'eticket_email_compiled',
                                            context: {
                                                data: booking,
                                                booking_date: booking_date,
                                                img: "https://img.travinesia.com/logo/travinesia.png"
                                            },
                                            attachments: [{
                                                filename: 'eticket.pdf',
                                                content: new Buffer(file, 'base64'),
                                                contentType: 'application/pdf'
                                            }]
                                        };
                                        client.sendMail(email, function(err, info) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                console.log('Message sent: ' + info.response);
                                            }
                                        });
                                        res.send(buffer);
                                    })
                                    .catch(error => {
                                        console.error(error);
                                    })

                            }
                        })
                    }
                });
        }
    });
}

var confirmationBookMepo = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            return res.send(err);
        } else if (!user) {
            res.json({ status: 404, success: false, message: "User not found!" });
        } else {
            Booking.findById(req.body._id, function(err, booking) {
                if (!booking) {
                    res.json({ status: 404, success: false, message: "Booking not found!" });
                } else {
                    Status.findById(booking.id_statusTrip, function(err, status) {
                        if (err) {
                            return res.send(err);
                        } else if (status.id_status != 5) {
                            res.send({ status: 400, message: 'Forbidden!', data: booking });
                        } else if (status.id_status == 5) {
                            var date_now = new Date().getTime();
                            if (moment(booking.startDate_trip).isSame(date_now, 'day')) {
                                var update_status = 6;
                                if (status.id_status != update_status - 1) {
                                    res.send({ status: 400, message: 'Forbidden!', data: booking });
                                } else {
                                    Status.findOne({ 'id_status': update_status }, function(err, id_status) {
                                        if (err) {
                                            console.log('Confirmation booking err:', err);
                                        } else {
                                            booking.id_statusTrip = id_status._id;
                                            booking.save(function(err, result) {
                                                if (err) {
                                                    res.status(500).send(err)
                                                } else {
                                                    var id_trip = mongoose.Types.ObjectId(booking.id_trip);
                                                    Provider.findOne({ trips: id_trip }, function(err, provider) {
                                                        if (err) {
                                                            res.status(500).send(err)
                                                        } else if (!provider) {
                                                            res.json({ status: 404, success: false, message: "Booking not found!" });
                                                        } else {
                                                            var providerbalance = new Provider_balance();
                                                            providerbalance.id_provider = provider._id;
                                                            providerbalance.id_trip = booking.id_trip;
                                                            providerbalance.id_booking = booking._id;
                                                            providerbalance.fixed_payment = booking.fixed_price;
                                                            providerbalance.quantity = booking.quantity;
                                                            providerbalance.total_payment = booking.fixed_price * booking.quantity;
                                                            providerbalance.no_booking_payment = booking.no_booking;
                                                            providerbalance.balance_history = provider.balance + providerbalance.total_payment;
                                                            providerbalance.mutation_flag = true;
                                                            providerbalance.save(function(err, result) {
                                                                if (err) console.log('Add Confirmation booking err:', err);
                                                                else {
                                                                    var balance_now = provider.balance + providerbalance.total_payment;
                                                                    Provider.findByIdAndUpdate(provider._id, { $set: { 'balance': balance_now } }, function(err, trip_update) {
                                                                        if (err) console.log('Add Confirmation booking err:', err);
                                                                        else {
                                                                            res.send({ status: 200, success: true, message: 'Confimartion Booking Meeting Point Success' });
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    })
                                                }
                                            });
                                        }
                                    });
                                }
                            } else {
                                res.send({ status: 400, message: 'Forbidden!', data: booking });
                            }
                        }
                    });
                }
            });

        }
    });
}

var getBookinguser = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            return res.send(err);
        } else if (!user) {
            res.json({ status: 404, success: false, message: "User not found!" });
        } else {
            var id_status_8 = mongoose.Types.ObjectId("5b8d069828b9dcb797440103");
            var id_status_9 = mongoose.Types.ObjectId("5b8d06c628b9dcb7974401d9");
            Booking.find({ "id_statusTrip": { $nin: [id_status_8, id_status_9] }, "flag_checkout": true, "id_user": req.user_id })
                .select('_id startDate_trip endDate_trip deletion_date id_statusTrip trx_id no_booking coded_amount id_trip quantity notes_for_provider traveller_name traveller_age traveller_identity')
                .populate({
                    path: "id_type_trip id_trip id_provider id_statusTrip",
                    select: 'type_trip travel_name office_phone_number trip_name photo_trip days night notes_traveler notes_meeting_point latitude longitude id_status status_trip meeting_point time zone_time direction'
                })
                .exec(function(err, booking_user) {
                    if (err) {
                        return res.send(err);
                    } else {
                        res.json({ status: 200, success: true, message: "Get Booking User Success", data: booking_user });
                    }
                })
        }
    })
}

var getHistorybooking = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            return res.send(err);
        } else if (!user) {
            res.json({ status: 404, success: false, message: "User not found!" });
        } else {
            var id_status_8 = mongoose.Types.ObjectId("5b8d069828b9dcb797440103");
            var id_status_9 = mongoose.Types.ObjectId("5b8d06c628b9dcb7974401d9");
            Booking.find({ "id_statusTrip": { $in: [id_status_8, id_status_9] }, "id_user": req.user_id })
                .select('_id startDate_trip endDate_trip id_statusTrip no_booking coded_amount id_trip quantity notes_for_provider traveller_name traveller_age traveller_identity')
                .populate({
                    path: "id_type_trip id_trip id_provider id_statusTrip",
                    select: 'type_trip travel_name trip_name photo_trip days night notes_traveler notes_meeting_point latitude longitude id_status status_trip meeting_point time zone_time'
                })
                .exec(function(err, booking_user) {
                    if (err) {
                        return res.send(err);
                    } else {
                        res.json({ status: 200, success: true, message: "Get History Booking User Success", data: booking_user });
                    }
                })
        }
    })
}

var deleteFinishedbooking = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            return res.send(err);
        } else if (!user) {
            res.json({ status: 404, success: false, message: "User not found!" });
        } else {
            var id_status_8 = mongoose.Types.ObjectId("5b8d069828b9dcb797440103");
            var id_status_9 = mongoose.Types.ObjectId("5b8d06c628b9dcb7974401d9");
            Booking.findOne({ _id: req.body._id }, function(err, booking) {
                if (err) {
                    return res.send(err);
                } else if (!booking) {
                    res.json({ status: 404, success: false, message: "Booking not found!" });
                } else if (booking.id_statusTrip.equals(id_status_8) || booking.id_statusTrip.equals(id_status_9)) {
                    Booking.findByIdAndRemove(req.body._id, function(err, booking_delete) {
                        if (err) {
                            return res.send(err);
                        } else {
                            res.json({ status: 200, success: true, message: "Delete Booking Success" });
                        }
                    })
                } else {
                    res.json({ status: 400, success: false, message: "Booking Cannot Remove!" });
                }
            });
        }
    })
}

var getDetailBooking = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            return res.send(err);
        } else if (!user) {
            res.json({ status: 404, success: false, message: "User not found!" });
        } else {
            Booking.findById(req.params.id_booking, function(err, booking) {
                if (!booking) {
                    res.json({ status: 404, success: false, message: "Booking not found!" });
                } else {
                    Booking.findById(booking._id)
                        .select('_id startDate_trip endDate_trip no_booking id_trip coded_amount id_statusTrip notes_for_provider quantity')
                        .populate({
                            path: "id_trip id_statusTrip",
                            select: 'trip_name id_type_trip days night latitude longitude meeting_point time zone_time provider status_trip',
                            populate: {
                                path: "id_type_trip",
                                select: 'type_trip'
                            }
                        })
                        .exec(function(err, data) {
                            if (err) {
                                return res.send(err);
                            } else if (booking) {
                                res.send({ status: 200, success: true, message: 'Booking Detail!', data: data })
                            }
                        })
                }
            })
        }
    });
}


module.exports = {
    addBooking: addBooking,
    postDetailbooking: postDetailbooking,
    checkPromo: checkPromo,
    addPaymentbooking: addPaymentbooking,
    updateStatuspayment: updateStatuspayment,
    addTravellerdetail: addTravellerdetail,
    geteTicketTraveller: geteTicketTraveller,
    confirmationBookMepo: confirmationBookMepo,
    getBookinguser: getBookinguser,
    getHistorybooking: getHistorybooking,
    getDetailBooking: getDetailBooking,
    getBookinguser: getBookinguser,
    getHistorybooking: getHistorybooking,
    getDetailPayment: getDetailPayment,
    deleteFinishedbooking: deleteFinishedbooking
}