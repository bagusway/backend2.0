var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection("mongodb://localhost/backendtravinesia");

autoIncrement.initialize(connection);

var MessageSchema = new Schema({
    flag_message: { type: Number },
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Room'
    },
    from_id: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    from_name: { type: String },
    to_id: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    message_body: { type: String },
    message_status: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
})


module.exports = mongoose.model('Message', MessageSchema);