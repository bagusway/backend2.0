var User = require('../models/user');
var Trip = require('../models/trip');
var Booking = require('../models/booking');
var Billing = require('../models/billing');
var Provider = require('../models/provider');
var Expire = require('../models/booking_expire');
var Status = require('../models/status_trip');
var Payment = require('../models/status_payment');
var Discussion = require('../models/discussion/discussion');
var Review = require('../models/review');
var Withdraw = require('../models/withdraw');
var Promo = require('../models/promo');
var Providerbalance = require('../models/provider_balance');
var mongoose = require('mongoose');
var each = require('foreach');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var hbs = require('nodemailer-express-handlebars');
var moment = require('moment');
var ImageSaver = require('image-saver-nodejs/lib');
var async = require('async');
var fs = require('fs');

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

// Role 3 for Admin
var dashboardAdmin = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (user.role == 3) {
            User.count({}, function(err, user_count) {
                if (err) {
                    res.status(500).send(err)
                } else {
                    User.count({ 'role': 2 }, function(err, provider_count) {
                        if (err) {
                            res.status(500).send(err)
                        } else {
                            var id_status_7 = mongoose.Types.ObjectId("5b7536550730bd35ffbb2b92");
                            var id_status_8 = mongoose.Types.ObjectId("5b7536650730bd35ffbb2bd4");
                            Booking.count({ "id_statusTrip": { $in: [id_status_7, id_status_8] } }, function(err, booking_count) {
                                if (err) {
                                    res.status(500).send(err)
                                } else {
                                    Trip.count({}, function(err, trip_count) {
                                        res.json({ status: 200, message: 'Get Dashboard Admin Success', user_count, provider_count, booking_count, trip_count });
                                    })
                                }
                            })
                        }
                    })
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var getAllnewProvider = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Provider.find({ 'flag_active': false, 'flag_request': false })
                .select('user travel_name medsoc_account office_phone_number province')
                .populate({
                    path: "user province",
                    select: 'name province_name'
                })
                .exec(function(err, provider) {
                    if (err) {
                        res.status(500).send(err)
                    } else {
                        res.json({ status: 200, message: 'Get New Provider Success', provider });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var accProviderrequest = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Provider.findOne({ _id: req.body._id }, function(err, provider) {
                if (!provider) {
                    res.json({ status: 404, success: false, message: 'Provider not found!' });
                } else {
                    User.findById(provider.user, function(err, provider_acc) {
                        if (!provider_acc) {
                            res.json({ status: 404, success: false, message: 'User not found!' });
                        } else {
                            Provider.findOneAndUpdate({ _id: provider._id }, { $set: { 'flag_active': true, 'flag_request': true } }, function(err, result) {
                                if (err) {
                                    res.status(500).send(err)
                                } else {
                                    provider_acc.role = 2;
                                    provider_acc.flag_provider = true;
                                    provider_acc.save(function(err, data) {
                                        if (err) {
                                            res.status(500).send(err)
                                        } else {
                                            res.json({ status: 200, success: true, message: 'Acc Provider Success!', data: result });
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var rejectProviderrequest = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Provider.findByIdAndUpdate(req.body._id, { $set: { 'flag_request': true } }, function(err, provider) {
                if (!provider) {
                    res.json({ status: 404, success: false, message: 'Provider not found!' });
                } else {
                    User.findById(provider.user, function(err, provider_reject) {
                        if (!provider_reject) {
                            res.json({ status: 404, success: false, message: 'User not found!' });
                        } else {
                            provider_reject.flag_provider = true;
                            provider_reject.save(function(err, data) {
                                if (err) {
                                    res.status(500).send(err)
                                } else {
                                    res.json({ status: 200, message: 'Reject New Provider Success!' });
                                }
                            })
                        }
                    })
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    });
}

var getAllregProvider = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Provider.find({ 'flag_active': true, 'flag_blocked': false })
                .select('user travel_name medsoc_account office_phone_number province flag_blocked')
                .populate({
                    path: "user province",
                    select: 'name province_name'
                })
                .exec(function(err, provider) {
                    if (err) {
                        res.status(500).send(err)
                    } else {
                        res.json({ status: 200, success: true, message: 'Get New Provider Success', provider });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var blockProvider = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Provider.findByIdAndUpdate(req.body._id, {
                $set: {
                    'flag_blocked': true
                }
            }, function(err, provider) {
                if (!provider) {
                    res.json({ status: 404, success: false, message: 'Provider not found!' });
                } else {
                    User.findById(provider.user, function(err, user_email) {
                        if (err) {
                            res.status(500).send(err)
                        } else if (!user_email) {
                            res.json({ status: 404, success: false, message: 'User not found!' });
                        } else {
                            var email = {
                                from: 'Travinesia, admin@Travinesia.com',
                                to: user_email.email,
                                subject: 'Travel Agent Blocked',
                                template: 'block_provider_compiled',
                                context: {
                                    user_email: user_email.name,
                                    img: "https://img.travinesia.com/logo/travinesia.png"
                                }
                            };
                            client.sendMail(email, function(err, info) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log('Message sent: ' + info.response);
                                }
                            });
                            res.json({ status: 200, success: true, message: 'Provider blocked!' });
                        }
                    })
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var unblockProvider = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Provider.findByIdAndUpdate(req.body._id, {
                $set: {
                    'flag_blocked': false
                }
            }, function(err, provider) {
                if (!provider) {
                    res.json({ status: 404, success: false, message: 'Provider not found!' });
                } else {
                    User.findById(provider.user, function(err, user_email) {
                        if (err) {
                            res.status(500).send(err)
                        } else if (!user_email) {
                            res.json({ status: 404, success: false, message: 'User not found!' });
                        } else {
                            var email = {
                                from: 'Travinesia, admin@Travinesia.com',
                                to: user_email.email,
                                subject: 'Travel Agent Blocked',
                                template: 'unblock_provider_compiled',
                                context: {
                                    user_email: user_email.name,
                                    img: "https://img.travinesia.com/logo/travinesia.png"
                                }
                            };
                            client.sendMail(email, function(err, info) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log('Message sent: ' + info.response);
                                }
                            });
                            res.json({ status: 200, success: true, message: 'Provider unblocked!' });
                        }
                    })
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var getProviderblock = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Provider.find({ 'flag_blocked': true })
                .select('user travel_name medsoc_account office_phone_number province flag_blocked')
                .populate({
                    path: "user province",
                    select: 'name province_name'
                })
                .exec(function(err, provider) {
                    if (err) {
                        res.status(500).send(err)
                    } else {
                        res.json({ status: 200, success: true, message: 'Get Provider Block Success', provider });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var getProvidereject = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Provider.find({ 'flag_active': false, 'flag_request': true })
                .select('user travel_name medsoc_account office_phone_number province flag_blocked')
                .populate({
                    path: "user province",
                    select: 'name province_name'
                })
                .exec(function(err, provider) {
                    if (err) {
                        res.status(500).send(err)
                    } else {
                        res.json({ status: 200, success: true, message: 'Get Provider Reject Success', provider });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var getProviderTrip = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Trip.find({ 'provider': req.params.id })
                .select('trip_name provider date_trip quota_trip id_type_trip days night')
                .populate({
                    path: "provider id_type_trip",
                    select: 'travel_name type_trip'
                })
                .exec(function(err, trip) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (!trip) {
                        res.json({ status: 404, success: false, message: 'Trip not found!' });
                    } else {
                        res.json({ status: 200, message: 'Get Valid Trip', data: trip });
                    }
                })
        }
    })
}

var getDetailprovider = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Provider.findById(req.params.id_provider)
                .select('travel_name slogan logo description office_address province medsoc_account office_phone_number domain balance')
                .populate({
                    path: "province",
                    select: 'province_name'
                })
                .exec(function(err, provider) {
                    if (err) {
                        res.status(500).send(err)
                    } else {
                        res.json({ status: 200, message: 'Get Detail Provider Success', provider });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var allPaymentbooking = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            var id_payment1 = mongoose.Types.ObjectId("5b8d073f28b9dcb7974403ea");
            var id_payment2 = mongoose.Types.ObjectId("5b8d075228b9dcb79744042e");
            var id_payment3 = mongoose.Types.ObjectId("5b8d076528b9dcb79744049a");
            Booking.find({ "id_statusPayment": { $in: [id_payment1, id_payment2, id_payment3] } })
                .select('no_booking coded_amount order_name id_typePayment id_statusPayment date_pay')
                .populate({
                    path: "id_typePayment id_statusPayment",
                    select: 'type_payment payment_status'
                })
                .exec(function(err, booking) {
                    if (err) {
                        res.status(500).send(err)
                    } else {
                        res.json({ status: 200, message: 'Get All Payment Booking Success', booking });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var accPaymentbookinguser = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            var id_payment = mongoose.Types.ObjectId("5b8d076528b9dcb79744049a");;
            Booking.findById(req.body._id, function(err, booking) {
                if (err) {
                    res.status(500).send(err)
                } else if (!booking) {
                    res.json({ status: 404, success: false, message: 'Booking not found!' });
                } else if (id_payment.equals(booking.id_statusPayment)) {
                    var payment_success = 2;
                    Payment.findOne({ 'id_status_payment': 2 }, function(err, payment) {
                        if (!payment) {
                            res.json({ status: 404, success: false, message: 'Payment not found!' });
                        } else {
                            var status_trip = 2;
                            Status.findOne({ 'id_status': 2 }, function(err, status) {
                                if (!status) {
                                    res.json({ status: 404, success: false, message: 'Status not found!' });
                                } else {
                                    booking.id_statusPayment = payment._id;
                                    booking.id_statusTrip = status._id;
                                    booking.save(function(err, data) {
                                        if (err) {
                                            res.status(500).send(err)
                                        } else {
                                            User.findById(booking.id_user, function(err, user_email) {
                                                if (!user) {
                                                    res.json({ status: 404, success: false, message: 'User not found!' });
                                                } else {
                                                    Booking.findById(data._id)
                                                        .populate({
                                                            path: "id_typePayment id_statusPayment id_trip",
                                                            select: 'type_payment payment_status trip_name'
                                                        })
                                                        .exec(function(err, result) {
                                                            if (!result) {
                                                                res.json({ status: 404, success: false, message: 'Booking not found!' });
                                                            } else {
                                                                Provider.findById(result.id_provider, function(err, provider) {
                                                                    User.findById(provider.user, function(err, provider_email) {
                                                                        if (err) {
                                                                            res.status(500).send(err)
                                                                        } else {
                                                                            var email = {
                                                                                from: 'Travinesia, admin@Travinesia.com',
                                                                                subject: 'Payment is Successful',
                                                                            };
                                                                            var toEmail = [result.order_email, provider_email.email];
                                                                            var toTemplate = ['pembayaran_berhasil_compiled', 'menunggu_tanggapan_compiled'];
                                                                            var toContext = [{
                                                                                    booking: result,
                                                                                    img: "https://img.travinesia.com/logo/travinesia.png"
                                                                                },
                                                                                {
                                                                                    booking: result,
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
                                                                                })
                                                                            })
                                                                            res.json({ status: 200, message: 'Acc User Payment Booking Success!' });
                                                                        }
                                                                    })
                                                                })
                                                            }
                                                        })
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })

                } else {
                    res.json({ status: 404, success: false, message: 'Booking sudah dibayar!' });
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var getDetailpaymentbooking = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Booking.findById(req.params.id_payment)
                .select('no_booking coded_amount order_name id_paymentMethod date_pay id_statusPayment')
                .populate({
                    path: "id_paymentMethod id_statusPayment",
                    select: 'id_type_payment payment_method payment_status',
                    populate: {
                        path: "id_type_payment",
                        select: 'type_payment'
                    }
                })
                .exec(function(err, booking) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (!booking) {
                        res.json({ status: 404, success: false, message: 'Booking not found!' });
                    } else {
                        res.json({ status: 200, success: true, message: 'Get Detail Payment Booking Success!', data: booking });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var getAllnewBooking = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            var status_trip1 = mongoose.Types.ObjectId("5b8d045a28b9dcb79743f73e");
            var status_trip2 = mongoose.Types.ObjectId("5b8d047e28b9dcb79743f7d4");
            var status_trip3 = mongoose.Types.ObjectId("5b8d054e28b9dcb79743fb29");
            Booking.find({ "id_statusTrip": { $in: [status_trip1, status_trip2, status_trip3] } })
                .select('no_booking order_name id_type_trip id_trip id_statusTrip startDate_trip')
                .populate({
                    path: "id_type_trip id_trip id_provider id_statusTrip",
                    select: 'type_trip travel_name trip_name status_trip'
                })
                .exec(function(err, booking) {
                    if (err) {
                        res.status(500).send(err)
                    } else {
                        res.json({ status: 200, success: true, message: 'Get All New Booking!', data: booking });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var getAllongoingBooking = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            var status_trip4 = mongoose.Types.ObjectId("5b8d057528b9dcb79743fbc1");
            var status_trip5 = mongoose.Types.ObjectId("5b8d05db28b9dcb79743fd7d");
            var status_trip6 = mongoose.Types.ObjectId("5b8d064a28b9dcb79743ffa9");
            Booking.find({ "id_statusTrip": { $in: [status_trip4, status_trip5, status_trip6] } })
                .select('no_booking order_name id_type_trip id_trip id_statusTrip startDate_trip')
                .populate({
                    path: "id_type_trip id_trip id_provider id_statusTrip",
                    select: 'type_trip travel_name trip_name status_trip'
                })
                .exec(function(err, booking) {
                    if (err) {
                        res.status(500).send(err)
                    } else {
                        res.json({ status: 200, success: true, message: 'Get All New Booking!', data: booking });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var getAllfinishedBooking = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            var status_trip7 = mongoose.Types.ObjectId("5b8d066a28b9dcb79744002c");
            var status_trip8 = mongoose.Types.ObjectId("5b8d069828b9dcb797440103");
            var status_trip9 = mongoose.Types.ObjectId("5b8d06c628b9dcb7974401d9");
            Booking.find({ "id_statusTrip": { $in: [status_trip7, status_trip8, status_trip9] } })
                .select('no_booking order_name id_type_trip id_trip id_statusTrip startDate_trip')
                .populate({
                    path: "id_type_trip id_trip id_provider id_statusTrip",
                    select: 'type_trip travel_name trip_name status_trip'
                })
                .exec(function(err, booking) {
                    if (err) {
                        res.status(500).send(err)
                    } else {
                        res.json({ status: 200, success: true, message: 'Get All New Booking!', data: booking });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var getDetailbooking = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Booking.findById(req.params.id_booking)
                .select('no_booking order_name order_telephone order_email id_type_trip id_trip id_statusTrip startDate_trip endDate_trip coded_amount traveller_identity traveller_age traveller_name')
                .populate({
                    path: "id_type_trip id_trip id_statusTrip",
                    select: 'type_trip trip_name provider status_trip',
                    populate: {
                        path: "provider",
                        select: 'travel_name'
                    }
                })
                .exec(function(err, data) {
                    if (err) {
                        res.status(500).send(err)
                    } else {
                        res.json({ status: 200, success: true, message: 'Get Detail Booking!', data: data });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var updateDetailbooking = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Booking.findById(req.body._id, function(err, booking) {
                if (err) {
                    res.status(500).send(err)
                } else if (!booking) {
                    res.json({ status: 404, success: false, message: 'Booking not found!' });
                } else {
                    booking.order_name = req.body.order_name || booking.order_name;
                    booking.order_telephone = req.body.order_telephone || booking.order_telephone;
                    booking.order_email = req.body.order_email || booking.order_email;
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
                    Booking.updateOne({ _id: booking._id }, {
                        $set: {
                            'order_name': booking.order_name,
                            'order_telephone': booking.order_telephone,
                            'order_email': booking.order_email,
                            'traveller_name': booking.traveller_name,
                            'traveller_age': booking.traveller_age,
                            'traveller_identity': booking.traveller_identity
                        }
                    }, function(err, data_traveller) {
                        if (err) {
                            res.status(500).send(err)
                        } else {
                            res.send({ status: 200, message: 'Update Detail Booking Success!' });
                        }
                    });
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var dashboardTrip = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Trip.count({}, function(err, all_trip) {
                if (err) {
                    res.status(500).send(err)
                } else {
                    var id_status_6 = mongoose.Types.ObjectId("5b7536400730bd35ffbb2b5e");
                    var id_status_7 = mongoose.Types.ObjectId("5b7536550730bd35ffbb2b92");
                    var id_status_8 = mongoose.Types.ObjectId("5b7536650730bd35ffbb2bd4");
                    var id_status_9 = mongoose.Types.ObjectId("5b7536910730bd35ffbb2c38");
                    Booking.count({ "id_statusTrip": { $nin: [id_status_6, id_status_7, id_status_8, id_status_9] } }, function(err, trip_sold) {
                        if (err) {
                            res.status(500).send(err)
                        } else {
                            Booking.count({ "id_statusTrip": { $in: [id_status_6, id_status_7, id_status_8, id_status_9] } }, function(err, trip_finished) {
                                if (err) {
                                    res.status(500).send(err)
                                } else {
                                    Trip.count({ "valid": 1 }, function(err, trip_valid) {
                                        res.json({ status: 200, message: 'Get Dashboard Admin Trip Success', all_trip, trip_sold, trip_finished, trip_valid });
                                    })
                                }
                            })
                        }
                    })
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var getValidTrip = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Trip.find({ "valid": 1, "flag_blocked": false })
                .select('trip_name provider date_trip quota_trip id_type_trip days night time zone_time valid flag_blocked')
                .populate({
                    path: "provider id_type_trip",
                    select: 'travel_name type_trip'
                })
                .exec(function(err, trip) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (!trip) {
                        res.json({ status: 404, success: false, message: 'Trip not found!' });
                    } else {
                        res.json({ status: 200, message: 'Get Valid Trip', data: trip });
                    }
                })
        }
    })
}

var getDetailTrip = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Trip.findById(req.params.id_trip)
                .select('provider trip_name photo_trip id_type_trip date_trip days night id_province facility category description notes_meeting_point time zone_time notes_traveler quota_trip publish_price')
                .populate({
                    path: "id_type_trip id_province facility category provider",
                    select: 'type_trip province_name facility_name category_name travel_name'
                })
                .exec(function(err, trip_detail) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (!trip_detail) {
                        res.json({ status: 404, success: false, message: 'Trip not found!' });
                    } else {
                        res.json({ status: 200, message: 'Get Valid Trip', data: trip_detail });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var blockTrip = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Trip.findById(req.body._id, function(err, trip) {
                if (err) {
                    res.status(500).send(err)
                } else if (!trip) {
                    res.json({ status: 404, success: false, message: 'Trip not found!' });
                } else {
                    trip.flag_blocked = true;
                    trip.save(function(err, data) {
                        if (err) {
                            res.status(500).send(err)
                        } else {
                            Provider.findById(trip.provider, function(err, provider_email) {
                                if (err) {
                                    res.status(500).send(err)
                                } else if (!provider_email) {
                                    res.json({ status: 404, success: false, message: 'Provider not found!' });
                                } else {
                                    User.findById(provider_email.user, function(err, user_email) {
                                        if (err) {
                                            res.status(500).send(err)
                                        } else if (!user_email) {
                                            res.json({ status: 404, success: false, message: 'User not found!' });
                                        } else {
                                            var email = {
                                                from: 'Travinesia, admin@Travinesia.com',
                                                to: user_email.email,
                                                subject: 'Travel Agent Blocked',
                                                template: 'block_trip_compiled',
                                                context: {
                                                    user_email: user_email.name,
                                                    img: "https://img.travinesia.com/logo/travinesia.png"
                                                }
                                            };
                                            client.sendMail(email, function(err, info) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    console.log('Message sent: ' + info.response);
                                                }
                                            });
                                            res.json({ status: 200, success: true, message: 'Trip Blocked!' });
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var unblockTrip = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Trip.findByIdAndUpdate(req.body._id, {
                $set: {
                    'flag_blocked': false
                }
            }, function(err, trip) {
                if (!trip) {
                    res.json({ status: 404, success: false, message: 'Trip not found!' });
                } else {
                    Provider.findById(trip.provider, function(err, provider_email) {
                        if (err) {
                            res.status(500).send(err)
                        } else if (!provider_email) {
                            res.json({ status: 404, success: false, message: 'Provider not found!' });
                        } else {
                            User.findById(provider_email.user, function(err, user_email) {
                                if (err) {
                                    res.status(500).send(err)
                                } else if (!user_email) {
                                    res.json({ status: 404, success: false, message: 'User not found!' });
                                } else {
                                    var email = {
                                        from: 'Travinesia, admin@Travinesia.com',
                                        to: user_email.email,
                                        subject: 'Travel Agent Blocked',
                                        template: 'unblock_trip_compiled',
                                        context: {
                                            user_email: user_email.name,
                                            img: "https://img.travinesia.com/logo/travinesia.png"
                                        }
                                    };
                                    client.sendMail(email, function(err, info) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            console.log('Message sent: ' + info.response);
                                        }
                                    });
                                    res.json({ status: 200, success: true, message: 'Trip Unblocked!' });
                                }
                            })
                        }
                    })
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}


var getDiscussionTrip = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Discussion.find({ "id_trip": req.params.id_trip })
                .select('id_user created_at content')
                .populate({
                    path: "id_user",
                    select: 'name photo'
                })
                .exec(function(err, discussion) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (!discussion) {
                        res.json({ status: 404, success: false, message: 'Discussion not found!' });
                    } else if (discussion == '' || discussion == null) {
                        res.json({ status: 404, success: false, message: 'Discussion not found!', data: '' });
                    } else {
                        res.json({ status: 200, message: 'Get Discussion Trip Success', data: discussion });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var getAllReviewtrip = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Review.find({ "id_trip": req.params.id_trip })
                .select('rate id_user id_trip field created_at')
                .populate({
                    path: "id_user id_trip",
                    select: 'name photo rate rate_total rate_div'
                })
                .exec(function(err, review) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (!review) {
                        res.json({ status: 404, success: false, message: 'Review not found!' });
                    } else {
                        res.json({ status: 200, message: 'Get Trip Review Success', data: review });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var deleteDiscussion = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Discussion.findByIdAndRemove(req.body._id, function(err, discussion) {
                if (err) {
                    res.status(500).send(err)
                } else if (!discussion) {
                    res.json({ status: 404, success: false, message: 'Discussion not found!' });
                } else {
                    res.json({ status: 200, message: 'Delete Discussion Trip Success' });
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var deleteReview = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Review.findByIdAndRemove(req.body._id, function(err, review) {
                if (err) {
                    res.status(500).send(err)
                } else if (!review) {
                    res.json({ status: 404, success: false, message: 'Review not found!' });
                } else {
                    res.json({ status: 200, message: 'Delete Review Trip Success' });
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var getReqDisbursement = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Withdraw.find({ "withdraw_status": false, "flag_request": false })
                .select('created_at id_provider bank_name account_number account_owner withdraw_total withdraw_status')
                .populate({
                    path: "id_provider",
                    select: 'travel_name office_phone_number'
                })
                .exec(function(err, withdraw) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (!withdraw) {
                        res.json({ status: 404, success: false, message: 'Withdraw not found!' });
                    } else {
                        res.json({ status: 200, message: 'Get All Request Disbursement Success', data: withdraw });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var detailReqDisbursement = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Withdraw.findById(req.params.id_withdraw)
                .select('id_provider account_owner account_number bank_name created_at withdraw_total')
                .populate({
                    path: "id_provider",
                    select: 'travel_name office_address office_phone_number province medsoc balance',
                    populate: {
                        path: "province",
                        select: 'province_name'
                    }
                })
                .exec(function(err, withdraw) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (!withdraw) {
                        res.json({ status: 404, success: false, message: 'Withdraw not found!' });
                    } else {
                        res.json({ status: 200, message: 'Get Detail Request Disbursement Success', data: withdraw });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var accReqdisbursement = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Withdraw.findByIdAndUpdate(req.body._id, {
                $set: {
                    'withdraw_status': true,
                    'flag_request': true
                }
            }, function(err, withdraw) {
                if (err) {
                    res.status(500).send(err)
                } else if (!withdraw) {
                    res.json({ status: 404, success: false, message: 'Withdraw not found!' });
                } else {
                    if (err) {
                        res.status(500).send(err)
                    } else {
                        Provider.findById(withdraw.id_provider, function(err, provider) {
                            if (err) {
                                res.status(500).send(err)
                            } else if (!provider) {
                                res.json({ status: 404, success: false, message: 'Provider not found!' });
                            } else {
                                var prev_balance = provider.balance;
                                Provider.findOneAndUpdate({ '_id': provider._id }, {
                                    $set: {
                                        'balance': prev_balance - withdraw.withdraw_total
                                    }
                                }, function(err, data_result) {
                                    if (err) {

                                    } else {
                                        var balance = new Providerbalance;
                                        balance.total_withdraw = withdraw.withdraw_total;
                                        balance.balance_history = provider.balance - withdraw.withdraw_total;
                                        balance.mutation_flag = false;
                                        balance.id_provider = provider._id;
                                        balance.save(function(err, result) {
                                            if (err) {
                                                res.status(500).send(err)
                                            } else {
                                                User.findById(provider.user, function(err, user) {
                                                    if (!user) {
                                                        res.json({ status: 404, success: false, message: 'User not found!' });
                                                    } else {
                                                        var withdraw_date = moment(withdraw.created_at).locale('id').format('dddd, D MMMM YYYY');
                                                        var email = {
                                                            from: 'Travinesia, admin@Travinesia.com',
                                                            to: user.email,
                                                            subject: 'Successful Withdrawal',
                                                            template: 'penarikan_berhasil_compiled',
                                                            context: {
                                                                date: withdraw_date,
                                                                total: withdraw.withdraw_total,
                                                                img: "https://img.travinesia.com/logo/travinesia.png"
                                                            }
                                                        };
                                                        client.sendMail(email, function(err, info) {
                                                            if (err) {
                                                                console.log(err);
                                                            } else {
                                                                console.log('Message sent: ' + info.response);
                                                            }
                                                        });
                                                        res.json({ status: 200, message: 'Accept Request Disbursement Success' });
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var refusereqDisbursement = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Withdraw.findById(req.body._id, function(err, withdraw) {
                if (err) {
                    res.status(500).send(err)
                } else if (!withdraw) {
                    res.json({ status: 404, success: false, message: 'Withdraw not found!' });
                } else {
                    withdraw.withdraw_status = false;
                    withdraw.flag_request = true;
                    withdraw.save(function(err, data) {
                        if (err) {
                            res.status(500).send(err)
                        } else {
                            Provider.findById(data.id_provider, function(err, provider) {
                                if (err) {
                                    res.status(500).send(err)
                                } else if (!provider) {
                                    res.json({ status: 404, success: false, message: 'Provider not found!' });
                                } else {
                                    User.findById(provider.user, function(err, user) {
                                        if (!user) {
                                            res.json({ status: 404, success: false, message: 'User not found!' });
                                        } else {
                                            var withdraw_date = moment(withdraw.created_at).locale('id').format('dddd, D MMMM YYYY');
                                            var email = {
                                                from: 'Travinesia, admin@Travinesia.com',
                                                to: user.email,
                                                subject: 'Withdrawal is Rejected',
                                                template: 'penarikan_ditolak_compiled',
                                                context: {
                                                    date: withdraw_date,
                                                    total: withdraw.withdraw_total,
                                                    img: "https://img.travinesia.com/logo/travinesia.png"
                                                }
                                            };
                                            client.sendMail(email, function(err, info) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    console.log('Message sent: ' + info.response);
                                                }
                                            });
                                            res.json({ status: 200, message: 'Refuse Request Disbursement Success' });
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var getHistoryDisbursement = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Withdraw.find({ "flag_request": true })
                .select('created_at id_provider bank_name account_owner account_number withdraw_total withdraw_status')
                .populate({
                    path: "id_provider",
                    select: 'travel_name office_phone_number'
                })
                .exec(function(err, history_withdraw) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (!history_withdraw) {
                        res.json({ status: 404, success: false, message: 'Hostory withdraw not found!' });
                    } else {
                        res.json({ status: 200, message: 'Get History Disbursement Success', data: history_withdraw });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var getAllUser = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            //tambah flag_blocked : false
            User.find({ "role": { $nin: [3] }, "flag_blocked": false })
                .select('name email telephone role')
                .exec(function(err, all_user) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (!all_user) {
                        res.json({ status: 404, success: false, message: 'User not found!' });
                    } else {
                        res.json({ status: 200, message: 'Get All User Success', data: all_user });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var blockUser = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            User.findById(req.body._id, function(err, user_block) {
                if (err) {
                    res.status(500).send(err)
                } else if (!user) {
                    res.json({ status: 404, success: false, message: 'User not found!' });
                } else {
                    user_block.flag_blocked = true;
                    user_block.save(function(err, data) {
                        if (err) {
                            res.status(500).send(err)
                        } else {
                            var email = {
                                from: 'Travinesia, admin@Travinesia.com',
                                to: data.email,
                                subject: 'Travel Agent Blocked',
                                template: 'block_user_compiled',
                                context: {
                                    user_email: data.name,
                                    img: "https://img.travinesia.com/logo/travinesia.png"
                                }
                            };
                            client.sendMail(email, function(err, info) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log('Message sent: ' + info.response);
                                }
                            });
                            res.json({ status: 200, message: 'User Blocked' });
                        }
                    })
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var unblockUser = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            User.findByIdAndUpdate(req.body._id, {
                $set: {
                    'flag_blocked': false
                }
            }, function(err, user_blocked) {
                if (!user_blocked) {
                    res.json({ status: 404, success: false, message: 'User not found!' });
                } else {
                    var email = {
                        from: 'Travinesia, admin@Travinesia.com',
                        to: user_blocked.email,
                        subject: 'Travel Agent Blocked',
                        template: 'unblock_user_compiled',
                        context: {
                            user_email: user_blocked.name,
                            img: "https://img.travinesia.com/logo/travinesia.png"
                        }
                    };
                    client.sendMail(email, function(err, info) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Message sent: ' + info.response);
                        }
                    });
                    res.json({ status: 200, success: true, message: 'User unblocked!' });
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var getListblockuser = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            //tambah flag_blocked : false
            User.find({ "role": { $nin: [3] }, "flag_blocked": true })
                .select('name email telephone role')
                .exec(function(err, all_user) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (!all_user) {
                        res.json({ status: 404, success: false, message: 'User not found!' });
                    } else {
                        res.json({ status: 200, message: 'Get All User Block Success', data: all_user });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var getDetailUser = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            User.findById(req.params.id_user)
                .select('name email telephone photo gender identity_number birthday')
                .exec(function(err, user_detail) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (!user_detail) {
                        res.json({ status: 404, success: false, message: 'User not found!' });
                    } else {
                        Booking.find({ "id_user": user._id })
                            .select('no_booking startDate_trip id_type_trip id_trip quantity coded_amount id_statusTrip')
                            .populate({
                                path: "id_type_trip id_trip id_statusTrip",
                                select: 'type_trip trip_name days night status_trip'
                            })
                            .exec(function(err, booking_user) {
                                if (err) {
                                    res.status(500).send(err)
                                } else if (!booking_user) {
                                    res.json({ status: 404, success: false, message: 'Booking not found!' });
                                } else {
                                    res.json({ status: 200, message: 'Get Detail User Success', user_detail, booking_user });
                                }
                            })
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var getHistoryOrderuser = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            var status_history1 = mongoose.Types.ObjectId("5b8d069828b9dcb797440103");
            var status_history2 = mongoose.Types.ObjectId("5b8d06c628b9dcb7974401d9");
            Booking.find({ "id_user": req.params.id, "id_statusTrip": { $in: [status_history1, status_history2] } })
                .select('id_user id_trip created_at startDate_trip id_type_trip no_booking coded_amount')
                .populate({
                    path: "id_user id_trip id_type_trip",
                    select: 'name trip_name days night type_trip'
                })
                .exec(function(err, booking) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (booking == '') {
                        res.json({ status: 404, success: false, message: 'Booking not found!' });
                    } else if (!booking) {
                        res.json({ status: 404, success: false, message: 'Booking not found!' });
                    } else {
                        res.json({ status: 200, message: 'Get History Order User Success', data: booking });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var addPromo = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            var promo = new Promo();
            promo.promo_name = req.body.promo_name;
            promo.promo_code = req.body.promo_code;
            promo.validity_date = req.body.validity_date;
            promo.expiration_date = req.body.expiration_date;
            //1 = discount_amount
            //2 = reduced_fee
            if (req.body.type == 1) {
                promo.type = 1;
                promo.discount_amount = req.body.discount_amount;
            } else if (req.body.type == 2) {
                promo.type = 2;
                promo.reduced_fee = req.body.discount_amount;
            }
            promo.description = req.body.description;
            promo.min_price = req.body.min_price;
            //1 = by_category
            //2 = by_location
            if (req.body.promo_category == 1) {
                promo.promo_category = 1;
                promo.by_category = req.body.by_category;
            } else if (req.body.promo_category == 2) {
                promo.promo_category = 2;
                promo.by_location = req.body.by_location;
                promo.terms_conditions = req.body.terms_conditions;
            }
            var imageSaver = new ImageSaver();
            var pictname = new Date().getTime();
            if (req.body.photo_promo != null) {
                promo.photo_promo = "https://img.travinesia.com/promo/" + pictname + ".jpg";
                imageSaver.saveFile("../../../../home/admin/web/img.travinesia.com/public_html/promo/" + pictname + ".jpg", req.body.photo_promo)
                    .then((data) => {
                        console.log("upload photo success");
                    })
                    .catch((err) => {
                        res.json({ status: 400, message: err });
                    })
            }
            promo.save(function(err, data) {
                if (err) {
                    res.status(500).send(err)
                } else {
                    res.json({ status: 200, message: 'Promo Added!' });
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var editPhotoPromo = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else {
            if (user.role == 3) {
                Promo.findOne({ _id: req.body._id }, function(err, promo) {
                    if (!promo) {
                        res.send({ status: 404, message: 'Promo Not Found' });
                    } else {
                        promo.photo_promo = promo.photo_promo;
                        var imageSaver = new ImageSaver();
                        var pictname = new Date().getTime();
                        if (req.body.photo_promo != null) {
                            if (promo.photo_promo != null) {
                                var del_pict = promo.photo_promo.split('https://img.travinesia.com/promo/')[1];
                                fs.unlinkSync('../../../../home/admin/web/img.travinesia.com/public_html/promo/' + del_pict);

                                promo.photo_promo = "https://img.travinesia.com/promo/" + pictname + ".jpg";
                                imageSaver.saveFile("../../../../home/admin/web/img.travinesia.com/public_html/promo/" + pictname + ".jpg", req.body.photo_promo)
                                    .then((data) => {
                                        console.log("upload photo success");
                                    })
                                    .catch((err) => {
                                        res.json({ status: 400, message: err });
                                    })
                            } else {
                                promo.photo_promo = "https://img.travinesia.com/promo/" + pictname + ".jpg";
                                imageSaver.saveFile("../../../../home/admin/web/img.travinesia.com/public_html/promo/" + pictname + ".jpg", req.body.photo_promo)
                                    .then((data) => {
                                        console.log("upload photo success");
                                    })
                                    .catch((err) => {
                                        res.json({ status: 400, message: err });
                                    })
                            }
                            promo.save(function(err, data) {
                                if (err) {
                                    res.status(500).send(err)
                                } else {
                                    res.send({ status: 200, message: 'Your Photo Promo has been updated' });
                                }
                            });
                        } else {
                            res.send({ status: 400, message: 'Make sure upload your Photo!' });
                        }
                    }
                });
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    });
}

var getRegisteredPromo = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Promo.find({})
                .select('promo_name promo_code validity_date expiration_date type discount_amount reduced_fee')
                .exec(function(err, promo) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (!promo) {
                        res.json({ status: 404, success: false, message: 'Promo not found!' });
                    } else {
                        res.json({ status: 200, message: 'Get Registered Promo Success!', data: promo });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var getDetailPromo = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Promo.findById(req.params.id_promo)
                .select('promo_name photo_promo promo_code validity_date expiration_date type discount_amount reduced_fee description min_price promo_category by_category by_location terms_conditions')
                .populate({
                    path: "by_category by_location",
                    select: 'category_name province_name'
                })
                .exec(function(err, detail_promo) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (!detail_promo) {
                        res.json({ status: 404, success: false, message: 'Promo not found!' });
                    } else {
                        res.json({ status: 200, message: 'Get Registered Promo Success!', data: detail_promo });
                    }
                })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var updateDetailPromo = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Promo.findById(req.body._id, function(err, promo) {
                if (err) {
                    res.status(500).send(err)
                } else if (!promo) {
                    res.json({ status: 404, success: false, message: 'Promo not found!' });
                } else {
                    promo.promo_name = req.body.promo_name || promo.promo_name;
                    promo.promo_code = req.body.promo_code || promo.promo_code;
                    promo.validity_date = req.body.validity_date || promo.validity_date;
                    promo.expiration_date = req.body.expiration_date || promo.expiration_date;
                    //1 = discount_amount
                    //2 = reduced_fee
                    if (req.body.type == 1) {
                        promo.type = 1;
                        promo.discount_amount = req.body.discount_amount || promo.discount_amount;
                    } else if (req.body.type == 2) {
                        promo.type = 2;
                        promo.reduced_fee = req.body.reduced_fee || promo.reduced_fee;
                    }
                    promo.description = req.body.description || promo.description;
                    promo.min_price = req.body.min_price || promo.min_price;
                    //1 = by_category
                    //2 = by_location
                    if (req.body.promo_category == 1) {
                        promo.promo_category = 1;
                        promo.by_category = req.body.by_category || promo.by_category;
                    } else if (req.body.promo_category == 2) {
                        promo.promo_category = 2;
                        promo.by_location = req.body.by_location || promo.by_location;
                        promo.terms_conditions = req.body.terms_conditions || promo.terms_conditions;
                    }
                    promo.save(function(err, data) {
                        if (err) {
                            res.status(500).send(err)
                        } else {
                            res.json({ status: 200, message: 'Update Promo Success!' });
                        }
                    })
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

var deletePromo = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (!user) {
            res.json({ status: 404, success: false, message: 'User not found!' });
        } else if (user.role == 3) {
            Promo.findByIdAndRemove(req.body._id, function(err, promo) {
                if (err) {
                    res.status(500).send(err)
                } else if (!promo) {
                    res.json({ status: 404, success: false, message: 'Promo not found!' });
                } else {
                    res.json({ status: 200, success: false, message: 'Delete Promo Success!' });
                }
            })
        } else {
            res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
        }
    })
}

module.exports = {
    dashboardAdmin: dashboardAdmin,
    getAllnewProvider: getAllnewProvider,
    accProviderrequest: accProviderrequest,
    rejectProviderrequest: rejectProviderrequest,
    getAllregProvider: getAllregProvider,
    blockProvider: blockProvider,
    unblockProvider: unblockProvider,
    getDetailprovider: getDetailprovider,
    allPaymentbooking: allPaymentbooking,
    accPaymentbookinguser: accPaymentbookinguser,
    getDetailpaymentbooking: getDetailpaymentbooking,
    getAllnewBooking: getAllnewBooking,
    getAllongoingBooking: getAllongoingBooking,
    getAllfinishedBooking: getAllfinishedBooking,
    getDetailbooking: getDetailbooking,
    updateDetailbooking: updateDetailbooking,
    dashboardTrip: dashboardTrip,
    getValidTrip: getValidTrip,
    getDetailTrip: getDetailTrip,
    blockTrip: blockTrip,
    unblockTrip: unblockTrip,
    getDiscussionTrip: getDiscussionTrip,
    getAllReviewtrip: getAllReviewtrip,
    deleteDiscussion: deleteDiscussion,
    deleteReview: deleteReview,
    getReqDisbursement: getReqDisbursement,
    detailReqDisbursement: detailReqDisbursement,
    accReqdisbursement: accReqdisbursement,
    refusereqDisbursement: refusereqDisbursement,
    getHistoryDisbursement: getHistoryDisbursement,
    getAllUser: getAllUser,
    blockUser: blockUser,
    unblockUser: unblockUser,
    getDetailUser: getDetailUser,
    getHistoryOrderuser: getHistoryOrderuser,
    addPromo: addPromo,
    editPhotoPromo: editPhotoPromo,
    getRegisteredPromo: getRegisteredPromo,
    getDetailPromo: getDetailPromo,
    deletePromo: deletePromo,
    updateDetailPromo: updateDetailPromo,
    getProviderTrip: getProviderTrip,
    getProviderblock: getProviderblock,
    getProvidereject: getProvidereject,
    getListblockuser: getListblockuser
}