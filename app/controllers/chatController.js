var Room = require('../models/room');
var Message = require('../models/message');
var User = require('../models/user');
var Provider = require('../models/provider');

var getRoom = function(req, res, next) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (user.role == 1 || user.role == 2) {
            Room.find({ _id: req.params.id })
                .select()
                .populate()
                .exec(function(err, room) {
                    if (err) {

                    } else if (!room) {

                    } else {

                    }
                })
        }
    })
}

var createChat = function(req, res, next) {
    User.findById(req.user_id, function(err, user) {
        if (err) {
            res.status(500).send(err)
        } else if (user.role == 1 || user.role == 2) {
            Room.findOne({ _id: req.body.id_room }, function(err, room) {
                if (!room) {
                    var new_room = new Room;
                    new_room.user = user._id;
                    new_room.provider = req.body.id_provider;
                    new_room.save(function(err, room_result) {
                        if (err) {
                            res.status(500).send(err)
                        } else {
                            var message = new Message;
                            message.flag_message = 1;
                            message.room = room_result._id;
                            message.from_id = user._id;
                            message.from_name = user.name;
                            message.to_id = room_result.user;
                            message.message_body = req.body.message_body;
                            message.save(function(err, message_result) {
                                if (err) {
                                    res.status(500).send(err)
                                } else {
                                    Room.findOneAndUpdate({ _id: room_result._id }, { $push: { "messages": message } }, function(err, room) {
                                        if (!room) {
                                            res.send({ status: 404, message: 'Room Not Found' });
                                        } else {
                                            res.json({ status: 200, message: 'Room Created!', message_result });
                                        }
                                    })
                                }
                            })
                        }
                    })
                } else if (room) {
                    var id_room = room.provider;
                    Provider.findOne({ user: user._id }, function(err, provider) {
                        var provider_room = provider._id;
                        if (!provider) {
                            res.send({ status: 404, message: 'Provider Not Found' });
                        } else if (id_room.equals(provider_room)) {
                            var message = new Message;
                            message.flag_message = 2;
                            message.room = room._id;
                            message.from_id = user._id;
                            message.to_id = room.user;
                            message.from_name = provider.travel_name;
                            message.message_body = req.body.message_body;
                            message.save(function(err, message_result) {
                                if (err) {
                                    res.status(500).send(err)
                                } else {
                                    Room.findOneAndUpdate({ _id: room._id }, { $push: { "messages": message } }, function(err, room) {
                                        if (!room) {
                                            res.send({ status: 404, message: 'Room Not Found' });
                                        } else {
                                            res.json({ status: 200, message: 'Chat Send!', message_result });
                                        }
                                    })
                                }
                            })
                        } else {
                            new Message({
                                flag_message: 1,
                                room: room._id,
                                from_id: user._id,
                                from_name: user.name,
                                to_id: room.user,
                                message_body: req.body.message_body,
                            }).save(function(err, message) {
                                if (err) {
                                    res.status(500).send(err)
                                } else {
                                    Room.findOneAndUpdate({ _id: room._id }, { $push: { "messages": message } }, function(err, room) {
                                        if (!room) {
                                            res.send({ status: 404, message: 'Room Not Found' });
                                        } else {
                                            res.json({ status: 200, message: 'Chat Send!', message });
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
}

module.exports = {
    getRoom: getRoom,
    createChat: createChat
}