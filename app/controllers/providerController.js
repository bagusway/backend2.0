var User = require('../models/user');
var Trip = require('../models/trip');
var Provider = require('../models/provider');
var Withdraw = require('../models/withdraw');
var Province = require('../models/province');
var TypeTrip = require('../models/type_trip');
var Booking = require('../models/booking');
var Status = require('../models/status_payment');
var Statustrip = require('../models/status_trip');
var Providerbalance = require('../models/provider_balance');
var Discussion = require('../models/discussion/discussion');
var Favorite = require('../models/favorite');
var Review = require('../models/review');
var jwt = require('jsonwebtoken');
var { secret } = require('../config/index');
var ImageSaver = require('image-saver-nodejs/lib');
var multer = require('multer');
var fs = require('fs');
var pdf = require('dynamic-html-pdf');
var ejs = require('ejs');
var moment = require('moment');
var each = require('foreach');
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var hbs = require('nodemailer-express-handlebars');

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


var getProfileProvider = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else if (err) {
            res.send({ status: 404, success: false, message: 'Error' });
        } else {
            if (user.role == 2) {
                if (err) {
                    res.send({ status: 404, success: false, message: 'Provider Not Found' });
                } else {
                    Provider.findOne({ user: req.user_id })
                        .select('travel_name logo cover slogan description domain office_address province office_phone_number flag_active flag_blocked')
                        .populate('province', 'province_name')
                        .exec(function(err, provider) {
                            if (!provider) {
                                res.send({ status: 404, success: false, message: 'Provider Not Found' });
                            } else if (provider.flag_active == true) {
                                var status_trip_7 = mongoose.Types.ObjectId("5b8d066a28b9dcb79744002c");
                                var status_trip_8 = mongoose.Types.ObjectId("5b8d069828b9dcb797440103");
                                Booking.count({ id_statusTrip: { $in: [status_trip_7, status_trip_8] }, id_provider: provider._id }, function(err, booking) {
                                    if (err) {
                                        res.status(500).send(err)
                                    } else {
                                        res.send({ status: 200, success: true, message: 'Get Profile Provider Success', provider, booking_success: booking });
                                    }
                                })
                            } else {
                                res.send({ status: 403, success: false, message: 'Provider Blocked!' });
                            }
                        });
                }
            } else {
                res.json({ status: 403, success: false, message: "Forbidden access for this user", token: req.token });
            }
        }
    });
}

var editProfileProvider = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else {
            if (user.role == 2) {
                Provider.findOne({ user: req.user_id }, function(err, provider) {
                    if (!provider) {
                        res.send({ status: 404, message: 'Provider Not Found' });
                    } else if (provider.flag_active == true) {
                        Provider.findOneAndUpdate({ user: req.user_id }, {
                            $set: {
                                'slogan': req.body.slogan || provider.slogan,
                                'description': req.body.description || provider.description,
                                'office_address': req.body.office_address || provider.office_address,
                                'province': req.body.province || provider.province,
                                'office_phone_number': req.body.office_phone_number || provider.office_phone_number
                            }
                        }, function(err, update) {
                            if (err) {
                                res.status(500).send(err)
                            } else {
                                res.send({ status: 200, message: 'Your Provider Profile Has Been Updated!', data: update });
                            }
                        })
                    } else {
                        res.send({ status: 403, success: false, message: 'Provider Blocked!' });
                    }
                });
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    });
}

var editCoverProvider = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else {
            if (user.role == 2) {
                Provider.findOne({ user: req.user_id }, function(err, provider) {
                    if (!provider) {
                        res.send({ status: 404, message: 'Provider Not Found' });
                    } else {
                        provider.cover = provider.cover;
                        var imageSaver = new ImageSaver();
                        var pictname = new Date().getTime();
                        if (req.body.cover != null) {
                            if (provider.cover != null) {
                                var del_pict = provider.cover.split('https://img.travinesia.com/travel_agent/cover/')[1];
                                fs.unlinkSync('../../../../home/admin/web/img.travinesia.com/public_html/travel_agent/cover/' + del_pict);

                                provider.cover = "https://img.travinesia.com/travel_agent/cover/" + pictname + ".jpg";
                                imageSaver.saveFile("../../../../home/admin/web/img.travinesia.com/public_html/travel_agent/cover/" + pictname + ".jpg", req.body.cover)
                                    .then((data) => {
                                        console.log("upload photo success");
                                    })
                                    .catch((err) => {
                                        res.json({ status: 400, message: err });
                                    })
                            } else {
                                provider.cover = "https://img.travinesia.com/travel_agent/cover/" + pictname + ".jpg";
                                imageSaver.saveFile("../../../../home/admin/web/img.travinesia.com/public_html/travel_agent/cover/" + pictname + ".jpg", req.body.cover)
                                    .then((data) => {
                                        console.log("upload photo success");
                                    })
                                    .catch((err) => {
                                        res.json({ status: 400, message: err });
                                    })
                            }
                            provider.save(function(err, provider) {
                                if (err) {
                                    res.status(500).send(err)
                                } else {
                                    res.send({ status: 200, message: 'Your cover has been updated' });
                                }
                            });
                        } else {
                            res.send({ status: 400, message: 'Make sure upload your cover picture!' });
                        }
                    }
                });
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    });
}

