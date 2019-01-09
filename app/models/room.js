var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection("mongodb://localhost/backendtravinesia");

autoIncrement.initialize(connection);

var RoomSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    provider: {
        type: Schema.Types.ObjectId,
        ref: 'Provider'
    },
    messages: [{
        type: Schema.Types.ObjectId,
        ref: 'Message'
    }],
    created_at: { type: Date, default: Date.now }
})

RoomSchema.plugin(autoIncrement.plugin, { model: 'Room', field: 'id_room', startAt: 1 });

module.exports = mongoose.model('Room', RoomSchema);