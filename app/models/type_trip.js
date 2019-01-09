var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TypetripSchema = new Schema({
    id_type_trip: { type: String, },
    type_trip: { type: String, }
});

module.exports = mongoose.model('Typetrip', TypetripSchema);