var editLogoProvider = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else {
            if (user.role == 2) {
                Provider.findOne({ user: req.user_id }, function(err, provider) {
                    if (!provider) {
                        res.send({ status: 404, message: 'Provider Not Found' });
                    } else {
                        provider.logo = provider.logo;
                        var imageSaver = new ImageSaver();
                        var pictname = new Date().getTime();
                        if (req.body.logo != null) {
                            if (provider.logo != null) {
                                provider.logo = "https://img.travinesia.com/travel_agent/logo/" + pictname + ".jpg";
                                imageSaver.saveFile("../../../../home/admin/web/img.travinesia.com/public_html/travel_agent/logo/" + pictname + ".jpg", req.body.logo)
                                    .then((data) => {
                                        console.log("upload photo success");
                                    })
                                    .catch((err) => {
                                        res.json({ status: 400, message: err });
                                    })
                            } else {
                                provider.logo = "https://img.travinesia.com/travel_agent/logo/" + pictname + ".jpg";
                                imageSaver.saveFile("../../../../home/admin/web/img.travinesia.com/public_html/travel_agent/logo/" + pictname + ".jpg", req.body.logo)
                                    .then((data) => {
                                        console.log("upload photo success");
                                    })
                                    .catch((err) => {
                                        res.json({ status: 400, message: err });
                                    })
                            }
                            provider.save(function(err, provider) {
                                if (err) {
                                    res.status(500).send(err)
                                } else {
                                    res.send({ status: 200, message: 'Your Logo has been updated' });
                                }
                            });
                        } else {
                            res.send({ status: 400, message: 'Make sure upload your logo!' });
                        }
                    }
                });
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    });
}

var salesTransactionProvider = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else if (err) {
            res.status(500).send(err)
        } else {
            if (user.role == 2) {
                if (err) {
                    res.send({ status: 404, success: false, message: 'Provider Not Found' });
                } else {
                    Provider.findOne({ user: req.user_id }, function(err, id_provider) {
                        if (!id_provider) {
                            res.send({ status: 404, success: false, message: 'Provider Not Found' });
                        } else {
                            Trip.find({ provider: id_provider._id, valid: 1, flag_deleted: false }, { photo_trip: { $slice: 1 } })
                                .select('trip_name photo_trip category days night publish_price quota_trip quota_left date_trip id_type_trip')
                                .populate({
                                    path: "category id_type_trip",
                                    select: 'category_name type_trip'
                                }).exec(function(err, trip) {
                                    if (err) {
                                        return res.send(err);
                                    } else if (trip) {
                                        res.send({ status: 200, success: true, message: 'Get Data Trip Success!', data: trip });
                                    } else {
                                        res.send({ status: 404, success: false, message: 'Trip Not Found' });
                                    }
                                })
                        }
                    })
                }
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    });
}

var detailSalesTransaction = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else {
            if (user.role == 2) {
                if (err) {
                    res.status(500).send(err)
                } else {
                    Trip.findById(req.params.id_trip, { photo_trip: { $slice: 1 } })
                        .select('trip_name photo_trip category days night publish_price quota_trip quota_left date_trip id_type_trip')
                        .populate({
                            path: "category id_type_trip",
                            select: 'category_name type_trip'
                        }).exec(function(err, trip) {
                            if (err) {
                                res.status(500).send(err)
                            } else {
                                Booking.find({ "id_trip": req.params.id_trip, "flag_expired": true, "flag_checkout": true })
                                    .select('order_name order_telephone created_at quantity id_statusPayment flag_expired id_statusTrip startDate_trip no_booking notes_for_provider')
                                    .populate({
                                        path: "id_statusPayment id_statusTrip",
                                        select: 'payment_status id_status status_trip'
                                    })
                                    .exec(function(err, booking) {
                                        if (err) {
                                            return res.send(err);
                                        } else {
                                            res.send({ status: 200, success: true, message: 'Get Data Detail Trip Transaction Success!', trip, booking })
                                        }
                                    })
                            }
                        })
                }
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    })
}

