var Type = require('../models/type_trip');
var Category = require('../models/category_trip');
var Facility = require('../models/facility_trip');
var Trip = require('../models/trip');
var User = require('../models/user');
var Discussion = require('../models/discussion/discussion');
var Comment = require('../models/discussion/comment');
var Provider = require('../models/provider');
var Province = require('../models/province');
var Typepayment = require('../models/type_payment');
var Payment = require('../models/payment_method');
var Statuspayment = require('../models/status_payment');
var Review = require('../models/review');
var Booking = require('../models/booking');
var Expire = require('../models/booking_expire');
var Promo = require('../models/promo');
var Termscondition = require('../models/terms_condition');
var jwt = require('jsonwebtoken');
var { secret } = require('../config/index');
var ImageSaver = require('image-saver-nodejs/lib');
var multer = require('multer');
var fs = require('fs');
var pdf = require('html-pdf');
var options = { format: 'A4' };
var ejs = require('ejs');
var cron = require('node-cron');
var each = require('foreach');
var moment = require('moment');
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var hbs = require('nodemailer-express-handlebars');
var moment = require('moment');

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



var getType = function(req, res) {

    Trip.find({ 'id_type_trip': req.params.id_type_trip }, function(err, trip) {
        if (err) {
            res.json({ status: 402, message: err, data: "" });
        } else {
            res.json({
                status: 200,
                message: "succes get type",
                data: trip
            });
        }
    })
}

var getAllType = function(req, res) {
    Type.find({}, function(err, AllType) {
        if (err) {
            res.json({ status: 402, message: err, data: "" });
        } else {
            res.json({
                status: 200,
                message: "succes get all type",
                data: AllType
            });
        }
    })
}
var getCategory = function(req, res) {
    Category.find({ 'category': req.params.category }, function(err, category) {
        if (err) {
            res.json({ status: 402, message: err, data: "" });
        } else {
            res.json({
                status: 200,
                message: "succes get category",
                data: category
            });
        }
    })
}

var getAllCategory = function(req, res) {
    Category.find({}, function(err, AllCategory) {
        if (err) {
            res.json({ status: 402, message: err, data: "" });
        } else {
            res.json({
                status: 200,
                message: "succes get all category",
                data: AllCategory
            });
        }
    })
}
var getProvince = function(req, res) {
    Province.findOne({ 'id_province': req.params.id_province }, function(err, province) {
        if (err) {
            res.json({ status: 402, message: err, data: "" });
        } else {
            res.json({
                status: 200,
                message: "succes get all Trip",
                data: province
            });
        }
    })
}
var getAllProvince = function(req, res) {
    Province.find({}, function(err, AllProvince) {
        if (err) {
            res.json({ status: 402, message: err, data: "" });
        } else {
            res.json({
                status: 200,
                message: "succes get all Province",
                data: AllProvince
            });
        }
    })
}


var getFacility = function(req, res) {
    Facility.find({}, function(err, facility) {
        if (err) {
            res.json({ status: 402, message: err, data: "" });
        } else {
            res.json({
                status: 200,
                message: "succes get all facility",
                data: facility
            });
        }
    })
}

var getAllTrip = function(req, res) {
    Trip.find({ valid: 1, flag_deleted: false }).select('_id id_trip trip_name days night notes_meeting_point description publish_price photo_trip').populate('provider').exec(function(err, trip) {
        if (err) {
            res.json({ status: 402, message: err, data: "" });
        } else {
            res.json({
                status: 200,
                message: "succes get all trip",
                data: trip
            });
        }
    });
}

var searchAllTrip = function(req, res) {
    Trip.find({ $or: [{ 'id_province': req.params.id_province }, { 'category': req.params.category }] }, function(err, trip) {
        if (err) {
            res.json({ status: 402, message: err, data: "" });
        } else {
            res.json({
                status: 200,
                message: "Search success",
                data: trip
            });
        }
    });

}

