var User = require('./../user');
var Trip = require('./../trip');
var Discussion = require('./../discussion/discussion');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var titlize = require('mongoose-title-case');
var validate = require('mongoose-validator');
var autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection("mongodb://localhost/backendtravinesia");

autoIncrement.initialize(connection);

var CommentSchema = new Schema({
    id_trip: {
        type: Schema.Types.ObjectId,
        ref: 'Trip'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    name_comment: { type: String },
    photo_comment: { type: String },
    flag_comment: { type: String },
    comment: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    discussion: {
        type: Schema.Types.ObjectId,
        ref: 'Discussion'
    }
});

CommentSchema.plugin(autoIncrement.plugin, { model: 'Comment', field: 'id_comment', startAt: 1 });

module.exports = mongoose.model('Comment', CommentSchema);