var detailSalesTransactionbydate = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else {
            if (user.role == 2) {
                if (err) {
                    res.status(500).send(err)
                } else {
                    Trip.findById(req.params.id_trip, { photo_trip: { $slice: 1 } })
                        .select('trip_name photo_trip category days night publish_price quota_trip quota_left date_trip id_type_trip')
                        .populate({
                            path: "category id_type_trip",
                            select: 'category_name type_trip'
                        }).exec(function(err, trip) {
                            if (err) {
                                res.status(500).send(err)
                            } else {
                                Booking.find({ "id_trip": req.params.id_trip, "flag_expired": true, "flag_checkout": true, "startDate_trip": req.params.startDate_trip })
                                    .select('order_name order_telephone created_at quantity id_statusPayment flag_expired id_statusTrip startDate_trip no_booking notes_for_provider')
                                    .populate({
                                        path: "id_statusPayment id_statusTrip",
                                        select: 'payment_status id_status status_trip'
                                    })
                                    .exec(function(err, booking) {
                                        if (err) {
                                            return res.send(err);
                                        } else {
                                            res.send({ status: 200, success: true, message: 'Get Data Detail Trip Transaction Success!', trip, booking })
                                        }
                                    })
                            }
                        })
                }
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    })
}

var addTrip = function(req, res, next) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else {
            if (user.role == 2) {
                var trip = new Trip();
                TypeTrip.findOne({ '_id': req.body.id_type_trip }, function(err, type) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (type.id_type_trip == 1) {
                        trip.service_fee = req.body.service_fee;
                        trip.fixed_price = req.body.fixed_price;
                        trip.type_trip = 1;
                        for (var i = 0; i < req.body.date_trip.length; i++) {
                            if (req.body.date_trip[i] != "" && req.body.date_trip[i] != null) {
                                trip.date_trip[i] = req.body.date_trip[i];
                            }
                        }
                        trip.checked_date = trip.date_trip.length;
                        for (var i = 0; i < trip.date_trip.length; i++) {
                            if (trip.date_trip.length == i) {
                                trip.id_status_trip[i] = 1;
                                trip.quota_left[i] = req.body.quota_trip;
                            }
                        }
                    } else if (type.id_type_trip == 2) {
                        trip.publish_price_group = req.body.publish_price_group;
                        trip.service_fee_group = req.body.service_fee_group;
                        trip.fixed_price_group = req.body.fixed_price_group;
                        trip.min_qty_group = req.body.min_qty_group;
                        trip.type_trip = 2;
                    }
                })
                trip.trip_name = req.body.trip_name;
                trip.id_type_trip = req.body.id_type_trip;
                trip.days = req.body.days;
                trip.night = req.body.days - 1;
                trip.publish_price = req.body.publish_price;
                trip.quota_trip = req.body.quota_trip;
                trip.description = req.body.description;
                trip.meeting_point = req.body.meeting_point;
                trip.direction = req.body.direction;
                trip.include = req.body.include;
                trip.exclude = req.body.exclude;
                trip.notes_traveler = req.body.notes_traveler;
                trip.notes_meeting_point = req.body.notes_meeting_point;
                trip.id_province = req.body.id_province_trip;
                trip.category = req.body.id_category;
                trip.multiple_category = req.body.multiple_category;
                trip.facility = req.body.id_facility;
                trip.time = req.body.time;
                trip.zone_time = req.body.zone_time;
                trip.longitude = req.body.longitude;
                trip.latitude = req.body.latitude;
                var myStringArray = req.body.photo_trip;
                for (var i = 0; i < myStringArray.length; i++) {
                    var imageSaver = new ImageSaver();
                    var pictname = new Date().getTime();
                    var numb = 1 + i;
                    if (req.body.photo_trip != null) {
                        trip.photo_trip[i] = "https://img.travinesia.com/travel_agent/trip/" + pictname + '-' + numb + ".jpg";
                        imageSaver.saveFile("../../../../home/admin/web/img.travinesia.com/public_html/travel_agent/trip/" + pictname + '-' + numb + ".jpg", req.body.photo_trip[i])
                            .then((data) => {
                                console.log("upload photo success");
                            })
                            .catch((err) => {
                                res.json({ status: 400, message: err });
                            })
                    } else if (req.body.photo_trip[i] == '' || req.body.photo_trip[i] == null) {
                        trip.photo_trip[i] = trip.photo_trip[i];
                    }
                }
                Provider.findOne({ user: req.user_id }, function(err, provider) {
                    if (err) {
                        return res.status(500).send(err);
                    } else if (!provider) {
                        res.send({ status: 404, success: false, message: 'Provider Not Found' });
                    } else if (provider.flag_active == true && provider.flag_blocked == false) {
                        trip.provider = provider;
                        trip.save(function(err, trip) {
                            if (err) {
                                res.status(500).send(err)
                            } else {
                                Provider.findOneAndUpdate({ user: req.user_id }, { $push: { "trips": trip } }, function(err, provider) {
                                    if (err) {
                                        return res.status(500).json({ 'error': 'Provider not found!' });
                                    } else {
                                        res.send({ status: 200, success: true, message: 'Trip Register!' });
                                    }
                                })
                            }
                        });
                    } else {
                        res.send({ status: 403, success: false, message: 'Provider Blocked!' });
                    }
                });
            } else {
                res.json({ status: 403, success: false, message: "Forbidden access for this user", token: req.token });
            }
        }
    });

}