var getAllDiscussion = function(req, res) {
    var trip = mongoose.Types.ObjectId(req.params.id);
    Discussion.find({ 'id_trip': trip })
        .select('content created_at comments')
        .populate({
            path: "id_user comments",
            select: 'name photo name_comment photo_comment created_at comment flag_comment'
        })
        .exec(function(err, discussion) {
            if (err) {
                res.json({ status: 404, success: false, message: "Discussion not found!", data: "" });
            } else {
                res.json({ status: 200, success: true, message: "succes get all discussion", data: discussion });
            }

        })
}

var getAllReview = function(req, res) {
    Review.find({ 'id_trip': req.params.id })
        .select('id_user rate field created_at')
        .populate({
            path: "id_user",
            select: 'name photo'
        })
        .exec(function(err, review) {
            if (err) {
                res.json({ status: 404, success: false, message: "Review not found!", data: "" });
            } else {
                res.json({ status: 200, success: true, message: "succes get all Review", data: review });
            }

        })
}

var getAllCommentDiscussion = function(req, res) {
    Comment.find({ 'id_trip': req.params.id }, function(err, comment) {
        if (err) {
            res.json({ status: 402, message: err, data: "" });
        } else {
            res.json({ status: 200, message: "succes get all comment", data: comment });
        }
    })
}

var getDetailTrip = function(req, res) {
    Trip.findById({ _id: req.params.id_trip }, function(err, detail) {
        if (err) {
            return res.send(err);
        } else if (!detail) {
            res.send({ status: 402, message: err, data: "" });
        } else {
            res.json({ status: 200, message: "succes get detail trip", data: detail });
        }
    });
}

var getDetailIDTrip = function(req, res) {
    Trip.findById(req.params.id)
        .select('_id id_trip trip_name days night date_trip notes_meeting_point description publish_price photo_trip provider id_province id_type_trip facility category notes_traveler quota_trip time zone_time rate_div rate_total quota_left latitude longitude publish_price_group min_qty_group meeting_point direction flag_discount discount_date include exclude')
        .populate({
            path: "provider id_province id_type_trip facility category multiple_category",
            select: 'travel_name office_phone_number office_address logo domain total_review province_name id_type_trip type_trip facility_name facility_photo category_name'
        })
        .exec(function(err, detail) {
            if (err) {
                return res.send(err);
            } else if (!detail) {
                res.send({ status: 404, success: false, message: "Trip not found!", data: "" });
            } else {
                Review.count({ id_trip: detail._id }, function(err, review) {
                    if (err) {

                    } else {
                        res.json({ status: 200, success: true, message: "succes get detail trip", data: detail, reviews: review });
                    }
                })
            }
        });
}

var getDetailproviderTrip = function(req, res) {
    Trip.findById(req.params.id)
        .select('_id id_trip trip_name days night date_trip notes_meeting_point description publish_price photo_trip provider id_province id_type_trip facility category notes_traveler quota_trip time zone_time rate_div rate_total quota_left publish_price_group min_qty_group latitude longitude meeting_point direction include exclude')
        .populate({
            path: "provider id_province id_type_trip category multiple_category",
            select: 'travel_name logo domain province_name type_trip category_name'
        })
        .exec(function(err, detail) {
            if (err) {
                return res.send(err);
            } else if (!detail) {
                res.send({ status: 404, success: false, message: "Trip not found!", data: "" });
            } else {
                res.json({ status: 200, success: true, message: "succes get detail trip", data: detail });
            }
        });
}

var getDetailSalinTrip = function(req, res) {
    Trip.findById(req.params.id)
        .select('_id id_trip trip_name days night date_trip notes_meeting_point description publish_price photo_trip provider id_province id_type_trip facility category notes_traveler quota_trip time zone_time rate_div rate_total quota_left latitude longitude meeting_point direction created_at include exclude')
        .populate({
            path: "provider id_province id_type_trip facility category multiple_category",
            select: 'travel_name logo province_name type_trip facility_name category_name'
        })
        .exec(function(err, detail) {
            if (err) {
                return res.send(err);
            } else if (!detail) {
                res.send({ status: 402, message: err, data: "" });
            } else {
                var detik = Date.now();
                var result = detail.created_at - detik;
                var hasil = result / 1000;
                res.json({ status: 200, message: "succes get detail trip", data: [detail, hasil] });
            }
        });
}

