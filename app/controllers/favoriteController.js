var Trip = require('../models/trip');
var User = require('../models/user');
var Favorite = require('../models/favorite');
var each = require('foreach');

var addFavorite = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else {
            Trip.findById(req.body.id_trip, function(err, trip) {
                if (!trip) {
                    res.send({ status: 404, success: false, message: 'Trip Not Found' });
                } else {
                    Provider.findOne({ _id: trip.provider }, function(err, providerid) {
                        if (!providerid) {
                            res.send({ status: 404, success: false, message: 'Provider Not Found' });
                        } else if (providerid.user.equals(req.user_id)) {
                            res.send({ status: 400, success: false, message: 'Cannot add your own Trip to Favorite list!' });
                        } else {
                            Favorite.findOne({ id_trip: req.body.id_trip }, function(err, favorite) {
                                if (err) {
                                    res.status(500).send(err)
                                } else if (!favorite) {
                                    var favorite = new Favorite();
                                    favorite.id_trip = trip._id;
                                    favorite.id_user = user._id;
                                    favorite.save(function(err, data) {
                                        if (err) {
                                            return res.send(err);
                                        } else {
                                            res.json({ status: 200, success: true, message: "Success add favorite", data: data });
                                        }
                                    })
                                } else if (favorite) {
                                    res.send({ status: 410, success: false, message: 'Trips have been added to favorites' });
                                }
                            })
                        }
                    })
                }
            })

        }
    })
}

var getallfavoriteUser = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else {
            Favorite.find({ 'id_user': user._id })
                .select('id_trip')
                .populate({
                    path: "id_trip",
                    select: 'provider trip_name days night publish_price rate_total rate_div photo_trip flag_discount discount_date id_type_trip',
                    populate: {
                        path: "provider id_type_trip",
                        select: 'travel_name type_trip'
                    }
                })
                .exec(function(err, favorite) {
                    if (!favorite) {
                        res.send({ status: 404, success: false, message: 'Trip Favorite Not Found' });
                    } else {
                        res.json({
                            status: 200,
                            success: true,
                            message: "succes get favorite trip",
                            data: favorite
                        });
                    }
                })
        }
    })
}

var deleteFavorite = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else {
            Favorite.findByIdAndRemove(req.params.id_favorite, function(err, favorite) {
                if (!favorite) {
                    res.send({ status: 404, sucess: false, message: 'Trip Favorite Not Found' });
                } else {
                    res.json({
                        status: 200,
                        success: true,
                        message: "succes delete favorite trip"
                    });
                }
            })
        }
    })
}

var getAllfavoriteTrip = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else {
            Trip.find({}, function(err, trip) {
                if (err) {
                    res.status(500).send(err)
                } else {
                    Favorite.find({}, function(err, favorite) {
                        if (err) {
                            res.status(500).send(err)
                        } else {
                            each(trip, function(value, key1, array) {
                                each(favorite, function(value, key2, array) {
                                    if (trip[key1]._id.equals(favorite[key2].id_trip)) {
                                        trip[key1].flag_favorite = 1;
                                    } else {
                                        trip[key1].flag_favorite = 0;
                                    }
                                })
                            })
                            res.send({
                                status: 200,
                                success: true,
                                message: "succes get favorite trip favorite trip",
                                data: trip
                            });
                        }
                    })
                }
            })
        }
    })
}

module.exports = {
    addFavorite: addFavorite,
    getallfavoriteUser: getallfavoriteUser,
    deleteFavorite: deleteFavorite,
    getAllfavoriteTrip: getAllfavoriteTrip
}