var editTrip = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else {
            if (user.role == 2) {
                Provider.findOne({ user: req.user_id }).select('_id').exec(function(err, provider) {
                    if (err) {
                        res.send({ status: 404, message: 'Error' });
                    } else {
                        Trip.findById(req.params.id, function(err, idtrip) {
                            if (!idtrip) {
                                res.send({ status: 404, message: 'Trip not found!' });
                            } else if (provider._id.equals(idtrip.provider)) {
                                Trip.findOne({ _id: req.params.id }, function(err, trip) {
                                    if (!trip) {
                                        res.send({ status: 404, message: 'Trip Not Found' });
                                    } else {
                                        Trip.findOneAndUpdate({ _id: idtrip._id }, {
                                            $set: {
                                                'trip_name': req.body.trip_name || trip.trip_name,
                                                'publish_price': req.body.publish_price || trip.publish_price,
                                                'notes_traveler': req.body.notes_traveler || trip.notes_traveler,
                                                'notes_meeting_point': req.body.notes_meeting_point || trip.notes_meeting_point,
                                                'facility': req.body.id_facility || trip.facility,
                                                'category': req.body.id_category || trip.category,
                                                'multiple_category': req.body.multiple_category || trip.multiple_category
                                            }
                                        }, function(err, result) {
                                            if (err) {
                                                res.status(500).send(err)
                                            } else {
                                                res.send({ status: 200, success: true, message: 'Your Trip Has Been Updated!', data: result });
                                            }
                                        })
                                    }
                                });
                            } else {
                                res.send({ status: 400, success: false, message: 'Error, Trip not Found' });
                            }

                        });
                    }
                });
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    });
}

var editPhotoTrip = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else {
            if (user.role == 2) {
                Provider.findOne({ user: req.user_id }).select('_id').exec(function(err, provider) {
                    if (err) {
                        res.send({ status: 404, message: 'Error' });
                    } else {
                        Trip.findById(req.params.id, function(err, idtrip) {
                            if (!idtrip) {
                                res.send({ status: 404, message: 'Trip not found!' });
                            } else if (provider._id.equals(idtrip.provider)) {
                                for (var i = 0; i < req.body.photo_trip.length; i++) {
                                    var imageSaver = new ImageSaver();
                                    var pictname = new Date().getTime();
                                    var numb = 1 + i;
                                    //console.log(idtrip.photo_trip[i])
                                    // console.log(req.body.photo_trip[i])
                                    if (req.body.photo_trip[i] != '' && req.body.photo_trip[i] != idtrip.photo_trip[i]) {
                                        if (idtrip.photo_trip[i] != null) {
                                            var del_pict = idtrip.photo_trip[i].split('https://img.travinesia.com/travel_agent/trip/')[1];
                                            fs.unlinkSync('../../../../home/admin/web/img.travinesia.com/public_html/travel_agent/trip/' + del_pict);
                                        }
                                        idtrip.photo_trip[i] = "https://img.travinesia.com/travel_agent/trip/" + pictname + '-' + numb + ".jpg";
                                        imageSaver.saveFile("../../../../home/admin/web/img.travinesia.com/public_html/travel_agent/trip/" + pictname + '-' + numb + ".jpg", req.body.photo_trip[i])
                                            .then((data) => {
                                                console.log("upload photo success");
                                            })
                                            .catch((err) => {
                                                res.json({ status: 400, message: err });
                                            })
                                    } else if (req.body.photo_trip[i] == idtrip.photo_trip[i]) {
                                        idtrip.photo_trip[i] = idtrip.photo_trip[i];
                                    } else if (req.body.photo_trip[i] == '' || req.body.photo_trip[i] == null) {
                                        idtrip.photo_trip[i] = idtrip.photo_trip[i];
                                    }
                                }
                                Trip.updateOne({ _id: req.params.id }, { $set: { 'photo_trip': idtrip.photo_trip } }, function(err, trip_update) {
                                    if (err) {
                                        res.status(500).send(err)
                                    } else {
                                        res.send({ status: 200, message: 'Your Photo Trip Has Been Updated!', data: trip_update });
                                    }
                                });
                            } else {
                                res.send({ status: 404, message: 'Trip not found!' });
                            }
                        });
                    }
                });
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    });
}