getTripDiscountHome = function(req, res) {
    Trip.find({ flag_discount: 1, valid: 1, flag_deleted: false }, { photo_trip: { $slice: 1 } })
        .select('provider trip_name days night publish_price rate_total rate_div photo_trip discount_date id_type_trip id_trip')
        .populate({
            path: "provider id_type_trip",
            select: 'travel_name type_trip'
        })
        .sort({ 'rate_total': -1 })
        .limit(6)
        .exec(function(err, trip_discount) {
            if (err) {
                return res.send(err);
            } else if (trip_discount == '') {
                res.send({ status: 404, success: false, message: "Discount Trip not available", data: "" });
            } else {
                res.json({ status: 200, message: "succes get discount trip", data: trip_discount });
            }
        });
}

getAllDiscountTrip = function(req, res) {
    Trip.find({ flag_discount: 1, valid: 1, flag_deleted: false }, { photo_trip: { $slice: 1 } })
        .select('provider trip_name days night publish_price rate_total rate_div photo_trip discount_date id_type_trip id_trip flag_discount discount_date')
        .populate({
            path: "provider id_type_trip",
            select: 'travel_name type_trip'
        })
        .sort({ 'rate_total': -1 })
        .exec(function(err, all_discount) {
            if (err) {
                return res.send(err);
            } else if (all_discount == '') {
                res.send({ status: 404, success: false, message: "Discount Trip not available", data: "" });
            } else {
                res.json({ status: 200, message: "succes get all discount trip", data: all_discount });
            }
        })
}

var getTypepayment = function(req, res) {
    Typepayment.find({}, function(err, type) {
        if (err) {
            res.json({ status: 402, message: err, data: "" });
        } else {
            res.json({
                status: 200,
                message: "succes get all type",
                data: type
            });
        }
    })
}

var getTypepaymentmobile = function(req, res) {
    Typepayment.find({})
        .select('id_type_payment type_payment payment_method pg_code')
        .populate({
            path: "payment_method",
            select: 'id_payment_method payment_method photo_payment'
        })
        .exec(function(err, type) {
            if (err) {
                res.json({ status: 402, message: err, data: "" });
            } else {
                res.json({
                    status: 200,
                    message: "succes get all type",
                    data: type
                });
            }
        })
}

var getPaymentmethod = function(req, res) {
    Payment.find({})
        .select('id_payment_method id_type_payment payment_method photo_payment')
        .populate({
            path: "id_type_payment",
            select: 'type_payment'
        })
        .exec(function(err, payment) {
            if (err) {
                res.json({ status: 402, message: err, data: "" });
            } else {
                res.json({
                    status: 200,
                    message: "succes get all payment",
                    data: payment
                });
            }
        })
}

var getStatuspayment = function(req, res) {
    Statuspayment.find({}, function(err, status) {
        if (err) {
            res.json({ status: 402, message: err, data: "" });
        } else {
            res.json({
                status: 200,
                message: "succes get all status payment",
                data: status
            });
        }
    })
}

var getTripname = function(req, res) {
    var name = new RegExp(req.query.search, "i")
    Trip.find({ "trip_name": name, "flag_blocked": false, "valid": 1, "flag_deleted": false })
        .select('trip_name')
        .exec(function(err, trip) {
            if (err) {
                return res.send(err);
            } else {
                res.json({
                    status: 200,
                    message: "succes get all trip name",
                    data: trip
                });
                //console.log(req.header)
            }
        })
}

