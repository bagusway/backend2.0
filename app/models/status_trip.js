var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var StatustripSchema = new Schema({
    id_status: { type: String, },
    status_trip: { type: String, }
});

module.exports = mongoose.model('Statustrip', StatustripSchema);