var deleteTrip = function(req, res, next) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else {
            if (user.role == 2) {
                var trip = req.params.id;
                Provider.findOne({ user: req.user_id }).select('_id').exec(function(err, provider) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (!provider) {
                        res.send({ status: 404, success: false, message: 'Provider not found' });
                    } else {
                        Trip.findById(trip, function(err, idtrip) {
                            if (!idtrip) {
                                res.send({ status: 404, success: false, message: 'Trip not found!' });
                            } else if (provider._id.equals(idtrip.provider)) {
                                Trip.findOneAndUpdate({ _id: trip }, { $set: { 'flag_deleted': true, 'flag_request': true } }, function(err, removetrip) {
                                    if (!removetrip) {
                                        res.send({ status: 404, success: false, message: 'Trip not found!' });
                                    } else if (err) {
                                        res.status(500).send(err)
                                    } else {
                                        Provider.findOneAndUpdate({ user: req.user_id }, { $pull: { "trips": trip } }, function(err, provider) {
                                            if (!provider) {
                                                res.send({ status: 404, success: false, message: 'Provider not found!' });
                                            } else {
                                                Discussion.remove({ id_trip: trip }, function(err, discussion) {
                                                    if (!discussion) {
                                                        res.send({ status: 404, success: false, message: 'Discussion not found' });
                                                    } else {
                                                        Review.remove({ id_trip: trip }, function(err, review) {
                                                            if (!review) {
                                                                res.send({ status: 404, success: false, message: 'Review not found' });
                                                            } else {
                                                                Favorite.remove({ id_trip: trip }, function(err, favorite) {
                                                                    if (!favorite) {
                                                                        res.send({ status: 404, success: false, message: 'Favorite not found' });
                                                                    } else {
                                                                        res.json({ status: 200, success: true, message: "Trip Removed!" });
                                                                    }
                                                                })

                                                            }
                                                        })
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            } else {
                                res.send({ status: 404, message: 'Trip not found' });
                            }
                        });
                    }
                });
            } else {
                res.json({ status: 403, message: "Forbidden access for this user" });
            }
        }
    });
}

var getDetailEditTrip = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else {
            if (user.role == 2) {
                var trip = req.params.id;
                Provider.findOne({ user: req.user_id }).select('_id').exec(function(err, provider) {
                    if (err) {
                        res.send({ status: 404, message: 'Error' });
                    } else {
                        Trip.findById(trip, function(err, idtrip) {
                            if (!idtrip) {
                                res.send({ status: 404, message: 'Trip not found!' });
                            } else {
                                res.json({ status: 200, message: "succes get detail trip", data: idtrip });
                            }
                        });
                    }
                });
            } else {
                res.json({ status: 403, message: "Forbidden access for this user" });
            }
        }
    });
}


var getAllTrip = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else if (err) {
            res.send({ status: 404, message: 'Error' });
        } else {
            if (user.role == 2) {
                if (err) {
                    res.send({ status: 404, message: 'Not Found' });
                } else {
                    Provider.findOne({ user: req.user_id }, function(err, provider) {
                        if (!provider) {
                            res.send({ status: 404, message: 'Provider Not Found' });
                        } else {
                            Trip.find({ 'provider': provider._id, flag_deleted: false }, { photo_trip: { $slice: 1 } })
                                .select('trip_name photo_trip days night category id_type_trip publish_price quota_trip date_trip discount_date valid')
                                .populate({
                                    path: "id_type_trip category",
                                    select: 'type_trip category_name'
                                })
                                .exec(function(err, trip) {
                                    res.json({ status: 200, message: 'Get Trip Provider Success', trip });
                                });
                        }
                    });
                }
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    });
}

var getAllValidTrips = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else if (err) {
            res.send({ status: 404, message: 'Error' });
        } else {
            if (user.role == 2) {
                if (err) {
                    res.send({ status: 404, message: 'Not Found' });
                } else {
                    Provider.findOne({ user: req.user_id }).populate('trips').exec(function(err, providertrip) {
                        if (!providertrip) {
                            res.send({ status: 404, message: 'Provider Not Found' });
                        } else {
                            Trip.find({ valid: 1, provider: providertrip._id, flag_deleted: false }, function(err, valid_trip) {
                                if (err) {

                                } else {
                                    res.json({ status: 200, message: 'Get Valid Trip Provider Success', data: valid_trip });
                                }
                            });
                        }
                    });
                }
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    });
}