var searchTripbyName = function(req, res) {
    var name = new RegExp(req.params.trip_name, "i")
    Trip.find({ 'trip_name': name, 'flag_blocked': false, 'valid': 1, 'flag_deleted': false }, { photo_trip: { $slice: 1 }, discount_date: { $slice: 1 } })
        .select('trip_name provider days night publish_price rate_total rate_div photo_trip discount_date flag_discount category id_province id_type_trip id_trip')
        .populate({
            path: "id_type_trip provider category id_province",
            select: 'type_trip travel_name category_name province_name'
        })
        .exec(function(err, trip) {
            if (err) {
                return res.send(err);
            } else if (trip == '') {
                res.json({ status: 404, success: false, message: "Trip not found!", data: "" });
            } else if (!trip) {
                res.json({ status: 404, success: false, message: "Trip not found!", data: "" });
            } else {
                res.json({
                    status: 200,
                    success: true,
                    message: "succes get trip",
                    data: trip
                });
            }
        })

}

var getTripbyCategory = function(req, res) {
    var _id = mongoose.Types.ObjectId(req.params.id_category);
    Trip.find({ flag_blocked: false, category: { $in: [_id] }, valid: 1, flag_deleted: false }, { photo_trip: { $slice: 1 } })
        .select('provider trip_name days category night publish_price rate_total rate_div photo_trip discount_date category id_province id_type_trip id_trip')
        .populate({
            path: "id_type_trip provider category id_province",
            select: 'type_trip travel_name category_name province_name'
        })
        .exec(function(err, trip) {
            if (err) {
                return res.send(err);
            } else if (trip == '') {
                res.json({ status: 404, success: false, message: "Trip not found!", data: "" });
            } else {
                res.json({
                    status: 200,
                    message: "succes get trip",
                    data: trip
                });
            }
        })
}

var searchAdvance = function(req, res) {
    var queryCond = {}
    if (req.query.name) {
        queryCond.trip_name = { $regex: req.query.name, $options: "i" };
    }
    if (req.query.id_category) {
        queryCond.category = req.query.id_category;
    }
    if (req.query.days) {
        queryCond.days = req.query.days;
    }
    if (req.query.id_type) {
        queryCond.id_type_trip = req.query.id_type;
    }
    if (req.query.date) {
        queryCond.date_trip = req.query.date;
    }
    if (req.query.location) {
        queryCond.id_province = req.query.location;
    }
    Trip.find(queryCond)
        .select('trip_name days category night publish_price rate_total rate_div photo_trip discount_date category id_province id_type_trip id_trip date_trip provider flag_discount discount_date')
        .populate({
            path: "id_type_trip provider category id_province",
            select: 'type_trip travel_name category_name province_name'
        })
        .exec(function(err, trip) {
            if (err) {
                return res.send(err);
            } else if (trip == '') {
                res.json({ status: 404, success: false, message: "Trip not found!", data: "" });
            } else {
                res.json({
                    status: 200,
                    message: "succes get all trip",
                    data: trip
                });
            }
        })
}

var getEtalaseTravel = function(req, res) {
    Provider.findOne({ _id: req.params.id })
        .select('logo cover travel_name office_phone_number slogan office_address total_review office_phone_number province created_at trips')
        .populate({
            path: "province trips",
            select: 'province_name trip_name rate_div rate_total publish_price photo_trip days night discount_date id_type_trip',
            populate: {
                path: "id_type_trip",
                model: "Typetrip",
                select: 'type_trip'
            }
        })
        .exec(function(err, provider) {
            if (err) {
                res.status(500).send(err)
            } else if (!provider) {
                res.send({ status: 404, success: false, message: 'Provider Not Found' });
            } else {
                var status_trip_7 = mongoose.Types.ObjectId("5b8d066a28b9dcb79744002c");
                var status_trip_8 = mongoose.Types.ObjectId("5b8d069828b9dcb797440103");
                Booking.count({ id_statusTrip: { $in: [status_trip_7, status_trip_8] }, id_provider: provider._id }, function(err, booking) {
                    if (err) {
                        res.status(500).send(err)
                    } else {
                        res.send({ status: 200, success: true, message: 'Get Etalase Provider Success', provider, booking_success: booking });
                    }
                })
            }
        })
}

