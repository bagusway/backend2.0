var User = require('../models/user');
var Provider = require('../models/provider');
var Payment = require('../models/payment_method');
var Statuspayment = require('../models/status_payment');
var Review = require('../models/review');
var Booking = require('../models/booking');
var Expire = require('../models/booking_expire');
var cron = require('node-cron');
var each = require('foreach');
var moment = require('moment');
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var hbs = require('nodemailer-express-handlebars');
var moment = require('moment');
var async = require('async');
var fs = require('fs');
var pdf = require('dynamic-html-pdf');

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

var getValidTrips = function(req, res) {
    cron.schedule('0 0 * * *', () => {
        //console.log('running a task every minute');
        Trip.find({ 'valid': 1 }, function(err, trip) {
            if (trip != '') {
                each(trip, function(value, key, array) {
                    var check_date = moment().add(2, 'day').toDate();
                    var date_now = new Date().getTime();
                    var loop;
                    var pengurangan;
                    var current_date;
                    for (var i = 0; i < trip[key].checked_date; i++) {
                        if (moment(trip[key].date_trip[i]).isSameOrAfter(date_now, 'day')) {
                            if (i === 0) {
                                loop = 0;
                                break;
                            } else {
                                current_date = trip[key].checked_date - i;
                                pengurangan = trip[key].checked_date - current_date;
                                loop = pengurangan;
                                break;
                            }
                        }
                    }
                    if (loop === undefined) {
                        trip[key].valid = 0;
                    }
                    var sisa;
                    var valid_date;
                    for (var j = loop; j < trip[key].checked_date; j++) {
                        if (moment(trip[key].date_trip[j]).isSameOrAfter(check_date, 'day')) {
                            sisa = trip.checked_date - j;
                            valid_date = sisa;
                            break;
                        }
                    }
                    if (valid_date === undefined) {
                        trip[key].valid = 0;
                    }
                    trip[key].save(function(err) {
                        if (!err) {
                            trip[key].valid = trip[key].valid;
                        } else {
                            console.log(trip[key].valid);
                        }
                    })
                })

            } else if (trip == '') {
                console.log("Trip not Found!");
            }
        });
    });
}

