var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TermsconditionSchema = new Schema({
    title: { type: String },
    content: { type: [String] }
});

module.exports = mongoose.model('Termscondition', TermsconditionSchema);