var getAllNotValidTrips = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else if (err) {
            res.send({ status: 404, message: 'Error' });
        } else {
            if (user.role == 2) {
                if (err) {
                    res.send({ status: 404, message: 'Not Found' });
                } else {
                    Provider.findOne({ user: req.user_id }).populate('trips').exec(function(err, providertrip) {
                        if (!providertrip) {
                            res.send({ status: 404, message: 'Provider Not Found' });
                        } else {
                            Trip.find({ valid: 0, provider: providertrip._id, flag_deleted: false }, function(err, notvalid_trip) {
                                if (err) {

                                } else {
                                    res.json({ status: 200, message: 'Get Valid Trip Provider Success', data: notvalid_trip });
                                }
                            });
                        }
                    });
                }
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    });
}

var withdrawProvider = function(req, res) {
    User.findById(req.user_id).select('name email password role').exec(function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else if (err) {
            res.send({ status: 404, message: 'Error' });
        } else {
            if (user.role == 2) {
                if (req.body.password) {
                    var checkPassword = user.comparePassword(req.body.password);
                } else {
                    res.json({ status: 400, success: false, message: 'No password provided' });
                    //return next();
                }
                if (!checkPassword) {
                    res.json({ status: 400, success: false, message: 'Wrong Password' });
                    //return next();
                } else {
                    Provider.findOne({ user: req.user_id }).select('_id balance flag_active flag_blocked').exec(function(err, provider) {
                        if (!provider) {
                            res.send({ status: 404, message: 'Provider not Found' });
                        } else if (err) {
                            res.send({ status: 404, message: 'Error' });
                        } else if (provider.flag_active == true && provider.flag_blocked == false) {
                            if (req.body.withdraw_total > provider.balance) {
                                res.send({ status: 404, message: 'Error: Penarikan melebihi total saldo yang ada' });
                            } else if (req.body.bank_name == null || req.body.bank_name == '' || req.body.account_number == null || req.body.account_number == '' || req.body.account_owner == null || req.body.account_owner == '' || req.body.withdraw_total == null || req.body.withdraw_total == '') {
                                res.json({ status: 400, success: false, message: 'Make sure you fill out all the forms' });
                            } else {
                                var withdraw = new Withdraw();
                                withdraw.id_provider = provider._id;
                                withdraw.bank_name = req.body.bank_name;
                                withdraw.account_number = req.body.account_number;
                                withdraw.account_owner = req.body.account_owner;
                                withdraw.withdraw_total = req.body.withdraw_total;
                                withdraw.save(function(err, withdraw) {
                                    if (err) {
                                        res.status(500).send(err)
                                    } else {
                                        res.json({ status: 200, message: 'Penarikan Diajukan', data: withdraw });
                                    }
                                });
                            }
                        } else {
                            res.send({ status: 403, success: false, message: 'Provider Blocked!' });
                        }
                    });
                }
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    });
}

var providerBalance = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else if (err) {
            res.status(500).send(err)
        } else {
            if (user.role == 2) {
                Provider.findOne({ user: req.user_id }, function(err, provider) {
                    if (!provider) {
                        res.send({ status: 404, success: false, message: 'Provider Not Found' });
                    } else {
                        Providerbalance.find({ id_provider: provider._id })
                            .sort({ created_at: 'descending' })
                            .select('mutation_flag balance_history total_withdraw created_at flag_payment total_payment quantity fixed_payment id_booking id_trip')
                            .populate({
                                path: "id_trip id_booking",
                                select: 'trip_name no_booking'
                            })
                            .exec(function(err, balance) {
                                if (!balance) {
                                    res.send({ status: 404, success: false, message: 'Balance Not Found' });
                                } else {
                                    var total_balance = provider.balance;
                                    res.json({ status: 200, success: false, message: 'Get Balance Provider Success', total_balance, balance });
                                }
                            })
                    }
                })
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    });
}