var checkexpireBooking = function(req, res) {
    cron.schedule('* * * * *', () => {
        var status_expire = mongoose.Types.ObjectId("5b8d045a28b9dcb79743f73e");
        var status_booking_expire = mongoose.Types.ObjectId("5b8d06c628b9dcb7974401d9");
        Booking.find({ "id_statusTrip": status_expire }, function(err, booking) {
            if (err) {
                res.status(500).send(err)
            } else {
                var date_now = new Date().getTime();
                each(booking, function(value, key, array) {
                    if (booking[key].deletion_date <= date_now) {
                        Trip.findOne({ _id: booking[key].id_trip }, function(err, trip) {
                            if (err) {
                                console.log("Trip not found!")
                            } else {
                                for (var i = 0; i < trip.date_trip.length; i++) {
                                    if (moment(trip.date_trip[i]).isSame(booking[key].startDate_trip, 'day')) {
                                        trip.quota_left[i] = trip.quota_left[i] + booking[key].quantity;
                                    } else {
                                        trip.quota_left[i] = trip.quota_left[i];
                                    }
                                }
                                Trip.updateOne({ _id: trip._id }, { $set: { 'quota_left': trip.quota_left } }, function(err, data) {
                                    if (err) {
                                        console.log("Error")
                                    } else {
                                        booking[key].id_statusTrip = status_booking_expire;
                                        booking[key].save(function(err, result) {
                                            if (err) {
                                                console.log("Error Change Status Expire")
                                            } else {
                                                var email = {
                                                    from: 'Travinesia, admin@Travinesia.com',
                                                    to: booking[key].order_email,
                                                    subject: 'Booking Expired',
                                                    template: 'booking_expire_compiled',
                                                    context: {
                                                        user_email: booking[key].order_name,
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
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    } else {
                        console.log("expired booking does not exist")
                    }
                })
            }
        })
    })
}

var reminderTrip = function(req, res) {
    cron.schedule('0 7 * * *', () => {
        var status_trip = mongoose.Types.ObjectId("5b8d057528b9dcb79743fbc1");
        var startdate = moment(new Date()).format('YYYY-MM-DD');
        var new_date = moment(startdate, "YYYY-MM-DD").add('days', 1);
        Booking.find({ startDate_trip: new_date, id_statusTrip: status_trip })
            .populate({
                path: "id_typePayment id_statusPayment id_trip id_provider",
                select: 'type_payment payment_status trip_name time zone_time travel_name'
            })
            .exec(function(err, booking) {
                if (err) {
                    res.status(500).send(err)
                } else if (booking != '') {
                    each(booking, function(value, key, array) {
                        Provider.findOne({ _id: booking[key].id_provider }, function(err, provider) {
                            if (err) {
                                res.status(500).send(err)
                            } else {
                                User.findOne({ _id: provider.user }, function(err, provider_email) {
                                    if (err) {
                                        res.status(500).send(err)
                                    } else {
                                        var email = {
                                            from: 'Travinesia, admin@Travinesia.com',
                                            subject: 'Reminder Trip',
                                        };
                                        var toEmail = [booking[key].order_email, provider_email.email];
                                        var toTemplate = ['user_reminder_kehadiran_compiled', 'provider_reminder_trip_compiled'];
                                        var toContext = [{
                                                booking: booking[key],
                                                img: "https://img.travinesia.com/logo/travinesia.png"
                                            },
                                            {
                                                booking: booking[key],
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
                                        console.log("Reminder Trip Send!")
                                    }
                                })
                            }
                        })
                    })
                } else {
                    console.log("Tidak ada Trip yang berjalan Besok")
                }
            })
    })
}


var config = {
    format: "A4",
    orientation: "portrait",
    border: "10mm"
}

var sendUnduhdatapeserta = function(req, res) {
    cron.schedule('0 7 * * *', () => {
        var status_trip = mongoose.Types.ObjectId("5b8d057528b9dcb79743fbc1");
        var startdate = moment(new Date()).format('YYYY-MM-DD');
        var new_date = moment(startdate, "YYYY-MM-DD").add('days', 1);
        var pipeline = [{
            "$group": {
                "_id": "$id_trip",
                "id_provider": { "$addToSet": "$id_provider" }
            }
        }];
        Booking.aggregate(pipeline)
            .exec(function(err, result) {
                if (err) {
                    res.status(500).send(err)
                } else {
                    var quantity_total;
                    var total;
                    var out = [""];
                    each(result, function(value, key, array) {
                        Booking.find({ id_trip: result[key]._id, id_statusTrip: status_trip })
                            .populate({
                                path: "id_trip",
                                select: "trip_name"
                            })
                            .exec(function(err, booking) {
                                if (err) {
                                    console.log("Error")
                                } else {
                                    each(booking, function(value, key, array) {
                                        if (moment(booking[key].startDate_trip).isSame(new_date, 'day')) {
                                            Provider.findOne({ _id: booking[key].id_provider }, function(err, provider) {
                                                if (err) {
                                                    res.status(500).send(err)
                                                } else {
                                                    User.findOne({ _id: provider.user }, function(err, provider_email) {
                                                        if (err) {
                                                            res.status(500).send(err)
                                                        } else {
                                                            quantity_total = booking[key].quantity;
                                                            total = quantity_total + booking[key].quantity;
                                                            out = out + "<tr> <td class=" + "traveller" + ">" + "Pemesan:" + booking[key].order_name + "</td>";
                                                            out = out + "<td class=" + "traveller" + ">" + "No.Hp.Pemesan:" + booking[key].order_telephone + "</td>";
                                                            out = out + "<td class=" + "traveller" + ">" + "Id.Pesanan:" + booking[key].no_booking + "</td> </tr>";
                                                            for (var i = 0; i < booking[key].quantity; i++) {
                                                                out = out + "<tr> <td>" + booking[key].traveller_name[i] + "</td>";
                                                                out = out + "<td>" + booking[key].traveller_age[i] + "</td>";
                                                                out = out + "<td>" + booking[key].traveller_identity[i] + "</td> </tr>";
                                                            }
                                                            var booking_pdf = booking[0];
                                                            var booking_date = moment(booking_pdf.startDate_trip).locale('id').format('dddd, D MMMM YYYY');
                                                            var compiled = fs.readFileSync('./views/daftar_peserta.html', 'utf8');
                                                            var document = {
                                                                type: 'buffer',
                                                                template: compiled,
                                                                context: {
                                                                    booking: booking[key],
                                                                    booking_pdf: booking_pdf,
                                                                    booking_date: booking_date,
                                                                    total: total,
                                                                    out: out,
                                                                    img: "https://img.travinesia.com/logo/travinesia.png"
                                                                },
                                                            };
                                                            pdf.create(document, config)
                                                                .then(file => {
                                                                    var booking_pdf = booking[0];
                                                                    var booking_date = moment(booking_pdf.startDate_trip).locale('id').format('dddd, D MMMM YYYY');
                                                                    var email = {
                                                                        from: 'Travinesia, admin@Travinesia.com',
                                                                        subject: 'Data Peserta Trip',
                                                                        to: provider_email.email,
                                                                        template: 'provider_unduh_datapeserta_compiled',
                                                                        context: {
                                                                            booking_date: booking_date,
                                                                            booking: booking[key],
                                                                            img: "https://img.travinesia.com/logo/travinesia.png"
                                                                        },
                                                                        attachments: [{
                                                                            filename: 'datapeserta.pdf',
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
                                                                    console.log("Unduh Data Peserta Terkirim")
                                                                })
                                                                .catch(error => {
                                                                    console.error(error);
                                                                })
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                            //console.log(result[key])
                    })

                }
            });
    })
}

var confirmationMepo = function(req, res) {
    cron.schedule('0 0 * * *', () => {
        var status_trip_eticket = mongoose.Types.ObjectId("5b8d057528b9dcb79743fbc1");
        var status_trip_confirmation = mongoose.Types.ObjectId("5b8d05db28b9dcb79743fd7d");
        var startdate = moment(new Date()).format('YYYY-MM-DD');
        Booking.find({ id_statusTrip: status_trip_eticket })
            .populate({
                path: "id_typePayment id_statusPayment id_trip id_provider",
                select: 'type_payment payment_status trip_name time zone_time travel_name'
            })
            .exec(function(err, booking) {
                if (err) {
                    res.status(500).send(err)
                } else if (booking != '') {
                    each(booking, function(value, key, array) {
                        if (moment(startdate).isSame(booking[key].startDate_trip, 'day')) {
                            booking[key].id_statusTrip = status_trip_confirmation;
                            booking[key].save(function(err, done) {
                                if (err) {
                                    console.log("Error")
                                } else {
                                    var email = {
                                        from: 'Travinesia, admin@Travinesia.com',
                                        to: booking[key].order_email,
                                        subject: 'Konfirmasi Kehadiran (di Meeting Point)',
                                        template: 'konfirmasi_kehadiran_compiled',
                                        context: {
                                            user_email: booking[key].order_name,
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
                                    console.log("Status Trip berhasil diubah")
                                }
                            })
                        }
                    })
                }
            })
    })

}

var reminderTripday = function(req, res) {
    cron.schedule('0 0 * * *', () => {
        var status_trip_eticket = mongoose.Types.ObjectId("5b8d057528b9dcb79743fbc1");
        var status_trip_confirmation = mongoose.Types.ObjectId("5b8d05db28b9dcb79743fd7d");
        var startdate = moment(new Date()).format('YYYY-MM-DD');
        Booking.find({ id_statusTrip: status_trip_eticket })
            .populate({
                path: "id_typePayment id_statusPayment id_trip id_type_trip id_provider",
                select: 'type_payment payment_status id_type_trip trip_name meeting_point time zone_time travel_name'
            })
            .exec(function(err, booking) {
                if (err) {
                    res.status(500).send(err)
                } else if (booking != '') {
                    each(booking, function(value, key, array) {
                        if (moment(startdate).isSame(booking[key].startDate_trip, 'day')) {
                            Provider.findOne({ _id: booking[key].id_provider }, function(err, provider) {
                                if (err) {
                                    res.status(500).send(err)
                                } else {
                                    User.findOne({ _id: provider.user }, function(err, provider_email) {
                                        if (err) {
                                            res.status(500).send(err)
                                        } else {
                                            var date = moment(booking[key].startDate_trip).locale('id').format('dddd, D MMMM YYYY');
                                            var email = {
                                                from: 'Travinesia, admin@Travinesia.com',
                                                to: provider_email.email,
                                                subject: 'Reminder Trip Day!',
                                                template: 'trip_day_compiled',
                                                context: {
                                                    booking: booking[key],
                                                    date: date,
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
                                            console.log("Reminder Trip Day Send!");
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
    })
}

var reminderReviewandRating = function(req, res) {
    cron.schedule('0 7 * * *', () => {
        var status_trip_ongoing = mongoose.Types.ObjectId("5b8d064a28b9dcb79743ffa9");
        var status_trip_review = mongoose.Types.ObjectId("5b8d066a28b9dcb79744002c");
        var date_now = moment(new Date()).format('YYYY-MM-DD');
        Booking.find({ id_statusTrip: status_trip_ongoing })
            .populate({
                path: "id_typePayment id_statusPayment id_trip id_provider",
                select: 'type_payment payment_status trip_name time zone_time travel_name'
            })
            .exec(function(err, booking) {
                if (err) {
                    res.status(500).send(err)
                } else if (booking != '') {
                    each(booking, function(value, key, array) {
                        var date_review = moment(booking[key].endDate_trip, "YYYY-MM-DD").add('days', 1);
                        if (moment(date_now).isSame(date_review, 'day')) {
                            booking[key].id_statusTrip = status_trip_review;
                            booking[key].save(function(err, data) {
                                if (err) {
                                    console.log("Tidak Berhasil");
                                } else {
                                    var email = {
                                        from: 'Travinesia, admin@Travinesia.com',
                                        to: booking[key].order_email,
                                        subject: 'Review & Rating Trip',
                                        template: 'review_rating_compiled',
                                        context: {
                                            user_email: booking[key].order_name,
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
                                    console.log("Isi Review dan Status berhasil diubah!");
                                }
                            })
                        }
                    })
                }
            })
    })
}

module.exports = {
    getValidTrips: getValidTrips,
    checkexpireBooking: checkexpireBooking,
    reminderTrip: reminderTrip,
    sendUnduhdatapeserta: sendUnduhdatapeserta,
    reminderTripday: reminderTripday,
    confirmationMepo: confirmationMepo,
    reminderReviewandRating: reminderReviewandRating
}