var User = require('../models/user');
var Provider = require('../models/provider');
var Trip = require('../models/trip');
var Type = require('../models/type_trip');
var Discussion = require('../models/discussion/discussion');
var Comment = require('../models/discussion/comment');
var jwt = require('jsonwebtoken');
var { secret } = require('../config/index');
var ImageSaver = require('image-saver-nodejs/lib');
var multer = require('multer');
var fs = require('fs');
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

var postDiscussion = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else if (err) {
            res.send({ status: 404, message: 'Error' });
        } else {
            if (user.role == 1 || user.role == 2) {
                var id_trip = req.params.id_trip;
                Trip.findById(id_trip, function(err, trip) {
                    if (err) {
                        res.status(500).send(err)
                    } else if (!trip) {
                        res.send({ status: 404, success: false, message: 'Trip Not Found' });
                    } else if (req.body.content == null || req.body.content == '') {
                        res.json({ status: 400, success: false, message: 'Make sure you fill out all the forms' });
                    } else {
                        Provider.findOne({ _id: trip.provider }, function(err, providerid) {
                            if (!providerid) {
                                res.send({ status: 404, success: false, message: 'Provider Not Found' });
                            } else if (providerid.user.equals(req.user_id)) {
                                res.send({ status: 400, success: false, message: 'Cannot Post Discussion on your own Trip!' });
                            } else {
                                var discussion = new Discussion();
                                discussion.id_trip = id_trip;
                                discussion.id_user = req.user_id;
                                discussion.content = req.body.content;
                                discussion.provider = trip.provider;
                                discussion.save(function(err, discussion) {
                                    if (err) {
                                        res.status(500).send(err)
                                    } else {
                                        User.findById(providerid.user).select('name photo email').exec(function(err, user) {
                                            if (!user) {
                                                res.send({ status: 404, success: false, message: 'User Not Found' });
                                            } else {
                                                var email = {
                                                    from: 'Travinesia, admin@travinesia.com',
                                                    to: user.email,
                                                    subject: 'Discussion Added',
                                                    template: 'diskusi_compiled',
                                                    context: {
                                                        trip: trip.trip_name,
                                                        provider: providerid.travel_name,
                                                        discussion_trip: discussion.content,
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
                                                res.send({ status: 200, success: true, message: 'Success added the discussion', data: user, discussion: discussion.content, created: discussion.created_at });
                                            }
                                        });
                                    }
                                });
                            }
                        })
                    }
                });
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    });
}

var editDiscussion = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else if (err) {
            res.send({ status: 404, message: 'Error' });
        } else {
            if (user.role == 1 || user.role == 2) {
                Discussion.findById(req.params.id, function(err, discussion) {
                    var id_user = req.user_id;
                    var id_discussion = discussion.id_user;
                    if (!discussion) {
                        res.send({ status: 404, message: 'Discussion not Found!' });
                    } else if (id_discussion.equals(id_user)) {
                        res.send({ status: 404, message: 'Discussion not Found!' });
                    } else {
                        discussion.id_trip = discussion.id_trip;
                        discussion.id_user = req.id_user;
                        discussion.content = req.body.content || discussion.content;
                        discussion.save(function(err, discussion) {
                            if (err) {
                                res.status(500).send(err)
                            } else {
                                User.findOne({ _id: req.user_id }).select('name photo').exec(function(err, user) {
                                    if (!user) {
                                        res.send({ status: 404, message: 'User Not Found' });
                                    } else {
                                        res.send({ status: 200, message: 'Discussion edited!', data: user, discussion: discussion.content, updated: discussion.updated_at });
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

var deleteDiscussion = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else if (err) {
            res.status(500).send(err)
        } else {
            if (user.role == 1 || user.role == 2) {
                var discussion = req.params.id;
                Discussion.findByIdAndRemove(discussion, function(err, removediscussion) {
                    var id_user = req.user_id;
                    var id_discussion = removediscussion.id_user;
                    if (!removediscussion) {
                        res.send({ status: 404, success: false, message: 'Discussion not found' });
                    } else if (removediscussion == '') {
                        res.send({ status: 404, success: false, message: 'Discussion not found' });
                    } else if (id_discussion.equals(id_user)) {
                        Comment.remove({ discussion: removediscussion._id }, function(err, comment) {
                            if (!comment) {
                                res.send({ status: 404, success: false, message: 'Comment not found' });
                            } else if (err) {
                                res.status(500).send(err)
                            } else {
                                res.send({ status: 200, success: true, message: 'Discussion deleted!' });
                            }
                        });
                    } else {
                        res.send({ status: 404, message: 'Error in deleting discussion' });
                    }
                });
            } else {
                res.json({ status: 403, message: "Forbidden access for this user", token: req.token });
            }
        }
    });
}

var getAllDiscussion = function(req, res) {
    Discussion.find({ 'id_trip': req.params.id }, function(err, discussion) {
        if (err) {
            res.json({ status: 402, message: err, data: "" });
        } else {
            res.json({ status: 200, message: "succes get all discussion", data: discussion });
        }
    })
}

var getDiscussionUser = function(req, res) {
    Discussion.find({ "id_user": req.user_id })
        .select('content id_user id_trip comments created_at')
        .populate({
            path: "id_user id_trip comments",
            select: 'name photo provider trip_name photo_trip rate_div rate_total days night publish_price comment name_comment photo_comment created_at',
            populate: {
                path: "provider",
                model: "Provider",
                select: 'travel_name'
            }
        })
        .exec(function(err, discussion) {
            if (err) {
                res.status(500).send(err)
            } else if (!discussion) {
                res.json({ status: 404, success: false, message: 'Discussion not found!' });
            } else {
                Provider.findOne
                res.json({ status: 200, success: true, message: "succes get all discussion", data: discussion });
            }
        })
}

var getDiscussionProvider = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else if (err) {
            res.status(500).send(err)
        } else {
            if (user.role == 2) {
                Provider.findOne({ user: user._id }, function(err, provider) {
                    if (!provider) {
                        res.send({ status: 404, success: false, message: 'User Not Found' });
                    } else {
                        Discussion.find({ provider: provider._id })
                            .select('content id_user id_trip provider comments created_at')
                            .populate({
                                path: "id_user id_trip comments provider",
                                select: 'name photo trip_name photo_trip days night publish_price rate_total rate_div travel_name comment name_comment photo_comment flag_comment created_at'
                            })
                            .exec(function(err, discussion) {
                                if (err) {
                                    res.status(500).send(err)
                                } else if (!discussion) {
                                    res.json({ status: 404, success: false, message: 'Discussion not found!' });
                                } else {
                                    res.json({ status: 200, success: true, message: "succes get all discussion Provider", data: discussion });
                                }
                            })
                    }
                })
            }
        }
    })

}

var postComment = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, success: false, message: 'User Not Found' });
        } else if (err) {
            res.status(500).send(err)
        } else {
            if (user.role == 1 || user.role == 2) {
                Discussion.findById(req.params.id, function(err, discussion) {
                    if (!discussion) {
                        res.send({ status: 404, success: false, message: 'Discussion Not Found' });
                    } else {
                        Trip.findById(discussion.id_trip, function(err, trip) {
                            if (!trip) {
                                res.send({ status: 404, success: false, message: 'Trip Not Found' });
                            } else {
                                Provider.findOne({ user: req.user_id }).select('travel_name logo').exec(function(err, provider) {
                                    if (err) {
                                        res.send({ status: 404, success: false, message: 'Provider Not Found' });
                                    } else if (provider) {
                                        if (provider._id.equals(trip.provider)) {
                                            if (req.body.comment == null || req.body.comment == '') {
                                                res.json({ status: 400, success: false, message: 'Make sure you fill out all the forms' });
                                            } else {
                                                var trip_discussion = discussion.id_trip;
                                                var comment = new Comment;
                                                comment.id_trip = discussion.id_trip;
                                                comment.user = req.user_id;
                                                comment.name_comment = provider.travel_name;
                                                comment.photo_comment = provider.logo;
                                                comment.comment = req.body.comment;
                                                comment.flag_comment = 2;
                                                comment.discussion = discussion;
                                                comment.save(function(err, data) {
                                                    if (err) {
                                                        res.status(500).send(err)
                                                    } else {
                                                        Discussion.findOneAndUpdate({ _id: discussion._id }, { $push: { "comments": comment } }, function(err, provider) {
                                                            if (err) {
                                                                res.status(500).send(err)
                                                            } else {
                                                                res.send({ status: 200, success: true, message: 'Comment added successfully' });
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        }
                                    } else if (!provider) {
                                        User.findOne({ id_user: req.id_user }).select('name photo').exec(function(err, user) {
                                            if (!user) {
                                                res.send({ status: 404, success: false, message: 'User Not Found' });
                                            } else {
                                                if (req.body.comment == null || req.body.comment == '') {
                                                    res.json({ status: 400, success: false, message: 'Make sure you fill out all the forms' });
                                                } else {
                                                    var comment = new Comment;
                                                    comment.id_trip = discussion.id_trip;
                                                    comment.name_comment = user.name;
                                                    comment.photo_comment = user.photo;
                                                    comment.comment = req.body.comment;
                                                    comment.user = req.user_id;
                                                    comment.flag_comment = 1;
                                                    comment.discussion = discussion;
                                                    comment.save(function(err, data) {
                                                        if (err) {
                                                            res.status(500).send(err)
                                                        } else {
                                                            Discussion.findOneAndUpdate({ _id: discussion._id }, { $push: { "comments": comment } }, function(err, provider) {
                                                                if (err) {
                                                                    res.status(500).send(err)
                                                                } else {
                                                                    res.send({ status: 200, success: true, message: 'Comment added successfully' });
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            }
                                        });
                                    }


                                })
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

var editComment = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else if (err) {
            res.send({ status: 404, message: 'Error' });
        } else {
            if (user.role == 1 || user.role == 2) {
                Discussion.findById(req.body.id_discussion, function(err, discussion) {
                    if (!discussion) {
                        res.send({ status: 404, message: 'Discussion Not Found' });
                    } else {
                        Comment.findById(req.params.id, function(err, comment) {
                            if (!comment) {
                                res.send({ status: 404, message: 'Comment not Found!' });
                            } else if (comment.user != req.user_id) {
                                res.send({ status: 404, message: 'Forbidden' });
                            } else {
                                var trip_discussion = discussion.id_trip;
                                comment.id_trip = discussion.id_trip;
                                comment.comment = req.body.comment || comment.comment;
                                comment.save(function(err, Comment) {
                                    if (err) {
                                        res.status(500).send(err)
                                    } else {
                                        Provider.findOne({ user: req.user_id }).select('travel_name logo').exec(function(err, provider) {
                                            if (!provider) {
                                                res.send({ status: 404, message: 'Provider Not Found' });
                                            } else {
                                                Trip.findById(discussion.id_trip, function(err, trip) {
                                                    if (!trip) {
                                                        res.send({ status: 404, message: 'Trip Not Found' });
                                                    } else if (provider._id.equals(trip.provider)) {
                                                        res.send({ status: 200, message: 'Comment successfully changed', data: provider, comment: comment.comment, updated: comment.updated_at });
                                                    } else {
                                                        User.findOne({ id_user: req.id_user }).select('name photo').exec(function(err, user) {
                                                            if (!user) {
                                                                res.send({ status: 404, message: 'User Not Found' });
                                                            } else {
                                                                res.send({ status: 200, message: 'Comment successfully changed', data: user, comment: comment.comment, updated: comment.updated_at });
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
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

var deleteComment = function(req, res) {
    User.findById(req.user_id, function(err, user) {
        if (!user) {
            res.send({ status: 404, message: 'User Not Found' });
        } else {
            var id_comment = req.params.id;
            Comment.findById(id_comment, function(err, searchcomment) {
                var id_user = req.user_id;
                var id_comment = searchcomment.user;
                if (!searchcomment) {
                    res.send({ status: 404, message: 'Comment not Found!' });
                } else if (id_comment.equals(id_user)) {
                    Comment.findByIdAndRemove(id_comment, function(err, removecomment) {
                        if (!removecomment) {
                            res.send({ status: 404, message: 'Comment not found!' });
                        } else if (err) {
                            res.send({ status: 404, message: 'Error in deleting comment' });
                        } else {
                            Discussion.findOneAndUpdate({ id_discussion: req.params.id_discussion }, { $pull: { "comments": id_comment } }, function(err, discussion) {
                                if (err) {
                                    return res.status(500).json({ 'error': 'Error in deleting comment' });
                                } else {
                                    res.json({ status: 204, message: "Comment Removed!" });
                                }
                            });
                        }
                    });
                } else {
                    res.send({ status: 404, message: 'Comment not Found!' });
                }
            });
        }
    });
}

var getCommentDiscussion = function(req, res) {
    Comment.find({ 'id_trip': req.params.id }, function(err, comment) {
        if (err) {
            res.json({ status: 402, message: err, data: "" });
        } else {
            res.json({ status: 200, message: "succes get all comment", data: comment });
        }
    })
}

module.exports = {
    postDiscussion: postDiscussion,
    editDiscussion: editDiscussion,
    deleteDiscussion: deleteDiscussion,
    getAllDiscussion: getAllDiscussion,
    postComment: postComment,
    editComment: editComment,
    deleteComment: deleteComment,
    getCommentDiscussion: getCommentDiscussion,
    getDiscussionUser: getDiscussionUser,
    getDiscussionProvider: getDiscussionProvider
}