var getEtalasebydomain = function(req, res) {
    var domain_travel = new RegExp(req.params.domain, "i")
    Provider.findOne({ domain: domain_travel })
        .select('logo cover travel_name slogan office_phone_number office_address province total_review created_at trips')
        .populate({
            path: "province trips",
            select: 'province_name discount_date flag_discount trip_name id_type_trip rate_div rate_total days night publish_price photo_trip',
            populate: {
                path: "id_type_trip",
                model: "Typetrip",
                select: 'type_trip'
            }
        })
        .exec(function(err, provider) {
            if (err) {
                res.status(500).send(err)
            } else if (!provider) {
                res.send({ status: 404, success: false, message: 'Provider Not Found' });
            } else {
                var status_trip_7 = mongoose.Types.ObjectId("5b8d066a28b9dcb79744002c");
                var status_trip_8 = mongoose.Types.ObjectId("5b8d069828b9dcb797440103");
                Booking.count({ id_statusTrip: { $in: [status_trip_7, status_trip_8] }, id_provider: provider._id }, function(err, booking) {
                    if (err) {
                        res.status(500).send(err)
                    } else {
                        res.send({ status: 200, success: true, message: 'Get Provider by Domain Success', provider, booking_success: booking });
                    }
                })
            }
        })
}

var getPromo = function(req, res) {
    Promo.find({}).select('promo_name photo_promo description created_at')
        .exec(function(err, promo) {
            if (err) {
                return res.send(err);
            } else {
                res.json({
                    status: 200,
                    message: "succes get all promo",
                    data: promo
                });
            }
        })
}

var getPromodetail = function(req, res) {
    Promo.findById(req.params.id, function(err, promo) {
        if (err) {
            return res.send(err);
        } else if (!promo) {
            res.json({ status: 404, success: false, message: 'Promo not found!' });
        } else {
            res.json({
                status: 200,
                message: "succes get detail promo",
                data: promo
            });
        }
    })
}

var getTermscondition = function(req, res) {
    Termscondition.find({}, function(err, result) {
        if (err) {
            res.json({ status: 404, message: err, data: "" });
        } else {
            res.json({
                status: 200,
                message: "succes get terms condition",
                data: result
            });
        }
    })
}

module.exports = {
    getType: getType,
    getAllType: getAllType,
    getAllCategory: getAllCategory,
    getCategory: getCategory,
    getFacility: getFacility,
    getAllTrip: getAllTrip,
    getAllProvince: getAllProvince,
    getProvince: getProvince,
    searchAllTrip: searchAllTrip,
    getAllDiscussion: getAllDiscussion,
    getAllCommentDiscussion: getAllCommentDiscussion,
    getDetailTrip: getDetailTrip,
    getTripDiscountHome: getTripDiscountHome,
    getAllDiscountTrip: getAllDiscountTrip,
    getDetailIDTrip: getDetailIDTrip,
    getTypepayment: getTypepayment,
    getPaymentmethod: getPaymentmethod,
    getStatuspayment: getStatuspayment,
    getTripname: getTripname,
    searchTripbyName: searchTripbyName,
    getTripbyCategory: getTripbyCategory,
    searchAdvance: searchAdvance,
    getTypepaymentmobile: getTypepaymentmobile,
    getEtalaseTravel: getEtalaseTravel,
    getAllReview: getAllReview,
    getDetailSalinTrip: getDetailSalinTrip,
    getDetailproviderTrip: getDetailproviderTrip,
    getEtalasebydomain: getEtalasebydomain,
    getPromo: getPromo,
    getPromodetail: getPromodetail,
    getTermscondition: getTermscondition
}