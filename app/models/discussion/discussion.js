var User = require('./../user');
var Trip = require('./../trip');
var Comment = require('./../discussion/comment');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var titlize = require('mongoose-title-case');
var validate = require('mongoose-validator');
var autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection("mongodb://localhost/backendtravinesia");

autoIncrement.initialize(connection);

var DiscussionSchema = new Schema({
    id_trip: {
        type: Schema.Types.ObjectId,
        ref: 'Trip'
    },
    id_user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    provider: {
        type: Schema.Types.ObjectId,
        ref: 'Provider'
    },
    content: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    comments: [{
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    }]
});

DiscussionSchema.plugin(autoIncrement.plugin, { model: 'Discussion', field: 'id_discussion', startAt: 1 });

module.exports = mongoose.model('Discussion', DiscussionSchema);