var cnfrmtripbyProvider = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else if (err) {
            res.status(500).send(err)
        } else {
            if (user.role == 2) {
                Booking.findById(req.body._id, function(err, booking) {
                    if (!booking) {
                        res.json({ status: 404, success: false, message: "Booking not found!" });
                    } else {
                        Status.findById(booking.id_statusPayment, function(err, status) {
                            if (err) {
                                return res.send(err);
                            } else if (status.id_status_payment != 2) {
                                res.send({ status: 403, success: false, message: 'Forbidden!' });
                            } else if (status.id_status_payment == 2) {
                                Statustrip.findById(booking.id_statusTrip, function(err, status_trip) {
                                    if (!status_trip) {
                                        res.json({ status: 404, success: false, message: "Status not found!" });
                                    } else {
                                        var update_status = 3;
                                        if (status_trip.id_status != update_status - 1) {
                                            res.send({ status: 403, success: false, message: 'Forbidden!', data: booking });
                                        } else {
                                            Statustrip.findOne({ 'id_status': update_status }, function(err, id_status) {
                                                if (err) {
                                                    console.log('Confirmation booking err:', err);
                                                } else {
                                                    booking.id_statusTrip = id_status._id;
                                                    booking.save(function(err, result) {
                                                        if (err) {
                                                            res.status(500).send(err)
                                                        } else {
                                                            User.findById(booking.id_user, function(err, user_email) {
                                                                if (!user) {
                                                                    res.json({ status: 404, success: false, message: "User not found!" });
                                                                } else {
                                                                    var email = {
                                                                        from: 'Travinesia, admin@travinesia.com',
                                                                        to: user_email.email,
                                                                        subject: 'Transaction Received',
                                                                        template: 'pemesanan_diterima_compiled',
                                                                        context: {
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
                                                                    res.send({ status: 200, succes: true, message: 'Confirmation Transaction Success!' });
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    }
                                })
                            }
                        })
                    }
                })
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    });
}

var config = {
    format: "A4",
    orientation: "portrait",
    border: "10mm"
}

var pdfdetailTransactionTraveller = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else if (err) {
            res.send({ status: 404, message: 'Error' });
        } else {
            if (user.role == 2) {
                var start_date = req.params.date;
                Booking.find({ 'id_trip': req.params.id_trip, 'startDate_trip': start_date })
                    .select('id_trip quantity startDate_trip traveller_identity traveller_age traveller_name order_name order_email order_telephone no_booking')
                    .populate({
                        path: "id_trip",
                        select: 'trip_name id_type_trip days night',
                        populate: {
                            path: "id_type_trip",
                            select: 'type_trip'
                        }

                    }).exec(function(err, booking) {
                        if (err) {
                            return res.send(err);
                        } else if (booking) {
                            //console.log(booking);
                            var quantity_total;
                            var total;
                            var out = [""];
                            each(booking, function(value, key, array) {
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
                            })
                            var start_trip = moment(start_date).format('YYYY-MM-DD');
                            var compare_date = moment(start_date).subtract(2, 'day').format('YYYY-MM-DD');
                            var date_now = moment(new Date()).format('YYYY-MM-DD');
                            if (moment(compare_date).isSameOrBefore(start_trip, 'day')) {
                                var booking_pdf = booking[0];
                                var booking_date = moment(booking_pdf.startDate_trip).format('dddd, D MMMM YYYY');
                                var compiled = fs.readFileSync('./views/daftar_peserta.html', 'utf8');
                                var document = {
                                    type: 'buffer',
                                    template: compiled,
                                    context: {
                                        booking: booking,
                                        booking_pdf: booking_pdf,
                                        booking_date: booking_date,
                                        total: total,
                                        out: out,
                                        img: "https://img.travinesia.com/logo/travinesia.png"
                                    }
                                };
                                pdf.create(document, config)
                                    .then(file => {
                                        var buffer = Buffer.from(file);
                                        //var arr = Array.prototype.slice.call(buffer, 0)
                                        res.send(buffer)
                                    })
                                    .catch(error => {
                                        console.error(error);
                                    })
                            } else {
                                res.send({ status: 404, message: 'Forbidden! Daftar Peserta Cannot Download' });
                            }
                        }
                    })
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    })
}

var discountbyProvider = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else if (err) {
            res.status(500).send(err)
        } else {
            if (user.role == 2) {
                Provider.findOne({ user: req.user_id }).select('_id').exec(function(err, provider) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (!provider) {
                        res.send({ status: 404, message: 'Provider not found!' });
                    } else {
                        Trip.findById(req.params.id, function(err, trip) {
                            if (err) {
                                res.status(500).send(err)
                            } else if (!trip) {
                                res.send({ status: 404, message: 'Trip not found!' });
                            } else {
                                var discount_check = false;
                                for (i = 0; i < trip.date_trip.length; i++) {
                                    if (req.body.discount_date[i] == '' || req.body.discount_date[i] == null) {
                                        trip.discount_date[i] = 0;
                                    } else {
                                        trip.discount_date[i] = req.body.discount_date[i];
                                        trip.flag_discount = 1;
                                        discount_check = true;
                                    }
                                }
                                if (discount_check == false) {
                                    trip.flag_discount = 0;
                                }
                                Trip.updateOne({ _id: req.params.id }, { $set: { 'discount_date': trip.discount_date, 'flag_discount': trip.flag_discount } }, function(err, quota_update) {
                                    if (err) {
                                        res.status(500).send(err)
                                    } else {
                                        res.send({ status: 200, message: 'Your Discount Has Been Added!', data: quota_update });
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    });
}

var setquoatanullbyProvider = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else if (err) {
            res.status(500).send(err)
        } else {
            if (user.role == 2) {
                Provider.findOne({ user: req.user_id }).select('_id').exec(function(err, provider) {
                    if (err) {
                        res.send({ status: 404, success: false, message: 'Error 2' });
                    } else if (!provider) {
                        res.send({ status: 404, success: false, message: 'Provider not found!' });
                    } else {
                        Trip.findById(req.params.id, function(err, trip) {
                            if (!trip) {
                                res.send({ status: 404, success: false, message: 'Trip not found!' });
                            } else if (provider._id.equals(trip.provider)) {
                                for (i = 0; i < trip.quota_left.length; i++) {
                                    if (req.body.quota_trip[i] == '' || req.body.quota_trip[i] == null) {
                                        trip.quota_left[i] = trip.quota_left[i];
                                    } else {
                                        trip.quota_left[i] = req.body.quota_trip[i];
                                    }
                                }
                                Trip.updateOne({ _id: req.params.id }, { $set: { 'quota_left': trip.quota_left } }, function(err, quota_update) {
                                    if (err) {
                                        res.status(500).send(err)
                                    } else {
                                        res.send({ status: 200, success: true, message: 'Your quota trip has been set null!', data: quota_update });
                                    }
                                });
                            } else {
                                res.send({ status: 404, success: false, message: 'Not Provider Trip' });
                            }
                        });
                    }
                });
            } else {
                res.json({ status: 403, success: false, message: "Forbidden access for this user", token: req.token });
            }
        }
    });
}

module.exports = {
    getProfileProvider: getProfileProvider,
    editProfileProvider: editProfileProvider,
    addTrip: addTrip,
    editTrip: editTrip,
    deleteTrip: deleteTrip,
    getAllTrip: getAllTrip,
    getAllValidTrips: getAllValidTrips,
    getAllNotValidTrips: getAllNotValidTrips,
    withdrawProvider: withdrawProvider,
    providerBalance: providerBalance,
    discountbyProvider: discountbyProvider,
    setquoatanullbyProvider: setquoatanullbyProvider,
    editPhotoTrip: editPhotoTrip,
    getDetailEditTrip: getDetailEditTrip,
    editCoverProvider: editCoverProvider,
    editLogoProvider: editLogoProvider,
    salesTransactionProvider: salesTransactionProvider,
    detailSalesTransaction: detailSalesTransaction,
    detailSalesTransactionbydate: detailSalesTransactionbydate,
    cnfrmtripbyProvider: cnfrmtripbyProvider,
    pdfdetailTransactionTraveller: pdfdetailTransactionTraveller
}